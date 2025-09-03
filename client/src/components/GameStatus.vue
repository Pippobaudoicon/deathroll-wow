<template>
  <div class="wow-card text-center">
    <div class="game-status" :class="gameStatus">
      <div v-if="gameStatus === 'lobby'" class="space-y-2">
        <h3 class="text-2xl font-bold text-wow-blue">⏳ Lobby</h3>
        <p class="text-wow-text-secondary">
          Waiting for players to join and the host to start the game
        </p>
      </div>

      <div v-else-if="gameStatus === 'playing'" class="space-y-2">
        <h3 class="text-2xl font-bold text-wow-gold">🎲 Game in Progress</h3>
        <div v-if="currentTurn" class="space-y-1">
          <p class="text-lg">
            <span class="text-wow-gold font-semibold">{{ currentTurn.name }}'s</span> turn
          </p>
          <p class="text-wow-text-secondary" v-if="game?.currentRange">
            Roll between <span class="text-wow-gold font-semibold">1</span> and 
            <span class="text-wow-gold font-semibold">{{ game.currentRange.max }}</span>
          </p>
          <div v-if="isMyTurn" class="animate-pulse">
            <p class="text-wow-gold font-bold">🎯 It's your turn!</p>
          </div>
        </div>
      </div>

      <div v-else-if="gameStatus === 'finished'" class="space-y-2">
        <h3 class="text-2xl font-bold text-wow-red">🏁 Game Finished</h3>
        <div v-if="winner">
          <p class="text-lg">
            🏆 <span class="text-wow-gold font-semibold">{{ winner.name }}</span> wins!
          </p>
        </div>
        <div v-else>
          <p class="text-lg text-wow-text-secondary">Game ended with no winner</p>
        </div>
      </div>
    </div>

    <!-- Game Stats -->
    <div v-if="game" class="mt-4 pt-4 border-t border-wow-border">
      <div class="grid grid-cols-2 gap-4 text-sm text-wow-text-secondary">
        <div>
          <span class="block font-semibold">Active Players</span>
          <span class="text-wow-gold">{{ activePlayers.length }}</span>
        </div>
        <div>
          <span class="block font-semibold">Total Rolls</span>
          <span class="text-wow-gold">{{ rolls.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const {
  gameStatus,
  currentTurn,
  game,
  winner,
  isMyTurn,
  activePlayers,
  rolls
} = gameStore
</script>
