<template>
  <div 
    class="min-h-screen p-4 transition-all duration-500"
    :class="[
      'faction-theme',
      gameStore.selectedFaction === 'alliance' ? 'alliance-theme' : 'horde-theme'
    ]"
  >
    <!-- Loading State -->
    <div v-if="gameStore.loading" class="flex items-center justify-center min-h-screen">
      <div class="wow-card text-center">
        <div class="loading-spinner mx-auto mb-4"></div>
        <p class="text-wow-text-secondary">Joining room...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="gameStore.error" class="flex items-center justify-center min-h-screen">
      <div class="wow-card text-center max-w-md">
        <h2 class="text-2xl font-bold text-wow-red mb-4">⚠️ Error</h2>
        <p class="text-wow-text-secondary mb-4">{{ gameStore.error }}</p>
        <button @click="goHome" class="wow-button">
          🏠 Go Home
        </button>
      </div>
    </div>

    <!-- Room View -->
    <div v-else-if="gameStore.room" class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="wow-card mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 class="wow-heading text-3xl mb-2">Room: {{ gameStore.room.id }}</h1>
            <div class="flex items-center space-x-4 text-wow-text-secondary">
              <span>👑 Host: {{ gameStore.room.hostName }}</span>
              <span>👥 Players: {{ gameStore.players.length }}/{{ gameStore.room.maxPlayers }}</span>
              <span :class="[
                'status-indicator',
                gameStore.connected ? 'connected' : 'disconnected'
              ]"></span>
              <span class="text-sm">{{ gameStore.connected ? 'Connected' : 'Disconnected' }}</span>
            </div>
          </div>
          <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 md:mt-0">
            <!-- Faction Selector -->
            <div class="order-2 sm:order-1">
              <FactionSelector />
            </div>
            
            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-2 order-1 sm:order-2">
              <button
                v-if="gameStore.gameStatus === 'finished' && gameStore.isHost"
                @click="handleResetGame"
                class="wow-button-primary text-sm sm:text-base"
              >
                🔄 New Game
              </button>
              <button 
                @click="copyRoomId" 
                :class="[
                  'wow-button transition-colors duration-300 text-sm sm:text-base',
                  copyFeedback ? 'bg-green-600 border-green-500 text-white' : ''
                ]"
                :disabled="copyFeedback"
              >
                {{ copyFeedback ? '✅ Copied!' : '📋 Copy Room ID' }}
              </button>
              <button @click="handleLeaveRoom" class="wow-button-danger text-sm sm:text-base">
                🚪 Leave Room
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <!-- Game Area -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Game Status -->
          <!-- <GameStatus /> -->

          <!-- Winner Announcement -->
          <div v-if="gameStore.gameStatus === 'finished' && gameStore.winner" class="text-center">
            <!-- Victory for the winner -->
            <div v-if="gameStore.winner.id === gameStore.currentPlayer?.id" class="wow-card winner-announcement">
              <h2 class="text-4xl font-bold text-wow-gold mb-4">
                🏆 VICTORY! 🏆
              </h2>
              <p class="text-2xl text-wow-text-primary mb-2">
                You win the Deathroll!
              </p>
              <p class="text-wow-text-secondary">
                The dice have spoken. Glory to you!
              </p>
            </div>
            
            <!-- Defeat for everyone else -->
            <div v-else class="wow-card defeat-announcement">
              <h2 class="text-4xl font-bold text-wow-red mb-4">
                💀 DEFEAT 💀
              </h2>
              <p class="text-2xl text-wow-text-primary mb-2">
                {{ gameStore.winner.name }} wins the Deathroll!
              </p>
              <p class="text-wow-text-secondary">
                The dice have spoken. Better luck next time!
              </p>
            </div>
          </div>
          
          <!-- Dice & Current Turn -->
          <DiceRoller v-if="gameStore.gameStatus === 'playing'" />
          
          <!-- Start Game Button -->
          <div v-if="gameStore.gameStatus === 'lobby'" class="text-center">
            <div class="wow-card">
              <h3 class="text-xl font-semibold mb-4">Ready to Begin?</h3>
              
              <!-- Starting Roll Input (Host Only) -->
              <div v-if="gameStore.isHost" class="mb-6">
                <div class="max-w-xs mx-auto">
                  <label class="block text-wow-text-secondary mb-2">Starting Roll Value</label>
                  <input
                    v-model.number="startingRoll"
                    type="number"
                    min="10"
                    max="10000"
                    class="wow-input text-center text-xl font-bold"
                    placeholder="1000"
                  />
                  <p class="text-xs text-wow-text-muted mt-1">
                    Players will roll between 1 and {{ startingRoll }}
                  </p>
                </div>
              </div>
              
              <div class="mb-4 text-sm text-wow-text-muted">
                Debug: canStartGame={{ gameStore.canStartGame }}, 
                gameStatus={{ gameStore.gameStatus }}, playerCount={{ gameStore.players.length }}
              </div>
              <p class="text-wow-text-secondary mb-4">
                {{ gameStore.canStartGame ? 'All set! The host can start the game.' : 'Waiting for more players to join...' }}
              </p>
              <button
                v-if="gameStore.isHost"
                @click="handleStartGame"
                :disabled="!gameStore.canStartGame || startingRoll < 10"
                class="wow-button-primary text-xl px-8 py-4"
              >
                🎮 Start Deathroll ({{ startingRoll }})
              </button>
              <p v-else-if="!gameStore.canStartGame" class="text-wow-text-muted">
                Need at least 2 players to start
              </p>
              <p v-else class="text-wow-text-muted">
                Waiting for {{ gameStore.room.hostName }} to start the game...
              </p>
            </div>
          </div>

          <!-- Roll History -->
          <RollHistory v-if="gameStore.gameStatus === 'playing' || gameStore.gameStatus === 'finished'" />
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Players List -->
          <PlayersList />
          
          <!-- Chat -->
          <ChatBox />
        </div>
      </div>
    </div>

    <!-- No room state -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="wow-card text-center">
        <p class="text-wow-text-secondary mb-4">No room found</p>
        <button @click="goHome" class="wow-button">
          🏠 Go Home
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '@/stores/game'

// Components
// import GameStatus from '@/components/GameStatus.vue'
import DiceRoller from '@/components/DiceRoller.vue'
import PlayersList from '@/components/PlayersList.vue'
import ChatBox from '@/components/ChatBox.vue'
import RollHistory from '@/components/RollHistory.vue'
import FactionSelector from '@/components/FactionSelector.vue'

const router = useRouter()
const route = useRoute()
const gameStore = useGameStore()

// Local state
const startingRoll = ref(1000)
const copyFeedback = ref(false)

// Props
const props = defineProps({
  roomId: {
    type: String,
    required: true
  }
})

// Note: Using gameStore directly in template to maintain reactivity

onMounted(async () => {
  console.log('🏠 RoomView mounted for room:', props.roomId)
  const urlParams = new URLSearchParams(window.location.search)
  const hostName = urlParams.get('host')
  const playerName = urlParams.get('player')
  
  console.log('🔍 URL params - host:', hostName, 'player:', playerName)
  console.log('🔍 Current room in store:', gameStore.room?.id)
  console.log('🔍 Current player in store:', gameStore.currentPlayer?.name)
  
  // If we're not already in this room, join it
  if (!gameStore.room || gameStore.room.id !== props.roomId) {
    if (hostName) {
      // This is a host creating a room
      console.log('👑 Joining as host:', hostName)
      try {
        await gameStore.joinRoom(props.roomId, hostName, true)
        console.log('✅ Successfully joined as host')
      } catch (error) {
        console.error('❌ Failed to join as host:', error)
        router.push('/')
      }
    } else if (playerName) {
      // This is a player joining an existing room
      console.log('👤 Joining as player:', playerName)
      try {
        await gameStore.joinRoom(props.roomId, playerName, true)
        console.log('✅ Successfully joined as player')
      } catch (error) {
        console.error('❌ Failed to join as player:', error)
        router.push('/')
      }
    } else {
      // This is someone accessing a room URL directly - redirect to home to enter name
      console.log('❌ No player info, redirecting to home to enter name')
      router.push('/')
    }
  } else {
    console.log('✅ Already in the correct room')
  }
})

// Watch for room changes
watch(() => gameStore.room, (newRoom) => {
  console.log('👀 Room changed:', newRoom?.id)
  if (newRoom && newRoom.id !== props.roomId) {
    console.log('⚠️ Room mismatch, redirecting to correct room or home')
    if (newRoom.id) {
      router.push(`/room/${newRoom.id}`)
    } else {
      router.push('/')
    }
  }
}, { immediate: false })

onUnmounted(() => {
  // Don't automatically leave room on component unmount
  // Let the user explicitly leave or handle in beforeunload
})

const handleStartGame = () => {
  gameStore.startGame(startingRoll.value)
}

const handleResetGame = () => {
  gameStore.resetGame()
}

const handleLeaveRoom = () => {
  gameStore.leaveRoom()
  router.push('/')
}

const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(`${window.location.origin}?room=${props.roomId}`)
    // Show success feedback
    copyFeedback.value = true
    // Reset feedback after 2 seconds
    setTimeout(() => {
      copyFeedback.value = false
    }, 2000)
    
  } catch (err) {
    console.error('Failed to copy room ID:', err)
  }
}

const goHome = () => {
  gameStore.resetState()
  router.push('/')
}
</script>

<style scoped>
/* Faction Theme Styles */
.faction-theme {
  transition: all 0.5s ease-in-out;
}

.alliance-theme {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
}

.horde-theme {
  background: linear-gradient(135deg, rgba(220, 20, 60, 0.05) 0%, rgba(0, 0, 0, 0.8) 100%);
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
  text-shadow: 0 0 10px rgba(74, 144, 226, 0.5);
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
  text-shadow: 0 0 10px rgba(220, 20, 60, 0.5);
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

/* Victory/Defeat theming */
.alliance-theme .winner-announcement {
  border-color: #4A90E2;
  background: radial-gradient(circle, rgba(74, 144, 226, 0.2) 0%, rgba(26, 26, 26, 0.9) 100%);
}

.alliance-theme .defeat-announcement {
  border-color: rgba(74, 144, 226, 0.3);
}

.horde-theme .winner-announcement {
  border-color: #DC143C;
  background: radial-gradient(circle, rgba(220, 20, 60, 0.2) 0%, rgba(26, 26, 26, 0.9) 100%);
}

.horde-theme .defeat-announcement {
  border-color: rgba(220, 20, 60, 0.3);
}
</style>
