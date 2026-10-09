import { DurableObject } from 'cloudflare:workers'

const DISCONNECT_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const ROLL_SUSPENSE_MS = 1000 // dice tumble shown to everyone before the result
const now = () => new Date().toISOString()

const generateRoomId = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

const roomStub = (env, roomId) => env.ROOMS.get(env.ROOMS.idFromName(roomId))

// Static assets (the built Vue app) are served by Cloudflare before this runs;
// only /api/* reaches the Worker (see run_worker_first in wrangler.jsonc).
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const [, api, rooms, rawRoomId, ws] = url.pathname.split('/')

    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', timestamp: now() })
    }

    if (api !== 'api' || rooms !== 'rooms') {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // POST /api/rooms
    if (!rawRoomId && request.method === 'POST') {
      const { hostName, isGuest = true } = await request.json().catch(() => ({}))
      if (!hostName) {
        return Response.json({ error: 'Host name is required' }, { status: 400 })
      }
      // create() returns null if the id is already taken; retry with a new id
      for (let i = 0; i < 5; i++) {
        const roomId = generateRoomId()
        const room = await roomStub(env, roomId).create(roomId, hostName, isGuest)
        if (room) return Response.json(room)
      }
      return Response.json({ error: 'Could not create room' }, { status: 500 })
    }

    const roomId = rawRoomId?.toUpperCase()
    if (!roomId) {
      return Response.json({ error: 'Not found' }, { status: 404 })
    }

    // GET /api/rooms/:roomId/ws  (WebSocket)
    if (ws === 'ws') {
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 })
      }
      return roomStub(env, roomId).fetch(request)
    }

    // GET /api/rooms/:roomId
    const room = await roomStub(env, roomId).getRoom()
    if (!room) {
      return Response.json({ error: 'Room not found' }, { status: 404 })
    }
    return Response.json(room)
  },
}

// One Durable Object per room. Holds the room + game state (persisted to DO storage
// so it survives hibernation) and the players' WebSockets.
// Wire protocol: JSON frames of { event, data }, same event names as the old Socket.IO server.
export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    ctx.blockConcurrencyWhile(async () => {
      this.room = (await ctx.storage.get('room')) || null
    })
  }

  // --- RPC from the Worker ---

  async create(id, hostName, isGuestHost) {
    if (this.room) return null
    this.room = {
      id,
      hostName,
      isGuestHost,
      maxPlayers: 8,
      status: 'lobby', // 'lobby', 'playing', 'finished'
      createdAt: now(),
      players: [],
      messages: [],
      game: null,
    }
    await this.save()
    // Room gets deleted if nobody joins
    await this.ctx.storage.setAlarm(Date.now() + DISCONNECT_TIMEOUT)
    return this.roomJSON()
  }

  getRoom() {
    return this.room ? this.roomJSON() : null
  }

  async fetch() {
    const [client, server] = Object.values(new WebSocketPair())
    this.ctx.acceptWebSocket(server)
    return new Response(null, { status: 101, webSocket: client })
  }

  // --- WebSocket handlers ---

  async webSocketMessage(ws, raw) {
    let event, data
    try {
      ({ event, data } = JSON.parse(raw))
    } catch {
      return
    }
    const handler = this.handlers[event]
    if (!handler) return
    try {
      await handler.call(this, ws, data || {})
      if (this.room) await this.save()
    } catch (error) {
      this.send(ws, 'error', { message: error.message })
    }
  }

  async webSocketClose(ws, code, reason) {
    try { ws.close(code, reason) } catch {}
    await this.handleDisconnect(ws)
  }

  async webSocketError(ws) {
    await this.handleDisconnect(ws)
  }

  async handleDisconnect(ws) {
    const player = this.socketPlayer(ws)
    if (!player) return

    player.isConnected = false
    player.disconnectedAt = Date.now()
    this.addMessage('system', `${player.name} has gone offline.`)
    await this.save()

    this.broadcast('player-disconnected', { player, room: this.roomJSON() }, ws)
    this.broadcast('player-list-updated', this.room.players, ws)

    if (!(await this.ctx.storage.getAlarm())) {
      await this.ctx.storage.setAlarm(Date.now() + DISCONNECT_TIMEOUT)
    }
  }

  // Remove players that stayed disconnected too long; delete the room once it's empty.
  async alarm() {
    if (!this.room) return
    const cutoff = Date.now() - DISCONNECT_TIMEOUT
    const stale = this.room.players.filter(p => !p.isConnected && p.disconnectedAt <= cutoff)
    stale.forEach(p => this.removePlayer(p))

    if (this.room.players.length === 0) {
      await this.deleteRoom()
      return
    }

    await this.save()
    if (stale.length) {
      this.broadcast('room-updated', this.roomJSON())
      this.broadcast('player-list-updated', this.room.players)
    }
    if (this.room.players.some(p => !p.isConnected)) {
      await this.ctx.storage.setAlarm(Date.now() + DISCONNECT_TIMEOUT)
    }
  }

  handlers = {
    'join-room'(ws, { playerName, isGuest = true, faction = 'horde' }) {
      if (!playerName) throw new Error('Room ID and player name are required')
      if (!this.room) throw new Error('Room not found')
      const room = this.room
      const name = playerName.trim()

      let player = this.socketPlayer(ws)
      if (!player) {
        // Same name already in the room = reconnection
        player = room.players.find(p => p.name.toLowerCase() === name.toLowerCase())
        if (player) {
          player.isConnected = true
          if (faction) player.faction = faction
          this.addMessage('system', `${name} has come online.`)
          // Unbind any older socket still attached to this player
          for (const other of this.ctx.getWebSockets()) {
            if (other !== ws && other.deserializeAttachment()?.playerId === player.id) {
              other.serializeAttachment(null)
            }
          }
        } else {
          if (room.players.length >= room.maxPlayers) throw new Error('Room is full')
          if (room.status === 'playing') throw new Error('Game is already in progress')
          player = {
            id: crypto.randomUUID(),
            name,
            isHost: name.toLowerCase() === room.hostName.toLowerCase() && room.players.length === 0,
            isGuest,
            faction,
            isEliminated: false,
            isConnected: true,
            joinedAt: now(),
          }
          room.players.push(player)
          this.addMessage('system', `${name} joins the party.`)
        }
        ws.serializeAttachment({ playerId: player.id })
      }

      const roomJSON = this.roomJSON()
      this.send(ws, 'player-joined', { player, room: roomJSON, game: roomJSON.game })
      this.broadcast('room-updated', roomJSON, ws)
      this.broadcast('player-list-updated', room.players, ws)
    },

    async 'leave-room'(ws) {
      const player = this.socketPlayer(ws)
      if (!player) return
      ws.serializeAttachment(null)
      this.removePlayer(player)

      if (this.room.players.length === 0) {
        await this.deleteRoom()
      } else {
        this.broadcast('room-updated', this.roomJSON(), ws)
        this.broadcast('player-list-updated', this.room.players, ws)
      }
      this.send(ws, 'left-room')
    },

    'start-game'(ws, data) {
      const player = this.requirePlayer(ws)
      if (!player.isHost) throw new Error('Only the host can start the game')
      if (!this.canStartGame()) throw new Error('Cannot start game - need at least 2 players')

      const room = this.room
      const startingRoll = data.startingRoll || 1000
      const playerIds = this.activePlayers().map(p => p.id)
      room.game = {
        status: 'active', // 'active', 'finished'
        playerIds,
        currentPlayerIndex: Math.floor(Math.random() * playerIds.length),
        currentRange: { min: 1, max: startingRoll },
        originalStartingRoll: startingRoll,
        rolls: [],
        winnerId: null,
        startedAt: now(),
        finishedAt: null,
      }
      room.status = 'playing'
      this.addMessage('game', 'The Deathroll begins. May fortune favor the bold.')
      this.addMessage('game', `${this.currentPlayer().name} rolls first.`)
      this.addMessage('game', `Roll between 1 and ${startingRoll}.`)

      this.broadcast('game-started', { game: this.gameJSON(), room: this.roomJSON() })
    },

    async 'roll-dice'(ws) {
      const player = this.requirePlayer(ws)
      const game = this.room.game
      if (!game) throw new Error('No active game found')
      if (game.status !== 'active') throw new Error('Game is not active')
      if (this.rolling) throw new Error('Dice are already rolling')
      const current = this.currentPlayer()
      if (!current || current.id !== player.id) throw new Error('Not your turn')
      if (current.isEliminated) throw new Error('Player is eliminated')

      // Everyone tumbles together, then gets the result in the same broadcast
      this.rolling = true
      this.broadcast('roll-started', { playerId: current.id, playerName: current.name, range: { ...game.currentRange } })
      await new Promise(resolve => setTimeout(resolve, ROLL_SUSPENSE_MS))
      this.rolling = false
      // The game may have been reset or the roller may have left while the dice were in the air
      if (this.room?.game !== game || game.status !== 'active' || this.currentPlayer()?.id !== current.id) {
        this.broadcast('roll-cancelled')
        return
      }

      const result = Math.floor(Math.random() * game.currentRange.max) + game.currentRange.min
      const roll = {
        id: Date.now() + Math.random(),
        playerId: current.id,
        playerName: current.name,
        result,
        range: { ...game.currentRange },
        timestamp: now(),
        isEliminating: result === 1,
      }
      game.rolls.push(roll)

      if (result === 1) {
        current.isEliminated = true
        // Reset range to original starting roll after elimination
        game.currentRange = { min: 1, max: game.originalStartingRoll }
      } else {
        game.currentRange = { min: 1, max: result }
      }
      this.nextTurn()

      this.addMessage('game', roll.isEliminating
        ? `${roll.playerName} rolls ${result} (1-${roll.range.max}). ${roll.playerName} has died.`
        : `${roll.playerName} rolls ${result} (1-${roll.range.max})`)

      if (game.status === 'finished') {
        this.room.status = 'finished'
        const winner = this.findPlayer(game.winnerId)
        this.addMessage('game', winner
          ? `${winner.name} has won the Deathroll!`
          : 'The Deathroll ends with no victor.')
      }

      const gameState = this.gameJSON()
      this.broadcast('dice-rolled', { roll, gameState, room: this.roomJSON() })
      if (game.status === 'finished') {
        this.broadcast('game-finished', { gameState, winner: gameState.winner })
      }
    },

    'send-message'(ws, { message }) {
      const player = this.requirePlayer(ws)
      if (!message || !message.trim()) throw new Error('Message cannot be empty')
      const chatMessage = this.addMessage('player', message.trim(), player)
      this.broadcast('new-message', chatMessage)
    },

    'reset-game'(ws) {
      const player = this.requirePlayer(ws)
      if (!player.isHost) throw new Error('Only the host can reset the game')
      this.room.status = 'lobby'
      this.room.game = null
      this.room.players.forEach(p => { p.isEliminated = false })
      this.addMessage('game', 'A new Deathroll is ready.')
      this.broadcast('game-reset', { room: this.roomJSON() })
    },

    'get-room-info'(ws) {
      if (!this.room) {
        this.send(ws, 'room-info', { exists: false })
        return
      }
      this.send(ws, 'room-info', {
        exists: true,
        room: this.roomJSON(),
        playerCount: this.room.players.length,
        canJoin: this.room.status === 'lobby' && this.room.players.length < this.room.maxPlayers,
      })
    },

    ping(ws) {
      this.send(ws, 'pong')
    },
  }

  // --- helpers ---

  async save() {
    await this.ctx.storage.put('room', this.room)
  }

  async deleteRoom() {
    this.room = null
    await this.ctx.storage.deleteAlarm()
    await this.ctx.storage.deleteAll()
  }

  send(ws, event, data) {
    try { ws.send(JSON.stringify({ event, data })) } catch {}
  }

  broadcast(event, data, except) {
    for (const ws of this.ctx.getWebSockets()) {
      if (ws !== except) this.send(ws, event, data)
    }
  }

  findPlayer(id) {
    return this.room?.players.find(p => p.id === id)
  }

  socketPlayer(ws) {
    return this.findPlayer(ws.deserializeAttachment()?.playerId)
  }

  requirePlayer(ws) {
    const player = this.socketPlayer(ws)
    if (!player) throw new Error('Room or player not found')
    return player
  }

  removePlayer(player) {
    const room = this.room
    room.players = room.players.filter(p => p.id !== player.id)
    this.addMessage('system', `${player.name} leaves the party.`)
    // If host leaves, transfer host to another player
    if (player.isHost && room.players.length > 0) {
      room.players[0].isHost = true
      room.hostName = room.players[0].name
      this.addMessage('system', `${room.players[0].name} is now the group leader.`)
    }
  }

  addMessage(type, message, player = null) {
    const names = { system: 'System', game: 'Game' }
    const chatMessage = {
      id: Date.now() + Math.random(),
      playerId: player?.id ?? null,
      playerName: player?.name ?? names[type],
      message,
      timestamp: now(),
      type,
    }
    // Keep only last 100 messages
    this.room.messages = [...this.room.messages, chatMessage].slice(-100)
    return chatMessage
  }

  activePlayers() {
    return this.room.players.filter(p => !p.isEliminated && p.isConnected)
  }

  canStartGame() {
    return this.room.status === 'lobby' && this.activePlayers().length >= 2
  }

  gamePlayers() {
    return this.room.game.playerIds.map(id => this.findPlayer(id)).filter(Boolean)
  }

  currentPlayer() {
    const game = this.room.game
    if (!game || game.status !== 'active') return null
    return this.findPlayer(game.playerIds[game.currentPlayerIndex]) || null
  }

  nextTurn() {
    const game = this.room.game
    const alive = this.gamePlayers().filter(p => !p.isEliminated)
    if (alive.length <= 1) {
      game.status = 'finished'
      game.winnerId = alive[0]?.id ?? null
      game.finishedAt = now()
      return
    }
    do {
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.playerIds.length
    } while (!alive.some(p => p.id === game.playerIds[game.currentPlayerIndex]))
  }

  gameJSON() {
    const game = this.room.game
    const players = this.gamePlayers()
    return {
      roomId: this.room.id,
      status: game.status,
      currentPlayer: this.currentPlayer(),
      currentRange: game.currentRange,
      originalStartingRoll: game.originalStartingRoll,
      activePlayers: players.filter(p => !p.isEliminated),
      eliminatedPlayers: players.filter(p => p.isEliminated),
      rolls: game.rolls,
      winner: this.findPlayer(game.winnerId) || null,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
      totalRolls: game.rolls.length,
    }
  }

  roomJSON() {
    const room = this.room
    return {
      id: room.id,
      hostName: room.hostName,
      isGuestHost: room.isGuestHost,
      maxPlayers: room.maxPlayers,
      playerCount: room.players.length,
      status: room.status,
      createdAt: room.createdAt,
      players: room.players,
      messages: room.messages.slice(-50),
      canStartGame: this.canStartGame(),
      game: room.game ? this.gameJSON() : null,
    }
  }
}
