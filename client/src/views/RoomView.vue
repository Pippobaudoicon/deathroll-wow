<template>
  <div class="min-h-screen p-3 sm:p-4">
    <!-- Loading State -->
    <div v-if="gameStore.loading" class="flex items-center justify-center min-h-screen">
      <div class="wow-frame text-center px-10 py-8">
        <div class="rune-spinner mx-auto mb-5"></div>
        <p class="wow-title text-lg">Entering world...</p>
        <p class="font-ui text-sm text-white/60 mt-1">Joining room</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="gameStore.error" class="flex items-center justify-center min-h-screen">
      <div class="wow-frame text-center max-w-md w-full pt-8">
        <div class="wow-frame-title">Error</div>
        <p class="font-ui text-chan-error mb-5">{{ gameStore.error }}</p>
        <button @click="goHome" class="wow-btn">Return Home</button>
      </div>
    </div>

    <!-- Room View -->
    <div v-else-if="gameStore.room" class="max-w-7xl mx-auto">
      <!-- Header -->
      <header class="wow-frame px-4 py-3 sm:px-6 mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="min-w-0">
          <h1 class="wow-title text-2xl sm:text-3xl leading-tight">Room {{ gameStore.room.id }}</h1>
          <p class="font-ui text-sm text-white/80">
            Hosted by <span class="text-gold-light">{{ gameStore.room.hostName }}</span>
            <span class="text-gold-dark mx-1">&bull;</span>
            {{ gameStore.players.length }}/{{ gameStore.room.maxPlayers }} players
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <!-- Connection (latency bar) -->
          <div class="group relative flex items-end gap-0.5 h-4 px-1" tabindex="0" :aria-label="connectionText">
            <span
              v-for="n in 3"
              :key="n"
              class="latency-bar w-1"
              :class="n <= connectionBars ? connectionColor : 'bg-white/15'"
              :style="{ height: `${n * 33}%` }"
            ></span>
            <div class="wow-tooltip absolute right-0 top-full mt-2 z-20 whitespace-nowrap hidden group-hover:block group-focus:block">
              <p class="text-white">Network</p>
              <p :class="connectionTextColor">{{ connectionText }}</p>
            </div>
          </div>

          <FactionSelector compact />

          <div class="flex flex-wrap gap-2">
            <button
              v-if="gameStore.gameStatus === 'finished' && gameStore.isHost"
              @click="handleResetGame"
              class="wow-btn px-4 py-1.5 text-sm"
            >
              New Game
            </button>
            <button @click="copyRoomId" :disabled="copyFeedback" class="wow-btn-steel px-4 py-1.5 text-sm">
              <span v-if="copyFeedback" class="text-chan-system">Copied!</span>
              <span v-else>Invite</span>
            </button>
            <button @click="handleLeaveRoom" class="wow-btn px-4 py-1.5 text-sm">
              Leave Party
            </button>
          </div>
        </div>
      </header>

      <div class="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 lg:gap-8">
        <!-- Main column -->
        <div class="space-y-8 min-w-0">
          <GameOverBanner v-if="gameStore.gameStatus === 'finished' && gameStore.winner" />

          <DiceRoller v-if="gameStore.gameStatus === 'playing'" />

          <!-- Lobby: Ready Check -->
          <section v-if="gameStore.gameStatus === 'lobby'" class="wow-frame text-center pt-9 pb-7">
            <div class="wow-frame-title">Ready Check</div>
            <h2 class="wow-title text-2xl sm:text-3xl mb-1">Ready to Begin?</h2>
            <p class="font-ui text-white/80">
              {{ gameStore.canStartGame ? 'All set! The host can start the game.' : 'Waiting for more players to join...' }}
            </p>

            <hr class="wow-divider max-w-sm mx-auto" />

            <div v-if="gameStore.isHost">
              <div class="max-w-[12rem] mx-auto mb-6">
                <label for="starting-roll" class="wow-label block mb-2">Starting Roll</label>
                <input
                  id="starting-roll"
                  v-model.number="startingRoll"
                  type="number"
                  min="10"
                  max="10000"
                  class="wow-input text-center text-xl"
                  placeholder="1000"
                />
                <p class="font-chat text-xs text-white/60 mt-1">
                  Players will roll between 1 and {{ startingRoll }}
                </p>
              </div>
              <button
                @click="handleStartGame"
                :disabled="!gameStore.canStartGame || startingRoll < 10"
                class="wow-btn wow-btn-lg"
              >
                Start Deathroll ({{ startingRoll }})
              </button>
            </div>
            <p v-else-if="!gameStore.canStartGame" class="font-ui text-white/60">
              Need at least 2 players to start
            </p>
            <p v-else class="font-ui text-white/60">
              Waiting for <span class="text-gold-light">{{ gameStore.room.hostName }}</span> to start...
            </p>
          </section>

          <RollHistory v-if="gameStore.gameStatus === 'playing' || gameStore.gameStatus === 'finished'" />
        </div>

        <!-- Sidebar -->
        <aside class="space-y-8 min-w-0">
          <PlayersList />
          <ChatBox />
        </aside>
      </div>
    </div>

    <!-- No room state -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="wow-frame text-center max-w-md w-full pt-8">
        <div class="wow-frame-title">Room Not Found</div>
        <p class="font-ui text-white/80 mb-5">This room does not exist or has been disbanded.</p>
        <button @click="goHome" class="wow-btn">Return Home</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'

import DiceRoller from '@/components/DiceRoller.vue'
import GameOverBanner from '@/components/GameOverBanner.vue'
import PlayersList from '@/components/PlayersList.vue'
import ChatBox from '@/components/ChatBox.vue'
import RollHistory from '@/components/RollHistory.vue'
import FactionSelector from '@/components/FactionSelector.vue'

const router = useRouter()
const gameStore = useGameStore()

const startingRoll = ref(1000)
const copyFeedback = ref(false)

const props = defineProps({
  roomId: {
    type: String,
    required: true
  }
})

// Latency-bar style connection indicator: green = connected, yellow = connecting, red = down
const connectionBars = computed(() => gameStore.connected ? 3 : gameStore.loading ? 2 : 1)
const connectionColor = computed(() => gameStore.connected ? 'bg-quality-uncommon' : gameStore.loading ? 'bg-chan-system' : 'bg-chan-error')
const connectionTextColor = computed(() => gameStore.connected ? 'text-quality-uncommon' : gameStore.loading ? 'text-chan-system' : 'text-chan-error')
const connectionText = computed(() => gameStore.connected ? 'Connected to realm' : gameStore.loading ? 'Connecting...' : 'Disconnected')

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search)
  const hostName = urlParams.get('host')
  const playerName = urlParams.get('player')

  // If we're not already in this room, join it
  if (!gameStore.room || gameStore.room.id !== props.roomId) {
    if (hostName) {
      // Host creating a room
      try {
        await gameStore.joinRoom(props.roomId, hostName, true)
      } catch (error) {
        console.error('Failed to join as host:', error)
        router.push('/')
      }
    } else if (playerName) {
      // Player joining an existing room
      try {
        await gameStore.joinRoom(props.roomId, playerName, true)
      } catch (error) {
        console.error('Failed to join as player:', error)
        router.push('/')
      }
    } else {
      // Room URL opened directly - go home to enter a name
      router.push('/')
    }
  }
})

// Watch for room changes
watch(() => gameStore.room, (newRoom) => {
  if (newRoom && newRoom.id !== props.roomId) {
    if (newRoom.id) {
      router.push(`/room/${newRoom.id}`)
    } else {
      router.push('/')
    }
  }
}, { immediate: false })

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
    copyFeedback.value = true
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
.latency-bar {
  border: 1px solid #000;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 0.08);
}

/* Rotating gold rune ring */
.rune-spinner {
  position: relative;
  width: 64px;
  height: 64px;
}
.rune-spinner::before,
.rune-spinner::after {
  content: '';
  position: absolute;
  border-radius: 50%;
}
.rune-spinner::before {
  inset: 0;
  border: 3px dashed #ffd100;
  box-shadow: 0 0 12px rgb(255 209 0 / 0.5), inset 0 0 12px rgb(255 209 0 / 0.3);
  animation: rune-spin 3s linear infinite;
}
.rune-spinner::after {
  inset: 12px;
  border: 2px solid transparent;
  border-top-color: #fff1a8;
  border-bottom-color: #a8801c;
  animation: rune-spin 1.2s linear infinite reverse;
}
@keyframes rune-spin {
  to { transform: rotate(360deg); }
}
</style>
