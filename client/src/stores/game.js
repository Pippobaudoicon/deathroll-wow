import { defineStore } from 'pinia'
import { ref, computed, markRaw } from 'vue'
import * as Tone from 'tone'
import { createSocket } from '@/utils/socket'

const ROOM_STATE_KEY = 'deathroll-room-state'
const FACTION_KEY = 'deathroll-faction'

// Synthesized WoW-style UI cues. Each cue owns its synth so volumes never need resetting.
// Only call after Tone.start() has succeeded (needs a user gesture).
const createSounds = () => {
  const out = (node, db) => {
    node.volume.value = db
    return markRaw(node)
  }

  // Checkbox tick: a tiny woody knock with a filtered metallic edge
  const tickBody = out(new Tone.MembraneSynth({
    pitchDecay: 0.008, octaves: 3,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.02 }
  }).toDestination(), -26)
  const tickEdge = out(new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.015, sustain: 0 }
  }).connect(markRaw(new Tone.Filter(4500, 'bandpass').toDestination())), -32)

  // Dice: bone/wood knocks plus noise clicks
  const diceKnock = out(new Tone.MembraneSynth({
    pitchDecay: 0.01, octaves: 2,
    envelope: { attack: 0.001, decay: 0.06, sustain: 0, release: 0.02 }
  }).toDestination(), -16)
  const diceClack = out(new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.001, decay: 0.025, sustain: 0 }
  }).connect(markRaw(new Tone.Filter(2600, 'bandpass').toDestination())), -18)

  // Whisper: soft two-note sine ping
  const whisper = out(new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.15 }
  }).toDestination(), -26)

  // Ready check: warm, filtered brass-ish chord swell
  const horn = out(new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsawtooth', count: 3, spread: 18 },
    envelope: { attack: 0.18, decay: 0.2, sustain: 0.5, release: 0.35 }
  }).connect(markRaw(new Tone.Filter(1100, 'lowpass').toDestination())), -22)

  // Death toll: low inharmonic FM gong
  const gong = out(new Tone.FMSynth({
    harmonicity: 1.41, modulationIndex: 8,
    envelope: { attack: 0.005, decay: 1.1, sustain: 0, release: 0.6 },
    modulationEnvelope: { attack: 0.005, decay: 0.5, sustain: 0, release: 0.3 }
  }).connect(markRaw(new Tone.Filter(900, 'lowpass').toDestination())), -14)

  const mp3 = (file) => () => new Audio(`/sounds/${file}.mp3`).play().catch(() => {})
  const pick = (list) => list[Math.floor(Math.random() * list.length)]

  return {
    clickSound: () => {
      const now = Tone.now()
      tickBody.triggerAttackRelease('A4', 0.04, now)
      tickEdge.triggerAttackRelease(0.015, now)
    },

    // Dice tumble: hits bunch up then spread out and soften as they settle (~0.7s)
    rollSound: () => {
      const now = Tone.now()
      ;[0, 0.05, 0.11, 0.16, 0.24, 0.33, 0.45, 0.6].forEach((t, i) => {
        const v = 1 - i * 0.1
        const jitter = Math.random() * 0.015
        diceKnock.triggerAttackRelease(pick(['D4', 'F4', 'G4', 'A4', 'C5']), 0.05, now + t + jitter, v)
        diceClack.triggerAttackRelease(0.02, now + t + jitter + 0.003, v * 0.8)
      })
    },

    chatSound: () => {
      const now = Tone.now()
      whisper.triggerAttackRelease('E6', 0.12, now)
      whisper.triggerAttackRelease('B6', 0.2, now + 0.09, 0.7)
    },

    turnSound: () => {
      const now = Tone.now()
      horn.triggerAttackRelease(['A3', 'D4'], 0.18, now, 0.6)
      horn.triggerAttackRelease(['D4', 'F#4', 'A4', 'D5'], 0.45, now + 0.2)
    },

    deathSound: () => gong.triggerAttackRelease('D2', 1.2),

    alliance: mp3('alliance'),
    horde: mp3('horde'),
    allianceDead: mp3('alliance_defeat'),
    hordeDead: mp3('horde_defeat'),
    allianceWin: mp3('alliance_victory'),
    hordeWin: mp3('horde_victory'),
  }
}

export const useGameStore = defineStore('game', () => {
  // State
  const socket = ref(null)
  const connected = ref(false)
  const loading = ref(false)
  const error = ref(null)

  // Player & Room
  const currentPlayer = ref(null)
  const room = ref(null)
  const players = ref([])
  const messages = ref([])

  // Game State
  const game = ref(null)
  const currentTurn = ref(null)
  const gameStatus = ref('lobby') // 'lobby', 'playing', 'finished'
  const winner = ref(null)
  const rolls = ref([])
  const rollingPlayer = ref(null) // { playerId, playerName, range } while the server tumbles the dice

  // Faction State ('alliance' or 'horde'), persisted across reloads
  const selectedFaction = ref('horde')
  try {
    selectedFaction.value = localStorage.getItem(FACTION_KEY) || 'horde'
  } catch {
    // storage unavailable, keep default
  }

  // Sound cues, built once by initializeSound() after a user gesture
  let sounds = null

  // Persistence functions
  const saveRoomState = (roomData, playerData) => {
    try {
      localStorage.setItem(ROOM_STATE_KEY, JSON.stringify({
        roomId: roomData.id,
        playerName: playerData.name,
        playerId: playerData.id,
        isGuest: playerData.isGuest,
        timestamp: Date.now()
      }))
    } catch (err) {
      console.warn('Failed to save room state:', err)
    }
  }

  const getSavedRoomState = () => {
    try {
      const saved = localStorage.getItem(ROOM_STATE_KEY)
      if (!saved) return null

      const state = JSON.parse(saved)

      // Expire after 24 hours
      if (Date.now() - state.timestamp > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(ROOM_STATE_KEY)
        return null
      }
      return state
    } catch (err) {
      console.warn('Failed to retrieve saved room state:', err)
      localStorage.removeItem(ROOM_STATE_KEY)
      return null
    }
  }

  const clearSavedRoomState = () => {
    localStorage.removeItem(ROOM_STATE_KEY)
  }

  // Computed
  const isHost = computed(() => currentPlayer.value?.isHost || false)
  const canStartGame = computed(() => {
    return gameStatus.value === 'lobby' &&
           (players.value || []).filter(p => !p.isEliminated).length >= 2
  })
  const isMyTurn = computed(() => {
    return currentTurn.value?.id === currentPlayer.value?.id && gameStatus.value === 'playing'
  })
  const activePlayers = computed(() => {
    return (players.value || []).filter(p => !p.isEliminated && p.isConnected)
  })

  // Actions
  const initializeSound = async () => {
    try {
      if (sounds) return true

      // Requires a user gesture
      if (Tone.context.state === 'suspended') {
        await Tone.start()
      }
      if (Tone.context.state !== 'running') {
        console.warn('Audio context is not running, sounds may not play')
        return false
      }

      sounds = createSounds()
      return true
    } catch (err) {
      console.warn('Failed to initialize sound:', err)
      return false
    }
  }

  // Ready-check cue when the turn passes to me; slight delay so it doesn't stack on the result sounds
  const announceTurn = (previousTurn, status) => {
    const me = currentPlayer.value?.id
    if (status === 'active' && currentTurn.value?.id === me && previousTurn?.id !== me) {
      setTimeout(() => {
        if (isMyTurn.value) playSound('turnSound')
      }, 400)
    }
  }

  // Each room is its own WebSocket endpoint, so the socket is tied to a roomId
  const connect = (roomId) => {
    if (socket.value?.roomId === roomId) {
      if (!socket.value.connected) socket.value.connect()
      return
    }

    if (socket.value) socket.value.disconnect()

    socket.value = markRaw(createSocket(roomId))

    socket.value.on('connect', () => {
      connected.value = true
      error.value = null
      // After an automatic reconnect, re-join so the server binds this socket to our player
      if (currentPlayer.value && room.value?.id === roomId) {
        socket.value.emit('join-room', {
          roomId,
          playerName: currentPlayer.value.name,
          isGuest: currentPlayer.value.isGuest,
          faction: selectedFaction.value
        })
      }
    })

    socket.value.on('disconnect', () => {
      connected.value = false
    })

    socket.value.on('error', (err) => {
      error.value = err.message
      loading.value = false
      console.error('Socket error:', err)
    })

    setupGameEventListeners()

    socket.value.connect()
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
    connected.value = false
    resetState()
  }

  const setupGameEventListeners = () => {
    if (!socket.value) return

    socket.value.on('player-joined', (data) => {
      currentPlayer.value = data.player
      room.value = data.room
      players.value = data.room.players
      messages.value = data.room.messages

      if (data.game) {
        game.value = data.game
        gameStatus.value = data.game.status === 'active' ? 'playing' : data.game.status
        currentTurn.value = data.game.currentPlayer
        rolls.value = data.game.rolls || []
        winner.value = data.game.winner || null
      } else {
        gameStatus.value = 'lobby'
        game.value = null
        currentTurn.value = null
        rolls.value = []
        rollingPlayer.value = null
        winner.value = null
      }

      saveRoomState(data.room, data.player)
      loading.value = false
    })

    socket.value.on('room-updated', (roomData) => {
      room.value = roomData
      players.value = roomData.players
      messages.value = roomData.messages
      gameStatus.value = roomData.status

      if (roomData.game) {
        game.value = roomData.game
        gameStatus.value = roomData.game.status === 'active' ? 'playing' : roomData.game.status
        currentTurn.value = roomData.game.currentPlayer
        rolls.value = roomData.game.rolls || []
        winner.value = roomData.game.winner || null
      } else if (roomData.status === 'lobby') {
        game.value = null
        currentTurn.value = null
        rolls.value = []
        rollingPlayer.value = null
        winner.value = null
      }
    })

    socket.value.on('player-list-updated', (playerList) => {
      players.value = playerList
    })

    socket.value.on('game-started', (data) => {
      const previousTurn = currentTurn.value
      game.value = data.game
      room.value = data.room
      gameStatus.value = 'playing'
      currentTurn.value = data.game.currentPlayer
      rolls.value = data.game.rolls || []
      messages.value = data.room.messages
      playSound('rollSound')
      announceTurn(previousTurn, data.game.status)
    })

    // Server announces the roll to everyone, then sends the result ~1s later in one broadcast
    socket.value.on('roll-started', (data) => {
      rollingPlayer.value = data
      playSound('rollSound')
    })

    socket.value.on('roll-cancelled', () => {
      rollingPlayer.value = null
    })

    socket.value.on('dice-rolled', (data) => {
      const { roll, gameState, room: roomData } = data
      const previousTurn = currentTurn.value
      rollingPlayer.value = null

      game.value = gameState
      room.value = roomData
      players.value = roomData.players
      currentTurn.value = gameState.currentPlayer
      rolls.value = gameState.rolls || []
      messages.value = roomData.messages

      if (roll.isEliminating) {
        playSound(roll.playerId === currentPlayer.value?.id ? selectedFaction.value + 'Dead' : 'deathSound')
      }
      announceTurn(previousTurn, gameState.status)
    })

    socket.value.on('game-finished', (data) => {
      gameStatus.value = 'finished'
      winner.value = data.winner
      game.value = data.gameState

      if (data.room && data.room.players) {
        players.value = data.room.players
      }

      // Winner's faction victory sound for everyone
      if (data.winner?.faction === 'horde') {
        playSound('hordeWin')
      } else if (data.winner?.faction === 'alliance') {
        playSound('allianceWin')
      }
    })

    socket.value.on('game-reset', (data) => {
      room.value = data.room
      messages.value = data.room.messages
      game.value = null
      gameStatus.value = 'lobby'
      currentTurn.value = null
      winner.value = null
      rolls.value = []
      rollingPlayer.value = null
      players.value = players.value.map(p => ({ ...p, isEliminated: false }))
    })

    socket.value.on('new-message', (message) => {
      messages.value.push(message)
      if (message.playerId !== currentPlayer.value?.id) {
        playSound('chatSound')
      }
    })

    socket.value.on('left-room', () => {
      resetState()
    })

    socket.value.on('player-disconnected', (data) => {
      players.value = data.room.players
      messages.value = data.room.messages
    })

    socket.value.on('player-reconnected', (data) => {
      players.value = data.room.players
      messages.value = data.room.messages
    })
  }

  const joinRoom = async (roomId, playerName, isGuest = true) => {
    loading.value = true
    error.value = null

    try {
      connect(roomId)

      if (!connected.value) {
        await new Promise((resolve) => {
          const checkConnection = () => {
            if (connected.value) {
              resolve()
            } else {
              setTimeout(checkConnection, 100)
            }
          }
          checkConnection()
        })
      }

      // The 'player-joined' handler completes the join
      socket.value.emit('join-room', {
        roomId,
        playerName,
        isGuest,
        faction: selectedFaction.value
      })
    } catch (err) {
      error.value = err.message
      loading.value = false
      throw err
    }
  }

  const leaveRoom = () => {
    if (socket.value) {
      socket.value.emit('leave-room')
    }
    clearSavedRoomState()
    resetState()
  }

  const startGame = (startingRoll = 1000) => {
    if (socket.value && canStartGame.value) {
      socket.value.emit('start-game', { startingRoll })
      playSound('clickSound')
    }
  }

  const rollDice = () => {
    if (socket.value && isMyTurn.value) {
      socket.value.emit('roll-dice')
    }
  }

  const sendMessage = (message) => {
    if (socket.value && message.trim()) {
      socket.value.emit('send-message', { message: message.trim() })
    }
  }

  const resetGame = () => {
    if (socket.value && isHost.value) {
      socket.value.emit('reset-game')
      playSound('clickSound')
    }
  }

  const checkRoomExists = async (roomId) => {
    try {
      const response = await fetch(`/api/rooms/${roomId}`)
      return response.ok
    } catch {
      return false
    }
  }

  const resetState = () => {
    currentPlayer.value = null
    room.value = null
    players.value = []
    messages.value = []
    game.value = null
    currentTurn.value = null
    gameStatus.value = 'lobby'
    winner.value = null
    rolls.value = []
    rollingPlayer.value = null
    loading.value = false
    error.value = null
  }

  const clearError = () => {
    error.value = null
  }

  const playSound = async (soundName) => {
    try {
      if (!sounds && !(await initializeSound())) return

      if (Tone.context.state !== 'running') {
        await Tone.start()
      }

      if (sounds[soundName] && Tone.context.state === 'running') {
        sounds[soundName]()
      }
    } catch (err) {
      console.warn(`Failed to play sound ${soundName}:`, err)
    }
  }

  const setFaction = (faction) => {
    selectedFaction.value = faction
    try {
      localStorage.setItem(FACTION_KEY, faction)
    } catch (err) {
      console.warn('Failed to save faction:', err)
    }
  }

  return {
    // State
    socket,
    connected,
    loading,
    error,
    currentPlayer,
    room,
    players,
    messages,
    game,
    currentTurn,
    gameStatus,
    winner,
    rolls,
    rollingPlayer,
    selectedFaction,

    // Computed
    isHost,
    canStartGame,
    isMyTurn,
    activePlayers,

    // Actions
    initializeSound,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    startGame,
    rollDice,
    sendMessage,
    resetGame,
    checkRoomExists,
    resetState,
    clearError,
    playSound,
    setFaction,

    // Persistence
    getSavedRoomState,
    clearSavedRoomState
  }
})
