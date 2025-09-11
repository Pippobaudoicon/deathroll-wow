<template>
  <div 
    class="min-h-screen flex items-center justify-center p-4 transition-all duration-500"
    :class="[
      'faction-theme',
      gameStore.selectedFaction === 'alliance' ? 'alliance-theme' : 'horde-theme'
    ]"
  >
    <div class="max-w-2xl w-full relative">
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

            <!-- Faction Selector - Top Right Corner -->
      <div class="flex justify-center mb-8">
        <FactionSelector />
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
                data-player="host"
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
                data-player="join"
                maxlength="20"
                @keyup.enter="handleJoinRoom"
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
      </div>

      <!-- Game Info Container -->
      <div class="space-y-6 mt-6">
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
      </div> <!-- Close Game Info Container -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import { API_URL } from '@/config/env'
import FactionSelector from '@/components/FactionSelector.vue'

const router = useRouter()
const gameStore = useGameStore()

// Reactive data
const hostName = ref('')
const playerName = ref('')
const roomId = ref('')
const autoReconnecting = ref(false)

// Computed
const { loading, error } = gameStore

onMounted(async () => {
  // Connect to server to show connection status
  gameStore.connect()

  // Check for ?room=roomId in URL
  const urlParams = new URLSearchParams(window.location.search)
  const roomParam = urlParams.get('room')
  if (roomParam) {
    // If room param exists, prefill roomId input
    roomId.value = roomParam.toUpperCase()
    await nextTick()
    // Optionally focus the playerName input
    const playerInput = document.querySelector('input[data-player="join"]')
    if (playerInput) playerInput.focus()
  }

  // Check for saved room state and attempt auto-reconnect
  console.log('🔄 Checking for saved room state...')
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
  
  // Fire-and-forget sound play
  gameStore.playSound('clickSound').catch(() => {}) // Silently handle any sound errors
  
  try {
    console.log('🏠 Creating room with host:', hostName.value.trim())
    
    // Step 1: Create the room via API
    const response = await fetch(`${API_URL}/api/rooms`, {
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
  
  // Fire-and-forget sound play
  gameStore.playSound('clickSound').catch(() => {}) // Silently handle any sound errors
  
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

<style scoped>
/* Faction Theme Styles */
.faction-theme {
  transition: all 0.5s ease-in-out;
}

.alliance-theme {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%);
}

.horde-theme {
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.05) 0%, rgba(0, 0, 0, 0.9) 100%);
}

/* Alliance themed cards */
.alliance-theme .wow-card {
  border-color: rgba(74, 144, 226, 0.3);
  background: linear-gradient(145deg, rgba(74, 144, 226, 0.05) 0%, rgba(26, 26, 26, 0.95) 100%);
}

.alliance-theme .wow-card:hover {
  border-color: rgba(74, 144, 226, 0.5);
  box-shadow: 0 0 20px rgba(74, 144, 226, 0.2);
}

.alliance-theme .wow-heading {
  color: #87CEEB;
  text-shadow: 0 0 15px rgba(74, 144, 226, 0.6);
}

/* Horde themed cards */
.horde-theme .wow-card {
  border-color: rgba(220, 20, 60, 0.3);
  background: linear-gradient(145deg, rgba(220, 20, 60, 0.05) 0%, rgba(26, 26, 26, 0.95) 100%);
}

.horde-theme .wow-card:hover {
  border-color: rgba(220, 20, 60, 0.5);
  box-shadow: 0 0 20px rgba(220, 20, 60, 0.2);
}

.horde-theme .wow-heading {
  color: #FFB6C1;
  text-shadow: 0 0 15px rgba(220, 20, 60, 0.6);
}

/* Button theming */
.alliance-theme .wow-button-primary {
  background: linear-gradient(145deg, #4A90E2 0%, #2c5aa0 100%);
  border-color: #4A90E2;
  color: #87CEEB;
}

.alliance-theme .wow-button-primary:hover {
  background: linear-gradient(145deg, #5ba0f2 0%, #3c6ab0 100%);
  box-shadow: 0 0 15px rgba(74, 144, 226, 0.5);
}

.horde-theme .wow-button-primary {
  background: linear-gradient(145deg, #DC143C 0%, #a0102c 100%);
  border-color: #DC143C;
  color: #FFB6C1;
}

.horde-theme .wow-button-primary:hover {
  background: linear-gradient(145deg, #ec244c 0%, #b0203c 100%);
  box-shadow: 0 0 15px rgba(220, 20, 60, 0.5);
}
</style>
