<template>
  <section
    class="game-over relative overflow-hidden rounded-md px-4 py-10 sm:py-14 text-center"
    :class="isVictory ? 'is-victory' : 'is-defeat'"
    :style="crestStyle"
    role="status"
  >
    <div v-if="isVictory" class="rays" aria-hidden="true" />
    <div class="vignette" aria-hidden="true" />

    <div class="relative">
      <img :src="crestSrc" :alt="`${factionName} crest`" class="crest mx-auto w-20 h-20 sm:w-24 sm:h-24 object-contain" />

      <h2 class="headline font-display font-bold text-5xl sm:text-7xl md:text-8xl tracking-[0.12em] mt-3">
        {{ isVictory ? 'VICTORY' : 'DEFEAT' }}
      </h2>

      <div class="wow-divider max-w-xs mx-auto" />

      <p v-if="isVictory" class="font-ui text-lg sm:text-xl text-white" style="text-shadow: 1px 1px 0 #000">
        You have won the Deathroll.
      </p>
      <p v-else class="font-ui text-lg sm:text-xl text-white" style="text-shadow: 1px 1px 0 #000">
        <span class="winner-name">{{ gameStore.winner.name }}</span> has won the Deathroll.
      </p>

      <!-- Achievement Earned toast -->
      <div v-if="isVictory" class="achievement mx-auto mt-8 flex items-center gap-3 max-w-sm text-left">
        <svg viewBox="0 0 48 56" class="w-12 h-14 shrink-0" aria-hidden="true">
          <defs>
            <linearGradient id="ach-shield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#fff1a8" />
              <stop offset="0.45" stop-color="#d9a93c" />
              <stop offset="1" stop-color="#6a4f17" />
            </linearGradient>
          </defs>
          <path d="M24 2 44 9v17c0 14-9 23-20 28C13 49 4 40 4 26V9z" fill="url(#ach-shield)" stroke="#1a1208" stroke-width="2" />
          <path d="M24 8 38 13v13c0 10-6 17-14 21-8-4-14-11-14-21V13z" fill="#2a1d10" stroke="#5a4314" stroke-width="1" />
          <text x="24" y="33" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="16" fill="#ffd100" stroke="#000" stroke-width="0.6">10</text>
        </svg>
        <div class="min-w-0">
          <p class="font-ui text-xs uppercase tracking-[0.2em] text-gold">Achievement Earned</p>
          <p class="font-display font-bold text-lg sm:text-xl text-white truncate" style="text-shadow: 1px 1px 0 #000">Deathroll Champion</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const isVictory = computed(() => gameStore.winner?.id === gameStore.currentPlayer?.id)
const isAlliance = computed(() => gameStore.winner?.faction === 'alliance')
const factionName = computed(() => (isAlliance.value ? 'Alliance' : 'Horde'))
const crestSrc = computed(() => (isAlliance.value ? '/ally.png' : '/horde.png'))
// Tint by the winner's faction, not the viewer's
const crestStyle = computed(() => (isAlliance.value
  ? { '--crest': '32 82 176', '--crest-light': '110 168 255' }
  : { '--crest': '179 27 27', '--crest-light': '255 92 72' }))
</script>

<style scoped>
.game-over {
  border: 3px solid transparent;
  background:
    radial-gradient(ellipse at 50% 30%, rgb(var(--crest) / 0.35), transparent 70%) padding-box,
    linear-gradient(180deg, #151822 0%, #06070b 100%) padding-box,
    var(--gold-border) border-box;
  box-shadow: 0 0 0 1px #000, 0 12px 40px rgb(0 0 0 / 0.8), inset 0 0 60px rgb(0 0 0 / 0.85);
  animation: banner-in 0.5s ease-out both;
}

.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 40%, rgb(0 0 0 / 0.7) 100%);
}

/* Radiant rays behind the victory splash */
.rays {
  position: absolute;
  left: 50%;
  top: 45%;
  width: 900px;
  height: 900px;
  margin: -450px 0 0 -450px;
  pointer-events: none;
  background: repeating-conic-gradient(from 0deg, rgb(255 209 0 / 0.32) 0deg 5deg, transparent 5deg 15deg);
  -webkit-mask-image: radial-gradient(circle, #000 0%, rgb(0 0 0 / 0.6) 25%, transparent 55%);
  mask-image: radial-gradient(circle, #000 0%, rgb(0 0 0 / 0.6) 25%, transparent 55%);
  animation: rays-spin 40s linear infinite;
}

.crest {
  filter: drop-shadow(0 0 12px rgb(var(--crest-light) / 0.8)) drop-shadow(0 2px 2px #000);
  animation: crest-in 0.6s ease-out 0.1s both;
}

.headline { animation: headline-in 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.2) 0.15s both; }
.is-victory .headline {
  color: #ffd100;
  background: linear-gradient(180deg, #fff6c8 0%, #ffd100 45%, #c98a00 70%, #fff1a8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(2px 2px 0 #000) drop-shadow(0 0 18px rgb(255 190 0 / 0.65));
}
.is-defeat .headline {
  color: #e01010;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 3px 3px 0 #000, 0 0 24px rgb(200 0 0 / 0.6);
}

.winner-name { color: rgb(var(--crest-light)); }

.achievement {
  padding: 0.6rem 1rem 0.6rem 0.6rem;
  border-radius: 6px;
  border: 2px solid transparent;
  background: linear-gradient(180deg, #2b2f38 0%, #121419 100%) padding-box, var(--gold-border) border-box;
  box-shadow: 0 0 0 1px #000, 0 6px 18px rgb(0 0 0 / 0.75), 0 0 20px rgb(255 209 0 / 0.25);
  animation: toast-in 0.5s ease-out 0.9s both;
}

@keyframes banner-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes crest-in { from { opacity: 0; transform: translateY(-16px) scale(0.8); } to { opacity: 1; transform: none; } }
@keyframes headline-in {
  0% { opacity: 0; transform: scale(2.2); letter-spacing: 0.5em; }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes toast-in { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
@keyframes rays-spin { to { transform: rotate(360deg); } }

@media (prefers-reduced-motion: reduce) {
  .game-over, .rays, .crest, .headline, .achievement { animation: none; }
}
</style>
