<template>
  <div class="faction-selector-compact">
    <div class="flex space-x-1 sm:space-x-2">
      <!-- Alliance Button -->
      <button
        @click="selectFaction('alliance')"
        :class="[
          'faction-button-compact alliance-button',
          gameStore.selectedFaction === 'alliance' ? 'selected' : ''
        ]"
        class="flex items-center justify-center p-1.5 sm:p-2 rounded border transition-all duration-300 hover:scale-110"
        title="Alliance"
      >
        <img 
          src="/ally.png" 
          alt="Alliance" 
          class="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm"
        />
      </button>
      
      <!-- Horde Button -->
      <button
        @click="selectFaction('horde')"
        :class="[
          'faction-button-compact horde-button',
          gameStore.selectedFaction === 'horde' ? 'selected' : ''
        ]"
        class="flex items-center justify-center p-1.5 sm:p-2 rounded border transition-all duration-300 hover:scale-110"
        title="Horde"
      >
        <img 
          src="/horde.png" 
          alt="Horde" 
          class="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-sm"
        />
      </button>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const selectFaction = (faction) => {
  gameStore.setFaction(faction)
  gameStore.playSound(faction) // Play faction-specific sound
}
</script>

<style scoped>
.faction-button-compact {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(4px);
}

.faction-button-compact:hover {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.3);
}

.alliance-button.selected {
  background: rgba(0, 100, 255, 0.2);
  border-color: #4A90E2;
  box-shadow: 0 0 8px rgba(74, 144, 226, 0.4);
}

.horde-button.selected {
  background: rgba(200, 0, 0, 0.2);
  border-color: #DC143C;
  box-shadow: 0 0 8px rgba(220, 20, 60, 0.4);
}

.alliance-button:hover:not(.selected) {
  border-color: #4A90E2;
  box-shadow: 0 0 4px rgba(74, 144, 226, 0.3);
}

.horde-button:hover:not(.selected) {
  border-color: #DC143C;
  box-shadow: 0 0 4px rgba(220, 20, 60, 0.3);
}
</style>
