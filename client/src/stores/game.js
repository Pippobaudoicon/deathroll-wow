import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { io } from 'socket.io-client'
import * as Tone from 'tone'

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
  
  // Sound
  const sounds = ref({
    synth: null,
    clickSound: null,
    rollSound: null,
    winSound: null,
    loseSound: null,
    chatSound: null
  })
  
  // Persistence functions
  const saveRoomState = (roomData, playerData) => {
    try {
      const persistedState = {
        roomId: roomData.id,
        playerName: playerData.name,
        playerId: playerData.id,
        isGuest: playerData.isGuest,
        timestamp: Date.now()
      }
      localStorage.setItem('deathroll-room-state', JSON.stringify(persistedState))
      console.log('💾 Room state saved to localStorage:', persistedState)
    } catch (err) {
      console.warn('Failed to save room state:', err)
    }
  }
  
  const getSavedRoomState = () => {
    try {
      const saved = localStorage.getItem('deathroll-room-state')
      if (!saved) return null
      
      const state = JSON.parse(saved)
      
      // Check if state is too old (expire after 24 hours)
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      if (Date.now() - state.timestamp > maxAge) {
        localStorage.removeItem('deathroll-room-state')
        console.log('🗑️ Expired room state removed')
        return null
      }
      
      console.log('📁 Retrieved saved room state:', state)
      return state
    } catch (err) {
      console.warn('Failed to retrieve saved room state:', err)
      localStorage.removeItem('deathroll-room-state')
      return null
    }
  }
  
  const clearSavedRoomState = () => {
    localStorage.removeItem('deathroll-room-state')
    console.log('🗑️ Room state cleared from localStorage')
  }
  
  // Auto-reconnect function
  const attemptAutoReconnect = () => {
    const savedState = getSavedRoomState()
    if (!savedState) {
      console.log('📋 No saved room state found')
      return false
    }
    
    console.log('🔄 Attempting auto-reconnect with saved state:', savedState)
    
    // Try to rejoin the saved room
    joinRoom(savedState.roomId, savedState.playerName, savedState.isGuest)
      .then(() => {
        console.log('✅ Auto-reconnect successful')
      })
      .catch((err) => {
        console.warn('❌ Auto-reconnect failed:', err)
        clearSavedRoomState()
      })
    
    return true
  }
  
  // Computed
  const isHost = computed(() => currentPlayer.value?.isHost || false)
  const canStartGame = computed(() => {
    return isHost.value && 
           gameStatus.value === 'lobby' && 
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
      // Initialize Tone.js
      await Tone.start()
      
      // Create synth for various sounds
      sounds.value.synth = new Tone.Synth().toDestination()
      
      // Create specific sounds using Tone.js
      sounds.value.clickSound = () => {
        sounds.value.synth.triggerAttackRelease('C4', '8n')
      }
      
      sounds.value.rollSound = () => {
        // Simulate dice roll with multiple quick notes
        const notes = ['C4', 'D4', 'E4', 'F4', 'G4']
        const now = Tone.now()
        notes.forEach((note, index) => {
          sounds.value.synth.triggerAttackRelease(note, '16n', now + (index * 0.1))
        })
      }
      
      sounds.value.winSound = () => {
        // Victory fanfare
        const fanfare = ['C5', 'E5', 'G5', 'C6']
        const now = Tone.now()
        fanfare.forEach((note, index) => {
          sounds.value.synth.triggerAttackRelease(note, '4n', now + (index * 0.2))
        })
      }
      
      sounds.value.loseSound = () => {
        // Descending loss sound
        const loss = ['G4', 'F4', 'E4', 'D4', 'C4']
        const now = Tone.now()
        loss.forEach((note, index) => {
          sounds.value.synth.triggerAttackRelease(note, '8n', now + (index * 0.15))
        })
      }
      
      sounds.value.chatSound = () => {
        sounds.value.synth.triggerAttackRelease('A4', '16n')
      }
      
      console.log('🔊 Sound system initialized')
    } catch (err) {
      console.warn('Failed to initialize sound:', err)
    }
  }
  
  const connect = () => {
    if (socket.value?.connected) {
      console.log('🔌 Already connected to server')
      return
    }
    
    if (socket.value && !socket.value.connected) {
      console.log('🔌 Reconnecting existing socket...')
      socket.value.connect()
      return
    }
    
    console.log('🔌 Creating new socket connection...')
    socket.value = io('http://localhost:3001', {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })
    
    // Socket event listeners
    socket.value.on('connect', () => {
      connected.value = true
      error.value = null
      console.log('✅ Connected to server')
    })
    
    socket.value.on('disconnect', () => {
      connected.value = false
      console.log('❌ Disconnected from server')
    })
    
    socket.value.on('error', (err) => {
      error.value = err.message
      loading.value = false
      console.error('💥 Socket error:', err)
    })
    
    // Game event listeners
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
    
    // Player joined
    socket.value.on('player-joined', (data) => {
      console.log('🎉 Player joined event handler triggered:', data)
      console.log('📊 Game data received:', data.game)
      
      currentPlayer.value = data.player
      room.value = data.room
      players.value = data.room.players
      messages.value = data.room.messages
      
      if (data.game) {
        console.log('🎮 Setting up game state from server data')
        game.value = data.game
        gameStatus.value = data.game.status === 'active' ? 'playing' : data.game.status
        currentTurn.value = data.game.currentPlayer
        rolls.value = data.game.rolls || []
        winner.value = data.game.winner || null
        
        console.log('🎯 Game state set:', {
          status: gameStatus.value,
          currentTurn: currentTurn.value?.name,
          rollsCount: rolls.value.length,
          winner: winner.value?.name
        })
      } else {
        // No active game, set lobby state
        console.log('🏠 No active game, setting lobby state')
        gameStatus.value = 'lobby'
        game.value = null
        currentTurn.value = null
        rolls.value = []
        winner.value = null
      }
      
      // Save room state to localStorage for persistence
      saveRoomState(data.room, data.player)
      
      loading.value = false
      console.log('✅ Player joined handler completed, loading set to false')
    })
    
    // Room updated
    socket.value.on('room-updated', (roomData) => {
      console.log('🏠 Room updated event:', roomData)
      room.value = roomData
      players.value = roomData.players
      messages.value = roomData.messages
      gameStatus.value = roomData.status
      
      // Update game state if included in room data
      if (roomData.game) {
        console.log('🎮 Updating game state from room update')
        game.value = roomData.game
        gameStatus.value = roomData.game.status === 'active' ? 'playing' : roomData.game.status
        currentTurn.value = roomData.game.currentPlayer
        rolls.value = roomData.game.rolls || []
        winner.value = roomData.game.winner || null
      } else if (roomData.status === 'lobby') {
        // Room is in lobby, clear game state
        console.log('🏠 Room in lobby, clearing game state')
        game.value = null
        currentTurn.value = null
        rolls.value = []
        winner.value = null
      }
    })
    
    // Player list updated
    socket.value.on('player-list-updated', (playerList) => {
      players.value = playerList
    })
    
    // Game started
    socket.value.on('game-started', (data) => {
      game.value = data.game
      room.value = data.room
      gameStatus.value = 'playing'
      currentTurn.value = data.game.currentPlayer
      rolls.value = data.game.rolls || []
      messages.value = data.room.messages
      sounds.value.rollSound?.()
    })
    
    // Dice rolled
    socket.value.on('dice-rolled', (data) => {
      const { roll, gameState, room: roomData } = data
      
      game.value = gameState
      room.value = roomData
      players.value = roomData.players // Update players array with latest states
      currentTurn.value = gameState.currentPlayer
      rolls.value = gameState.rolls || []
      messages.value = roomData.messages
      
      // Play appropriate sound
      if (roll.isEliminating) {
        if (roll.playerId === currentPlayer.value?.id) {
          sounds.value.loseSound?.()
        } else {
          sounds.value.rollSound?.()
        }
      } else {
        sounds.value.rollSound?.()
      }
    })
    
    // Game finished
    socket.value.on('game-finished', (data) => {
      gameStatus.value = 'finished'
      winner.value = data.winner
      game.value = data.gameState
      
      // Update players if room data is included
      if (data.room && data.room.players) {
        players.value = data.room.players
      }
      
      // Play win/lose sound
      if (data.winner?.id === currentPlayer.value?.id) {
        sounds.value.winSound?.()
      } else {
        sounds.value.loseSound?.()
      }
    })
    
    // Game reset
    socket.value.on('game-reset', (data) => {
      room.value = data.room
      messages.value = data.room.messages
      game.value = null
      gameStatus.value = 'lobby'
      currentTurn.value = null
      winner.value = null
      rolls.value = []
      
      // Reset players
      players.value = players.value.map(p => ({ ...p, isEliminated: false }))
    })
    
    // Chat message
    socket.value.on('new-message', (message) => {
      messages.value.push(message)
      if (message.playerId !== currentPlayer.value?.id) {
        sounds.value.chatSound?.()
      }
    })
    
    // Left room
    socket.value.on('left-room', () => {
      resetState()
    })
    
    // Player disconnected
    socket.value.on('player-disconnected', (data) => {
      players.value = data.room.players
      messages.value = data.room.messages
    })
  }

  const joinRoom = async (roomId, playerName, isGuest = true) => {
    loading.value = true
    error.value = null
    
    console.log('🔄 Starting room join...', { roomId, playerName, isGuest })
    
    try {
      // Ensure we're connected
      connect()
      
      // Wait for connection if needed
      if (!connected.value) {
        console.log('⏳ Waiting for socket connection...')
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
      
      console.log('📡 Emitting join-room event:', { roomId, playerName, isGuest })
      
      // Emit join room event
      socket.value.emit('join-room', {
        roomId,
        playerName,
        isGuest
      })
      
      // The 'player-joined' event handler in setupGameEventListeners will handle the response
      console.log('✅ Join room event emitted, waiting for server response...')
      
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
      sounds.value.clickSound?.()
    }
  }
  
  const rollDice = () => {
    if (socket.value && isMyTurn.value) {
      socket.value.emit('roll-dice')
    }
  }
  
  const sendMessage = (message) => {
    console.log('💬 Sending message:', message, 'Socket connected:', !!socket.value)
    if (socket.value && message.trim()) {
      socket.value.emit('send-message', { message: message.trim() })
      console.log('📤 Message emitted to server')
    } else {
      console.warn('❌ Cannot send message - no socket or empty message')
    }
  }
  
  const resetGame = () => {
    if (socket.value && isHost.value) {
      socket.value.emit('reset-game')
      sounds.value.clickSound?.()
    }
  }
  
  const checkRoomExists = async (roomId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/rooms/${roomId}`)
      return response.ok
    } catch {
      return false
    }
  }
  
  const resetState = () => {
    console.log('🔄 resetState called - clearing all game data')
    console.trace('resetState call stack')
    currentPlayer.value = null
    room.value = null
    players.value = []
    messages.value = []
    game.value = null
    currentTurn.value = null
    gameStatus.value = 'lobby'
    winner.value = null
    rolls.value = []
    loading.value = false
    error.value = null
  }
  
  const clearError = () => {
    error.value = null
  }
  
  const playSound = (soundName) => {
    sounds.value[soundName]?.()
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
    
    // Persistence
    getSavedRoomState,
    clearSavedRoomState,
    attemptAutoReconnect
  }
})
