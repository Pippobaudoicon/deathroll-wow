<template>
  <div class="text-center">
    <!-- Turn header (raid warning) -->
    <p
      v-if="gameStore.currentTurn"
      :key="gameStore.currentTurn.id"
      class="raid-warning mb-6"
      aria-live="polite"
    >
      <span v-if="gameStore.isMyTurn" class="wow-title text-3xl sm:text-4xl">Your turn!</span>
      <span v-else class="font-ui text-xl sm:text-2xl text-white">{{ gameStore.currentTurn.name }}{{ isRolling ? ' is rolling...' : "'s turn" }}</span>
    </p>

    <!-- Loot roll frame -->
    <div class="wow-frame loot-frame text-left" :class="{ 'is-ghost': isDead, 'is-shaking': eliminated }">
      <span class="wow-frame-title">Loot Roll</span>
      <div v-if="eliminated" :key="lastRoll.id" class="death-flash" aria-hidden="true" />

      <!-- Item: icon + name + range -->
      <div class="flex items-center gap-3 pt-2">
        <div class="wow-slot stakes-icon w-12 h-12 shrink-0">
          <svg viewBox="0 0 40 40" class="w-full h-full" aria-hidden="true">
            <defs>
              <radialGradient id="stakes-bg" cx="50%" cy="40%" r="70%">
                <stop offset="0" stop-color="#4b1d6e" />
                <stop offset="1" stop-color="#0d0414" />
              </radialGradient>
              <linearGradient id="stakes-bone" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="#f4ead2" />
                <stop offset="1" stop-color="#a99a78" />
              </linearGradient>
            </defs>
            <rect width="40" height="40" fill="url(#stakes-bg)" />
            <path d="M20 6c-7.5 0-12 5-12 11.5 0 4 1.8 6.6 4 8V30h16v-4.5c2.2-1.4 4-4 4-8C32 11 27.5 6 20 6z" fill="url(#stakes-bone)" stroke="#1a1208" stroke-width="1.2" />
            <ellipse cx="15" cy="18" rx="3.2" ry="3.6" fill="#140a1c" />
            <ellipse cx="25" cy="18" rx="3.2" ry="3.6" fill="#140a1c" />
            <circle cx="15" cy="18" r="1" fill="#c77dff" />
            <circle cx="25" cy="18" r="1" fill="#c77dff" />
            <path d="M20 21.5l-1.8 3h3.6z" fill="#140a1c" />
            <path d="M14.5 27v3M17.5 27v3.5M20.5 27v3.5M23.5 27v3M14 27h12" stroke="#1a1208" stroke-width="1" fill="none" />
          </svg>
        </div>
        <div class="min-w-0">
          <p class="font-ui text-lg leading-tight text-quality-epic truncate" style="text-shadow: 1px 1px 0 #000">Deathroll Stakes</p>
          <p v-if="gameStore.game?.currentRange" class="font-ui text-sm text-white/80">
            Roll 1-{{ gameStore.game.currentRange.max }}
          </p>
        </div>
      </div>

      <!-- Number readout -->
      <div
        class="readout wow-slot mx-auto mt-5 h-24 w-full max-w-[16rem]"
        :class="{ 'is-spinning': isRolling, 'is-eliminating': eliminated }"
        aria-live="polite"
      >
        <span class="font-display font-bold text-5xl sm:text-6xl tabular-nums">{{ displayNumber ?? '?' }}</span>
      </div>

      <!-- Need dice + Roll -->
      <div class="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          class="need-btn wow-slot w-14 h-14 shrink-0"
          :disabled="!canRoll"
          :aria-label="canRoll ? 'Roll the dice' : 'Dice'"
          @click="handleRoll"
        >
          <svg viewBox="0 0 64 64" class="w-full h-full p-1" :class="{ 'animate-spin': isRolling }" aria-hidden="true">
            <path d="M32 6 56 18 32 30 8 18z" fill="#ffe27a" stroke="#2a1a05" stroke-width="2" stroke-linejoin="round" />
            <path d="M8 18 32 30v28L8 46z" fill="#c9962e" stroke="#2a1a05" stroke-width="2" stroke-linejoin="round" />
            <path d="M56 18 32 30v28l24-12z" fill="#8a5f16" stroke="#2a1a05" stroke-width="2" stroke-linejoin="round" />
            <ellipse cx="32" cy="18" rx="4" ry="2.2" fill="#7a0d05" />
            <circle cx="14" cy="27" r="2.4" fill="#fff6dc" />
            <circle cx="20" cy="38" r="2.4" fill="#fff6dc" />
            <circle cx="26" cy="49" r="2.4" fill="#fff6dc" />
            <circle cx="39" cy="38" r="2.4" fill="#fff6dc" />
            <circle cx="49" cy="33" r="2.4" fill="#fff6dc" />
            <circle cx="39" cy="49" r="2.4" fill="#fff6dc" />
            <circle cx="49" cy="44" r="2.4" fill="#fff6dc" />
          </svg>
        </button>
        <button
          v-if="gameStore.isMyTurn"
          type="button"
          class="wow-btn wow-btn-lg flex-1 max-w-[12rem]"
          :disabled="!canRoll"
          @click="handleRoll"
        >
          {{ isRolling || requested ? 'Rolling...' : 'Roll' }}
        </button>
      </div>

      <!-- Range bar (timer-style): how much of the starting roll is left -->
      <div class="range-bar mt-5" role="img" :aria-label="`Range 1 to ${gameStore.game?.currentRange?.max ?? '?'}`">
        <div class="range-fill" :style="{ width: rangePct + '%' }" />
        <span class="range-label font-chat">1 - {{ gameStore.game?.currentRange?.max ?? '?' }}</span>
      </div>

      <!-- Last roll, system chat style -->
      <div v-if="lastRoll && !isRolling" class="mt-4 font-chat text-base text-center">
        <p class="text-chan-system chat-shadow">
          {{ lastRoll.playerName }} rolls {{ lastRoll.result }} (1-{{ lastRoll.range.max }})
        </p>
        <p v-if="lastRoll.isEliminating" class="text-chan-error chat-shadow">{{ lastRoll.playerName }} has died.</p>
      </div>

      <p v-if="isDead" class="mt-3 font-ui text-sm text-center italic text-[#b8cce6]">
        You walk the spirit world. The dice no longer answer you.
      </p>
    </div>

    <StaticPopup v-if="showDeathPopup" accept-text="Release Spirit" decline-text="" @accept="showDeathPopup = false">
      You have died.
    </StaticPopup>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useGameStore } from '@/stores/game'
import StaticPopup from '@/components/StaticPopup.vue'

const gameStore = useGameStore()
const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// The server drives the tumble (roll-started -> dice-rolled), so every screen shows it at the same time
const isRolling = computed(() => !!gameStore.rollingPlayer)
const requested = ref(false) // clicked Roll, waiting for the server to announce it
const showDeathPopup = ref(false)

const lastRoll = computed(() => {
  return (gameStore.rolls || [])[gameStore.rolls?.length - 1] || null
})
const displayNumber = ref(lastRoll.value?.result ?? null)

const canRoll = computed(() => {
  return gameStore.isMyTurn && gameStore.connected && !isRolling.value && !requested.value
})

const eliminated = computed(() => !!lastRoll.value?.isEliminating && !isRolling.value)

const isDead = computed(() => {
  const me = (gameStore.players || []).find(p => p.id === gameStore.currentPlayer?.id)
  return !!me?.isEliminated
})

const rangePct = computed(() => {
  const max = gameStore.game?.currentRange?.max
  const start = gameStore.game?.originalStartingRoll
  return max && start ? Math.min(100, (max / start) * 100) : 100
})

// Slot-machine flicker while the dice are in the air
let flickerTimer = null
watch(() => gameStore.rollingPlayer, (rolling) => {
  clearInterval(flickerTimer)
  if (rolling) {
    requested.value = false
    if (reduceMotion) displayNumber.value = null
    else flickerTimer = setInterval(() => {
      displayNumber.value = 1 + Math.floor(Math.random() * rolling.range.max)
    }, 45)
  } else {
    displayNumber.value = lastRoll.value?.result ?? null
  }
})

// Result lands for everyone in the same broadcast
watch(lastRoll, (roll) => {
  clearInterval(flickerTimer)
  displayNumber.value = roll?.result ?? null
})

watch(isDead, (dead, wasDead) => {
  showDeathPopup.value = dead && !wasDead
})

// A rejected roll never starts, so re-enable the button
watch(() => gameStore.error, (err) => {
  if (err) requested.value = false
})

onBeforeUnmount(() => clearInterval(flickerTimer))

const handleRoll = () => {
  if (!canRoll.value) return
  requested.value = true
  gameStore.rollDice()
}
</script>

<style scoped>
.raid-warning { animation: raid-warning-in 0.45s ease-out; }
@keyframes raid-warning-in {
  0% { opacity: 0; transform: scale(1.6); }
  60% { opacity: 1; transform: scale(0.95); }
  100% { transform: scale(1); }
}

.loot-frame { transition: filter 0.8s ease; }

/* Ghost world: desaturated with a cold blue cast */
.loot-frame.is-ghost { filter: grayscale(1) sepia(0.35) hue-rotate(175deg) saturate(1.4) brightness(0.85); }

.loot-frame.is-shaking { animation: shake 0.5s ease-in-out; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  15%, 45%, 75% { transform: translateX(-6px); }
  30%, 60%, 90% { transform: translateX(6px); }
}

.death-flash {
  position: absolute;
  inset: 0;
  z-index: 5;
  border-radius: inherit;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgb(255 32 32 / 0.55), rgb(120 0 0 / 0.35) 70%);
  animation: death-flash 0.8s ease-out forwards;
}
@keyframes death-flash {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

.stakes-icon { border-color: #a335ee; box-shadow: inset 0 0 0 1px #000, 0 0 0 1px #000, 0 0 8px rgb(163 53 238 / 0.55); }

.readout { color: #ffd100; text-shadow: 2px 2px 0 #000, 0 0 16px rgb(255 170 0 / 0.4); }
.readout.is-spinning { color: #fff6dc; filter: blur(0.4px); }
.readout.is-eliminating { color: #ff2020; border-color: #7a0d05; text-shadow: 2px 2px 0 #000, 0 0 18px rgb(255 32 32 / 0.7); }

.need-btn { transition: filter 0.1s, transform 0.1s; border-color: #8d7a45; }
.need-btn:hover:not(:disabled) { filter: brightness(1.25) drop-shadow(0 0 6px rgb(255 209 0 / 0.6)); }
.need-btn:active:not(:disabled) { transform: translateY(1px); }
.need-btn:disabled { filter: grayscale(0.7) brightness(0.6); cursor: not-allowed; }

/* Classic loot-roll timer bar */
.range-bar {
  position: relative;
  height: 14px;
  border-radius: 2px;
  background: #111;
  border: 1px solid #6e6e6e;
  box-shadow: inset 0 0 0 1px #000, inset 0 2px 4px rgb(0 0 0 / 0.9);
  overflow: hidden;
}
.range-fill {
  height: 100%;
  background: linear-gradient(180deg, #fff1a8 0%, #ffd100 35%, #c99a00 65%, #7a5a00 100%);
  box-shadow: 2px 0 6px rgb(255 241 168 / 0.8);
  transition: width 0.6s ease-out;
}
.range-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  line-height: 1;
  color: #fff;
  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000;
}

.chat-shadow { text-shadow: 1px 1px 0 #000; }

@media (prefers-reduced-motion: reduce) {
  .raid-warning, .loot-frame.is-shaking, .death-flash { animation: none; }
  .death-flash { opacity: 0.35; }
  .range-fill, .loot-frame { transition: none; }
  .need-btn svg { animation: none; }
}
</style>
