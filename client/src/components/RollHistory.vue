<template>
  <section class="wow-frame px-3 pt-7 pb-3 sm:px-4">
    <div class="wow-frame-title">Combat Log</div>

    <div class="log wow-scroll max-h-72 overflow-y-auto px-2 py-1.5 font-chat text-sm leading-snug space-y-0.5">
      <p
        v-for="(roll, index) in reversedRolls"
        :key="roll.id"
        class="line break-words"
        :class="roll.isEliminating ? 'text-chan-error' : 'text-chan-system'"
      >
        <span class="text-white/40 text-xs mr-1">[{{ formatTime(roll.timestamp) }}] #{{ (gameStore.rolls || []).length - index }}</span>
        <span :class="{ 'font-bold': roll.playerId === gameStore.currentPlayer?.id }">{{ roll.playerName }}</span>
        rolls {{ roll.result }} ({{ roll.range.min }}-{{ roll.range.max }}).
        <template v-if="roll.isEliminating">{{ roll.playerName }} has died.</template>
      </p>

      <p v-if="(gameStore.rolls || []).length === 0" class="line text-white/60">
        No rolls yet. The dice await your command.
      </p>
    </div>

    <div v-if="(gameStore.rolls || []).length > 0" class="mt-3 flex justify-between font-chat text-xs text-white/70">
      <span>Rolls: <span class="text-gold">{{ (gameStore.rolls || []).length }}</span></span>
      <span>Deaths: <span class="text-chan-error">{{ eliminationCount }}</span></span>
      <span>Average: <span class="text-white">{{ averageRoll }}</span></span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

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

<style scoped>
.log {
  background: rgb(0 0 0 / 0.55);
  border: 1px solid rgb(255 255 255 / 0.1);
  border-radius: 3px;
}
.line { text-shadow: 1px 1px 0 #000; }
</style>
