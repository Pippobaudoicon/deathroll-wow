<template>
  <div class="wow-card text-center">
    <div class="space-y-6">
      <!-- Current Player Turn -->
      <div v-if="gameStore.currentTurn" class="space-y-2">
        <h3 class="text-xl font-semibold">
          <span v-if="gameStore.isMyTurn" class="text-wow-gold">🎯 Your Turn!</span>
          <span v-else>{{ gameStore.currentTurn.name }}'s Turn</span>
        </h3>
        <p class="text-wow-text-secondary" v-if="gameStore.game?.currentRange">
          Roll between <span class="text-wow-gold font-bold">1</span> and 
          <span class="text-wow-gold font-bold">{{ gameStore.game.currentRange.max }}</span>
        </p>
      </div>

      <!-- Dice Display -->
      <div class="dice-container">
        <div 
          class="dice"
          :class="{
            'rolling': isRolling,
            'animate-shake': lastRoll?.isEliminating && showLastRoll
          }"
        >
          <span v-if="!isRolling && displayNumber">
            {{ displayNumber }}
          </span>
          <span v-else-if="isRolling">
            🎲
          </span>
          <span v-else>
            ?
          </span>
        </div>
      </div>

      <!-- Last Roll Info -->
      <div v-if="lastRoll && showLastRoll" class="space-y-2">
        <div :class="[
          'p-3 rounded-lg',
          lastRoll.isEliminating ? 'bg-wow-red bg-opacity-20 text-wow-red' : 'bg-opacity-20 text-wow-gold'
        ]">
          <p class="font-semibold">
            {{ lastRoll.playerName }} rolled {{ lastRoll.result }}
          </p>
          <p class="text-sm">
            ({{ lastRoll.range.min }}-{{ lastRoll.range.max }})
          </p>
          <p v-if="lastRoll.isEliminating" class="text-sm font-bold">
            💀 {{ lastRoll.playerName }} is ELIMINATED! 💀
          </p>
        </div>
      </div>

      <!-- Roll Button -->
      <div v-if="gameStore.isMyTurn" class="space-y-3">
        <button
          @click="handleRoll"
          :disabled="isRolling || !canRoll"
          class="wow-button-primary text-xl px-8 py-4 w-full"
        >
          <span v-if="isRolling">🎲 Rolling...</span>
          <span v-else>🎲 Roll Dice!</span>
        </button>
        
        <p class="text-sm text-wow-text-muted">
          Click to roll the dice and tempt fate!
        </p>
      </div>

      <div v-else-if="gameStore.currentTurn" class="text-wow-text-muted">
        Waiting for {{ gameStore.currentTurn.name }} to roll...
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

// Local state
const isRolling = ref(false)
const displayNumber = ref(null)
const showLastRoll = ref(true)

// Computed - using gameStore directly to maintain reactivity
const lastRoll = computed(() => {
  return (gameStore.rolls || [])[gameStore.rolls?.length - 1] || null
})

const canRoll = computed(() => {
  return gameStore.isMyTurn && gameStore.connected && !isRolling.value
})

// Watch for new rolls to animate
watch(lastRoll, (newRoll, oldRoll) => {
  if (newRoll && newRoll.id !== oldRoll?.id) {
    animateRoll(newRoll.result)
  }
}, { immediate: false })

const handleRoll = async () => {
  if (!canRoll.value) return
  
  isRolling.value = true
  displayNumber.value = null
  showLastRoll.value = false
  
  // Start rolling animation
  gameStore.rollDice()
}

const animateRoll = async (result) => {
  isRolling.value = true
  displayNumber.value = null
  
  // Simulate dice rolling with random numbers
  const rollDuration = 1000 // 1 second
  const rollInterval = 50 // Change number every 50ms
  const rollSteps = rollDuration / rollInterval
  
  let step = 0
  const rollTimer = setInterval(() => {
    if (step < rollSteps) {
      // Show random numbers while rolling
      const maxRange = gameStore.game?.currentRange?.max || 1000
      displayNumber.value = Math.floor(Math.random() * maxRange) + 1
      step++
    } else {
      // Show final result
      clearInterval(rollTimer)
      displayNumber.value = result
      isRolling.value = false
      
      // Show last roll info after a brief delay
      setTimeout(() => {
        showLastRoll.value = true
      }, 500)
    }
  }, rollInterval)
}
</script>
