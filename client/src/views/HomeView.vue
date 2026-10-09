<template>
  <div class="relative flex-1 flex flex-col items-center px-4 pt-10 pb-14 sm:pt-14">
    <!-- Logo -->
    <header class="text-center mb-8 sm:mb-10">
      <h1 class="logo font-display font-black uppercase leading-none">Deathroll</h1>
      <div class="mt-3 flex items-center justify-center gap-3">
        <span class="h-px w-10 sm:w-16 bg-gradient-to-r from-transparent to-gold-dark"></span>
        <p class="font-display text-xs sm:text-sm uppercase tracking-[0.35em] text-gold-light/80" style="text-shadow: 1px 1px 0 #000">
          A World of Warcraft Dice Game
        </p>
        <span class="h-px w-10 sm:w-16 bg-gradient-to-l from-transparent to-gold-dark"></span>
      </div>
    </header>

    <!-- Faction choice -->
    <section class="mb-10 text-center">
      <p class="wow-label mb-4 uppercase tracking-[0.2em]">Choose your Allegiance</p>
      <FactionSelector />
    </section>

    <!-- Login box -->
    <section class="wow-frame w-full max-w-sm mt-2 pt-8">
      <h2 class="wow-frame-title">Enter World</h2>

      <label for="char-name" class="wow-label block mb-1">Character Name</label>
      <input
        id="char-name"
        ref="nameInput"
        v-model="name"
        type="text"
        class="wow-input"
        maxlength="20"
        autocomplete="off"
        @keyup.enter="roomCode.trim() ? handleJoinRoom() : handleCreateRoom()"
      />

      <button
        type="button"
        class="wow-btn w-full mt-4"
        :disabled="!name.trim() || creating"
        @click="handleCreateRoom"
      >
        {{ creating ? 'Creating...' : 'Create Room' }}
      </button>

      <hr class="wow-divider my-6" />

      <label for="room-code" class="wow-label block mb-1">Room Code</label>
      <input
        id="room-code"
        v-model="roomCode"
        type="text"
        class="wow-input uppercase tracking-[0.3em]"
        maxlength="6"
        autocomplete="off"
        @input="roomCode = roomCode.toUpperCase()"
        @keyup.enter="handleJoinRoom"
      />

      <button
        type="button"
        class="wow-btn w-full mt-4"
        :disabled="!name.trim() || !roomCode.trim()"
        @click="handleJoinRoom"
      >
        Join Room
      </button>
    </section>

    <!-- UI error text -->
    <p
      v-if="gameStore.error"
      class="mt-4 max-w-sm text-center font-ui text-chan-error"
      style="text-shadow: 1px 1px 0 #000"
      role="alert"
    >
      {{ gameStore.error }}
    </p>

    <!-- Rules as a quest log entry -->
    <article class="wow-parchment quest w-full max-w-xl mt-12">
      <h3 class="font-display font-bold text-xl sm:text-2xl">
        Deathroll <span class="text-base font-ui opacity-70">[60]</span>
      </h3>

      <h4 class="quest-heading">Objectives</h4>
      <ol class="space-y-1 pl-1">
        <li>1. The first player rolls 1-1000 (or any starting number).</li>
        <li>2. Each following player rolls 1 to the previous roll result.</li>
        <li>3. Rolling a 1 eliminates you from the game.</li>
        <li>4. Be the last player standing.</li>
      </ol>

      <h4 class="quest-heading">Description</h4>
      <p class="italic">
        Gold changes hands in every tavern from Booty Bay to Orgrimmar, but none so quickly as at the
        deathroll table. Gather your companions, name your stakes, and let fate decide who walks away
        rich and who walks away a fool.
      </p>

      <h4 class="quest-heading">Rewards</h4>
      <div class="flex items-center gap-3">
        <span class="wow-slot w-10 h-10 shrink-0">
          <svg viewBox="0 0 24 24" class="w-7 h-7" aria-hidden="true">
            <path d="M3 18 L4.5 8 L9 12 L12 5 L15 12 L19.5 8 L21 18 Z" fill="#ffd100" stroke="#5a4314" stroke-width="1" stroke-linejoin="round" />
            <rect x="3" y="18.5" width="18" height="2.5" rx="0.5" fill="#a8801c" stroke="#5a4314" stroke-width="0.8" />
          </svg>
        </span>
        <span>
          You will receive:
          <span class="text-quality-epic font-bold">[Glory of the Last Roll]</span>
        </span>
      </div>
    </article>

    <!-- Login-screen corner text -->
    <p class="absolute bottom-2 left-3 font-chat text-[11px] text-[#8a8a8a]">Version 1.12.1 (Deathroll)</p>

    <StaticPopup v-if="savedSession" @accept="acceptResume" @decline="declineResume">
      Resume your previous session?
      <span class="block mt-2 text-sm">
        Room: <span class="text-gold">{{ savedSession.roomId }}</span>
        <span class="mx-2"></span>
        Character: <span class="text-gold">{{ savedSession.playerName }}</span>
      </span>
    </StaticPopup>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '@/stores/game'
import FactionSelector from '@/components/FactionSelector.vue'
import StaticPopup from '@/components/StaticPopup.vue'

const router = useRouter()
const gameStore = useGameStore()

const name = ref('')
const roomCode = ref('')
const creating = ref(false)
const savedSession = ref(null)
const nameInput = ref(null)

onMounted(async () => {
  // Only reset state if we don't have a current player
  if (!gameStore.currentPlayer) gameStore.resetState()

  // ?room=XYZ prefills the code and focuses the name field
  const roomParam = new URLSearchParams(window.location.search).get('room')
  if (roomParam) {
    roomCode.value = roomParam.toUpperCase()
    await nextTick()
    nameInput.value?.focus()
  }

  savedSession.value = gameStore.getSavedRoomState()
})

// RoomView handles the actual reconnection
const acceptResume = () => {
  const s = savedSession.value
  router.push(`/room/${s.roomId}?player=${encodeURIComponent(s.playerName)}`)
}

const declineResume = () => {
  gameStore.clearSavedRoomState()
  savedSession.value = null
}

const handleCreateRoom = async () => {
  const hostName = name.value.trim()
  if (!hostName || creating.value) return

  gameStore.playSound('clickSound')
  gameStore.clearError()
  creating.value = true

  try {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName, isGuest: true }),
    })
    if (!response.ok) throw new Error('Failed to create room')

    const roomData = await response.json()
    // RoomView handles joining the room
    router.push(`/room/${roomData.id}?host=${encodeURIComponent(hostName)}`)
  } catch (err) {
    console.error('Failed to create room:', err)
    gameStore.error = err.message
  } finally {
    creating.value = false
  }
}

const handleJoinRoom = () => {
  const playerName = name.value.trim()
  const code = roomCode.value.trim()
  if (!playerName || !code) return

  gameStore.playSound('clickSound')
  gameStore.clearError()
  router.push(`/room/${code}?player=${encodeURIComponent(playerName)}`)
}
</script>

<style scoped>
/* Beveled gold logo: gradient fill, dark outline, warm glow */
.logo {
  font-size: clamp(2.6rem, 13vw, 6rem);
  letter-spacing: 0.06em;
  background: linear-gradient(180deg, #fff6c8 0%, #ffd100 38%, #c58f12 55%, #ffe680 72%, #8a6210 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-stroke: 1px #3a2606;
  filter:
    drop-shadow(0 2px 0 #000)
    drop-shadow(0 0 1px #000)
    drop-shadow(0 0 22px rgb(255 170 0 / 0.4));
}

.quest { line-height: 1.6; }
.quest-heading {
  @apply font-display font-bold text-lg mt-5 mb-1;
  color: #4a2a0a;
}
</style>
