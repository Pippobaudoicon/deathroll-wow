<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="max-w-2xl w-full">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="wow-heading text-6xl mb-4">
          🎲 DEATHROLL 🎲
        </h1>
        <p class="text-xl text-wow-text-secondary wow-text-shadow">
          World of Warcraft's Most Thrilling Dice Game
        </p>
        <p class="text-wow-text-muted mt-2">
          Roll the dice, tempt fate, be the last one standing!
        </p>
        
        <!-- Auto-reconnect indicator -->
        <div v-if="autoReconnecting" class="mt-4 p-4 bg-wow-blue bg-opacity-20 border border-wow-blue rounded">
          <div class="flex items-center justify-center space-x-2">
            <div class="loading-spinner"></div>
            <span class="text-wow-blue">Checking for previous session...</span>
          </div>
        </div>
      </div>

      <!-- Main Menu -->
      <div class="wow-card space-y-6">
        <div class="grid md:grid-cols-2 gap-6">
          <!-- Create Room -->
          <div class="space-y-4">
            <h2 class="wow-subheading text-center">Create New Room</h2>
            <div class="space-y-3">
              <input
                v-model="hostName"
                type="text"
                placeholder="Enter your name"
                class="wow-input w-full"
                maxlength="20"
                @keyup.enter="handleCreateRoom"
              />
              <button
                @click="handleCreateRoom"
                :disabled="!hostName.trim() || loading"
                class="wow-button-primary w-full"
              >
                <span v-if="loading" class="flex items-center justify-center">
                  <div class="loading-spinner mr-2"></div>
                  Creating...
                </span>
                <span v-else>🏠 Create Room</span>
              </button>
            </div>
          </div>

          <!-- Join Room -->
          <div class="space-y-4">
            <h2 class="wow-subheading text-center">Join Existing Room</h2>
            <div class="space-y-3">
              <input
                v-model="playerName"
                type="text"
                placeholder="Enter your name"
                class="wow-input w-full"
                maxlength="20"
              />
              <input
                v-model="roomId"
                type="text"
                placeholder="Room ID (e.g. ABC123)"
                class="wow-input w-full"
                maxlength="6"
                @input="roomId = roomId.toUpperCase()"
                @keyup.enter="handleJoinRoom"
              />
              <button
                @click="handleJoinRoom"
                :disabled="!playerName.trim() || !roomId.trim() || loading"
                class="wow-button w-full"
              >
                <span v-if="loading" class="flex items-center justify-center">
                  <div class="loading-spinner mr-2"></div>
                  Joining...
                </span>
                <span v-else>🚪 Join Room</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="wow-panel p-4 bg-wow-red bg-opacity-20 border-wow-red">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <span class="text-2xl mr-2">⚠️</span>
              <span class="text-wow-red font-semibold">{{ error }}</span>
            </div>
            <button @click="clearError" class="text-wow-red hover:text-red-400">
              ✕
            </button>
          </div>
        </div>

        <!-- Game Rules -->
        <div class="wow-panel p-6 bg-wow-bg-medium bg-opacity-50">
          <h3 class="text-lg font-semibold text-wow-gold mb-3">📜 Game Rules</h3>
          <ul class="space-y-2 text-wow-text-secondary">
            <li class="flex items-start">
              <span class="text-wow-gold mr-2">1.</span>
              The first player rolls 1-1000 (or any starting number)
            </li>
            <li class="flex items-start">
              <span class="text-wow-gold mr-2">2.</span>
              Each following player rolls 1 to the previous roll result
            </li>
            <li class="flex items-start">
              <span class="text-wow-gold mr-2">3.</span>
              Rolling a 1 eliminates you from the game
            </li>
            <li class="flex items-start">
              <span class="text-wow-gold mr-2">4.</span>
              Last player standing wins!
            </li>
          </ul>
        </div>

        <!-- Connection Status -->
        <div class="text-center">
          <div class="flex items-center justify-center space-x-2">
            <div :class="[
              'status-indicator',
              connected ? 'connected' : 'disconnected'
            ]"></div>
            <span class="text-sm text-wow-text-muted">
              {{ connected ? 'Connected to server' : 'Disconnected from server' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

const router = useRouter()
const gameStore = useGameStore()

// Reactive data
const hostName = ref('')
const playerName = ref('')
const roomId = ref('')
const autoReconnecting = ref(false)

// Computed
const { loading, error, connected } = gameStore

onMounted(async () => {
  // Initialize sound
  gameStore.initializeSound()
  
  // Connect to server to show connection status
  gameStore.connect()
  
  // Check for saved room state and attempt auto-reconnect
  console.log('� Checking for saved room state...')
  const savedState = gameStore.getSavedRoomState()
  
  if (savedState) {
    console.log('🔄 Found saved room state, attempting auto-reconnect...')
    
    autoReconnecting.value = true
    
    // Show the user we're auto-reconnecting
    const shouldReconnect = confirm(
      `Resume your previous session?\n\nRoom: ${savedState.roomId}\nPlayer: ${savedState.playerName}\n\nClick OK to reconnect or Cancel to start fresh.`
    )
    
    if (shouldReconnect) {
      // Navigate directly to the room - RoomView will handle the actual reconnection
      router.push(`/room/${savedState.roomId}?player=${encodeURIComponent(savedState.playerName)}`)
      return
    } else {
      // User chose not to reconnect, clear saved state
      gameStore.clearSavedRoomState()
      autoReconnecting.value = false
    }
  }
  
  // Only reset state if we don't have a current player and no auto-reconnect
  if (!gameStore.currentPlayer) {
    console.log('🔄 Fresh home visit, resetting state')
    gameStore.resetState()
  } else {
    console.log('🔄 Returning to home with existing player, keeping state')
  }
})

const handleCreateRoom = async () => {
  if (!hostName.value.trim()) return
  
  gameStore.playSound('clickSound')
  
  try {
    console.log('🏠 Creating room with host:', hostName.value.trim())
    
    // Step 1: Create the room via API
    const response = await fetch('http://localhost:3001/api/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostName: hostName.value.trim(), isGuest: true }),
    })
    
    if (!response.ok) {
      throw new Error('Failed to create room')
    }

    const roomData = await response.json()
    console.log('✅ Room created via API:', roomData.id)
    
    // Step 2: Navigate immediately with room ID in URL
    // The RoomView will handle joining the room
    router.push(`/room/${roomData.id}?host=${encodeURIComponent(hostName.value.trim())}`)
    
  } catch (err) {
    console.error('❌ Failed to create room:', err)
    gameStore.error = err.message
  }
}

const handleJoinRoom = async () => {
  if (!playerName.value.trim() || !roomId.value.trim()) return
  
  gameStore.playSound('clickSound')
  
  try {
    console.log('🚪 Joining room:', roomId.value.trim(), 'as:', playerName.value.trim())
    router.push(`/room/${roomId.value.trim()}?player=${encodeURIComponent(playerName.value.trim())}`)
  } catch (err) {
    console.error('❌ Failed to join room:', err)
  }
}

const clearError = () => {
  gameStore.clearError()
}
</script>
