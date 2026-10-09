<template>
  <div v-if="compact" class="flex items-center gap-2" role="group" aria-label="Faction">
    <button
      v-for="f in factions"
      :key="f.id"
      type="button"
      class="crest crest-sm"
      :class="{ selected: gameStore.selectedFaction === f.id }"
      :title="f.name"
      :aria-pressed="gameStore.selectedFaction === f.id"
      @click="selectFaction(f.id)"
    >
      <img :src="f.img" :alt="f.name" class="w-5 h-5 object-contain" />
    </button>
  </div>

  <div v-else class="flex justify-center gap-10 sm:gap-16" role="group" aria-label="Faction">
    <button
      v-for="f in factions"
      :key="f.id"
      type="button"
      class="group flex flex-col items-center gap-2"
      :aria-pressed="gameStore.selectedFaction === f.id"
      @click="selectFaction(f.id)"
    >
      <span class="crest crest-lg" :class="{ selected: gameStore.selectedFaction === f.id }">
        <img :src="f.img" :alt="f.name" class="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
      </span>
      <span
        class="font-display font-bold text-sm uppercase tracking-[0.2em] transition-colors"
        :class="gameStore.selectedFaction === f.id ? 'text-gold' : 'text-[#8a8a8a] group-hover:text-gold-light'"
      >{{ f.name }}</span>
    </button>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/game'

defineProps({ compact: Boolean })

const gameStore = useGameStore()

const factions = [
  { id: 'alliance', name: 'Alliance', img: '/ally.png' },
  { id: 'horde', name: 'Horde', img: '/horde.png' },
]

const selectFaction = (f) => {
  gameStore.setFaction(f)
  gameStore.playSound(f)
}
</script>

<style scoped>
/* Round gold-ringed crest, like the character-creation faction emblems */
.crest {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  border: 3px solid transparent;
  background:
    radial-gradient(circle at 50% 35%, #2a2d38 0%, #0a0b10 75%) padding-box,
    var(--gold-border) border-box;
  box-shadow: 0 0 0 1px #000, inset 0 0 12px rgb(0 0 0 / 0.9), 0 4px 10px rgb(0 0 0 / 0.7);
  transition: box-shadow 0.3s ease, filter 0.3s ease, transform 0.15s ease;
}
.crest img {
  filter: grayscale(0.85) brightness(0.55);
  transition: filter 0.3s ease;
}
.crest:hover img,
.group:hover .crest img { filter: grayscale(0.3) brightness(0.85); }

/* The selected crest is always the current faction, so --faction is its color */
.crest.selected {
  background:
    radial-gradient(circle at 50% 40%, rgb(var(--faction) / 0.55) 0%, #0a0b10 75%) padding-box,
    var(--gold-border) border-box;
  box-shadow:
    0 0 0 1px #000,
    inset 0 0 12px rgb(0 0 0 / 0.6),
    0 0 18px rgb(var(--faction-light) / 0.75),
    0 0 40px rgb(var(--faction) / 0.5);
}
.crest.selected img { filter: drop-shadow(0 0 6px rgb(var(--faction-light) / 0.8)); }

.crest-sm { width: 2.25rem; height: 2.25rem; border-width: 2px; }
.crest-sm:hover { transform: scale(1.08); }
.crest-sm.selected { box-shadow: 0 0 0 1px #000, 0 0 10px rgb(var(--faction-light) / 0.7); }

.crest-lg { width: 5.5rem; height: 5.5rem; }
.group:hover .crest-lg { transform: translateY(-2px); }
.group:active .crest-lg { transform: translateY(1px); }
@media (min-width: 640px) {
  .crest-lg { width: 6.5rem; height: 6.5rem; }
}
</style>
