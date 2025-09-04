<template>
  <div class="roll-history">
    <div class="flex items-center justify-between mb-4">
      <h3 class="wow-subheading">📜 Roll History</h3>
      <div class="text-xs text-wow-text-muted">
        {{ (gameStore.rolls || []).length }} rolls
      </div>
    </div>

    <!-- Roll list -->
    <div class="space-y-2 max-h-70 overflow-y-auto">
      <div
        v-for="(roll, index) in reversedRolls"
        :key="roll.id"
        class="roll-item"
        :class="{
          'eliminating': roll.isEliminating
        }"
      >
        <div class="flex items-center justify-between w-full">
          <div class="flex items-center space-x-3">
            <!-- Roll number -->
            <div class="text-xs text-wow-text-muted font-mono w-6 text-right">
              #{{ (gameStore.rolls || []).length - index }}
            </div>
            
            <!-- Player name -->
            <div class="flex items-center space-x-2">
              <span 
                class="font-semibold"
                :class="{
                  'text-wow-red': roll.isEliminating,
                  'text-wow-gold': roll.playerId === gameStore.currentPlayer?.id,
                  'text-wow-text-primary': !roll.isEliminating && roll.playerId !== gameStore.currentPlayer?.id
                }"
              >
                {{ roll.playerName }}
              </span>
              
              <!-- Your roll indicator -->
              <span v-if="roll.playerId === gameStore.currentPlayer?.id" class="text-xs bg-wow-gold text-wow-bg-dark px-1 rounded">
                YOU
              </span>
            </div>
          </div>

          <div class="flex items-center space-x-3">
            <!-- Roll result -->
            <div class="text-right">
              <div 
                class="text-lg font-bold"
                :class="{
                  'text-wow-red': roll.isEliminating,
                  'text-wow-gold': !roll.isEliminating
                }"
              >
                {{ roll.result }}
              </div>
              <div class="text-xs text-wow-text-muted">
                ({{ roll.range.min }}-{{ roll.range.max }})
              </div>
            </div>

            <!-- Elimination indicator -->
            <div class="w-6 text-center">
              <span v-if="roll.isEliminating" class="text-lg" title="Eliminated">💀</span>
              <span v-else class="text-lg opacity-50">🎲</span>
            </div>
          </div>
        </div>

        <!-- Roll timestamp -->
        <div class="text-xs text-wow-text-muted mt-1 ml-9">
          {{ formatTime(roll.timestamp) }}
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="(gameStore.rolls || []).length === 0" class="text-center py-8 text-wow-text-muted">
        <div class="text-4xl mb-2">🎲</div>
        <p>No rolls yet</p>
        <p class="text-sm">The dice await your command!</p>
      </div>
    </div>

    <!-- Statistics -->
    <div v-if="(gameStore.rolls || []).length > 0" class="mt-4 pt-4 border-t border-wow-border">
      <div class="grid grid-cols-3 gap-2 text-xs text-wow-text-secondary">
        <div class="text-center">
          <div class="font-semibold">Total Rolls</div>
          <div class="text-wow-gold">{{ (gameStore.rolls || []).length }}</div>
        </div>
        <div class="text-center">
          <div class="font-semibold">Eliminations</div>
          <div class="text-wow-red">{{ eliminationCount }}</div>
        </div>
        <div class="text-center">
          <div class="font-semibold">Average</div>
          <div class="text-wow-text-primary">{{ averageRoll }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

// Note: Using gameStore directly in template to maintain reactivity

// Computed properties
const reversedRolls = computed(() => {
  return [...(gameStore.rolls || [])].reverse()
})

const eliminationCount = computed(() => {
  return (gameStore.rolls || []).filter(roll => roll.isEliminating).length
})

const averageRoll = computed(() => {
  const rolls = gameStore.rolls || []
  if (rolls.length === 0) return 0
  const sum = rolls.reduce((acc, roll) => acc + roll.result, 0)
  return Math.round(sum / rolls.length)
})

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
</script>
