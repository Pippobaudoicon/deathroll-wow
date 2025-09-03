<template>
  <div class="wow-card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="wow-subheading">👥 Players ({{ activePlayers.length + eliminatedPlayers.length }}/{{ gameStore.room?.maxPlayers || 8 }})</h3>
      <div class="flex items-center space-x-2 text-sm text-wow-text-muted">
        <span :class="[
          'status-indicator',
          gameStore.connected ? 'connected' : 'disconnected'
        ]"></span>
        <span>{{ gameStore.connected ? 'Online' : 'Offline' }}</span>
      </div>
    </div>

    <div class="space-y-2">
      <div
        v-for="player in gameStore.players"
        :key="player.id"
        class="player-card"
        :class="{
          'current-turn': gameStore.currentTurn?.id === player.id && gameStore.gameStatus === 'playing',
          'eliminated': player.isEliminated,
          // 'host': player.isHost,
          'opacity-50': !player.isConnected
        }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <!-- Player Status Icon -->
            <div class="flex-shrink-0">
              <span v-if="player.isHost" class="text-xl" title="Host">👑</span>
              <span v-else-if="gameStore.currentTurn?.id === player.id && gameStore.gameStatus === 'playing'" class="text-xl" title="Current Turn">🎯</span>
              <span v-else-if="player.isEliminated" class="text-xl" title="Eliminated">💀</span>
              <span v-else-if="!player.isConnected" class="text-xl" title="Disconnected">🔌</span>
              <span v-else class="text-xl" title="Active">⚔️</span>
            </div>

            <!-- Player Name -->
            <div class="flex-1">
              <div class="flex items-center space-x-2">
                <span 
                  class="font-semibold"
                  :class="{
                    'text-wow-gold': gameStore.currentTurn?.id === player.id && gameStore.gameStatus === 'playing',
                    'text-wow-red': player.isEliminated,
                    'text-wow-blue': player.isHost && !player.isEliminated,
                    'text-wow-text-muted': !player.isConnected
                  }"
                >
                  {{ player.name }}
                </span>
                
                <!-- Player badges -->
                <div class="flex space-x-1">
                  <span v-if="player.id === gameStore.currentPlayer?.id" class="text-xs bg-wow-gold text-wow-bg-dark px-1 rounded">
                    YOU
                  </span>
                  <span v-if="player.isHost" class="text-xs bg-wow-blue text-white px-1 rounded">
                    HOST
                  </span>
                  <span v-if="player.isGuest" class="text-xs bg-wow-text-muted text-white px-1 rounded">
                    GUEST
                  </span>
                </div>
              </div>
              
              <!-- Player status text -->
              <div class="text-xs text-wow-text-muted">
                <span v-if="player.isEliminated">Eliminated</span>
                <span v-else-if="!player.isConnected">Disconnected</span>
                <span v-else-if="gameStore.currentTurn?.id === player.id && gameStore.gameStatus === 'playing'">Rolling...</span>
                <span v-else-if="gameStore.gameStatus === 'playing'">Waiting</span>
                <span v-else>Ready</span>
              </div>
            </div>
          </div>

          <!-- Connection indicator -->
          <div class="flex-shrink-0">
            <div :class="[
              'status-indicator',
              player.isConnected ? 'connected' : 'disconnected'
            ]"></div>
          </div>
        </div>

        <!-- Turn highlight effect -->
        <div 
          v-if="gameStore.currentTurn?.id === player.id && gameStore.gameStatus === 'playing'"
          class="absolute inset-0 bg-opacity-10 rounded animate-pulse pointer-events-none"
        ></div>
      </div>

      <!-- Empty state -->
      <div v-if="gameStore.players.length === 0" class="text-center py-8 text-wow-text-muted">
        <p>No players in the room yet</p>
        <p class="text-sm">Waiting for someone to join...</p>
      </div>
    </div>

    <!-- Room Stats -->
    <div v-if="gameStore.players.length > 0" class="mt-4 pt-4 border-t border-wow-border">
      <div class="grid grid-cols-2 gap-4 text-sm text-wow-text-secondary">
        <div>
          <span class="block font-semibold">Active</span>
          <span class="text-wow-gold">{{ activePlayers.length }}</span>
        </div>
        <div>
          <span class="block font-semibold">Eliminated</span>
          <span class="text-wow-red">{{ eliminatedPlayers.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

// Computed properties for reactive updates
const activePlayers = computed(() => {
  return (gameStore.players || []).filter(p => !p.isEliminated)
})

const eliminatedPlayers = computed(() => {
  return (gameStore.players || []).filter(p => p.isEliminated)
})
</script>
