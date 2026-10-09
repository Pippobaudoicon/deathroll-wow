<template>
  <section class="wow-frame px-3 pt-7 pb-3">
    <div class="wow-frame-title">{{ gameStore.players.length > 5 ? 'Raid' : 'Party' }}</div>

    <p class="font-ui text-xs text-white/60 text-right mb-2">
      {{ gameStore.players.length }}/{{ gameStore.room?.maxPlayers || 8 }} members
    </p>

    <ul class="space-y-2">
      <li
        v-for="player in gameStore.players"
        :key="player.id"
        class="unit relative flex items-center gap-2 rounded-[4px] p-1.5 pr-2"
        :class="{
          'is-turn': isTurn(player),
          'is-dead': player.isEliminated,
          'is-offline': !player.isConnected
        }"
      >
        <!-- Turn arrow -->
        <svg v-if="isTurn(player)" class="turn-arrow" viewBox="0 0 10 12" aria-hidden="true">
          <path d="M1 1l8 5-8 5z" fill="#ffd100" stroke="#000" stroke-width="1" />
        </svg>

        <!-- Portrait -->
        <div class="wow-slot portrait w-11 h-11 shrink-0">
          <img :src="player.faction === 'alliance' ? '/ally.png' : '/horde.png'" alt="" class="w-full h-full object-contain p-0.5" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5 font-ui text-sm leading-tight">
            <svg v-if="player.isHost" class="w-3.5 h-3 shrink-0" viewBox="0 0 16 12" role="img" aria-label="Party Leader">
              <title>Party Leader</title>
              <path d="M1 3l3.5 3L8 1l3.5 5L15 3l-1.5 8h-11z" fill="#ffd100" stroke="#000" stroke-width="1" stroke-linejoin="round" />
            </svg>
            <span
              class="name truncate"
              :class="player.id === gameStore.currentPlayer?.id ? 'text-gold' : 'text-white'"
            >{{ player.name }}</span>
            <span v-if="player.isGuest" class="text-[10px] text-quality-poor shrink-0">Guest</span>
            <span class="ml-auto shrink-0 text-[11px]" :class="statusClass(player)">{{ statusText(player) }}</span>
          </div>

          <!-- Health -->
          <div class="bar mt-1 h-3">
            <div class="bar-fill health" :style="{ width: player.isEliminated ? '0%' : '100%' }"></div>
            <span class="bar-text">{{ player.isEliminated ? 'Dead' : !player.isConnected ? 'Offline' : '100%' }}</span>
          </div>
          <!-- Mana -->
          <div class="bar mt-0.5 h-1.5">
            <div class="bar-fill mana" :style="{ width: player.isEliminated ? '0%' : '100%' }"></div>
          </div>
        </div>
      </li>
    </ul>

    <!-- Empty state -->
    <div v-if="gameStore.players.length === 0" class="text-center py-6 font-ui text-sm text-white/60">
      <p>No players in the room yet</p>
      <p class="text-xs">Waiting for someone to join...</p>
    </div>

    <!-- Room stats -->
    <div v-if="gameStore.players.length > 0" class="mt-3 flex justify-between font-chat text-xs text-white/70">
      <span>Alive: <span class="text-quality-uncommon">{{ activePlayers.length }}</span></span>
      <span>Dead: <span class="text-chan-error">{{ eliminatedPlayers.length }}</span></span>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const activePlayers = computed(() => {
  return (gameStore.players || []).filter(p => !p.isEliminated)
})

const eliminatedPlayers = computed(() => {
  return (gameStore.players || []).filter(p => p.isEliminated)
})

const isTurn = (player) => {
  return gameStore.currentTurn?.id === player.id && gameStore.gameStatus === 'playing'
}

const statusText = (player) => {
  if (player.isEliminated) return 'Dead'
  if (!player.isConnected) return 'Offline'
  if (gameStore.rollingPlayer?.playerId === player.id) return 'Rolling...'
  if (isTurn(player)) return player.id === gameStore.currentPlayer?.id ? 'Your turn' : 'Their turn'
  if (gameStore.gameStatus === 'playing') return 'Waiting'
  return 'Ready'
}

const statusClass = (player) => {
  if (player.isEliminated) return 'text-chan-error'
  if (!player.isConnected) return 'text-quality-poor'
  if (isTurn(player)) return 'text-gold'
  return 'text-white/60'
}
</script>

<style scoped>
.unit {
  background: linear-gradient(180deg, rgb(20 22 30 / 0.9), rgb(0 0 0 / 0.85));
  border: 1px solid #4a4a4a;
  box-shadow: inset 0 0 0 1px #000;
  transition: border-color 0.3s, box-shadow 0.3s, filter 0.3s;
}
.name { text-shadow: 1px 1px 0 #000; }

.bar {
  position: relative;
  overflow: hidden;
  background: #050505;
  border: 1px solid #000;
  box-shadow: 0 0 0 1px #3a3a3a;
}
.bar-fill { height: 100%; transition: width 0.6s ease-out; }
.health { background: linear-gradient(180deg, #4cf04c 0%, #13a313 50%, #0a750a 100%); }
.mana { background: linear-gradient(180deg, #4c7dff 0%, #1239c9 100%); }
.bar-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif;
  font-size: 9px;
  line-height: 1;
  color: #fff;
  text-shadow: 1px 1px 0 #000;
}

/* Current turn: targeted unit */
.is-turn {
  border-color: #ffd100;
  box-shadow: inset 0 0 0 1px #000, 0 0 10px rgb(255 209 0 / 0.55), inset 0 0 12px rgb(255 209 0 / 0.15);
  animation: target-glow 1.6s ease-in-out infinite;
}
.turn-arrow {
  position: absolute;
  left: -14px;
  top: 50%;
  width: 10px;
  height: 12px;
  margin-top: -6px;
  animation: nudge 0.8s ease-in-out infinite;
}

/* Eliminated: ghost */
.is-dead { filter: grayscale(1); }
.is-dead .portrait img { opacity: 0.35; }
.is-dead .portrait::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, rgb(170 200 255 / 0.25), transparent 70%);
}
.is-dead .name { color: #9d9d9d; }

/* Disconnected */
.is-offline:not(.is-dead) { filter: grayscale(1) brightness(0.7); }

@keyframes target-glow {
  0%, 100% { box-shadow: inset 0 0 0 1px #000, 0 0 6px rgb(255 209 0 / 0.4); }
  50% { box-shadow: inset 0 0 0 1px #000, 0 0 14px rgb(255 209 0 / 0.75); }
}
@keyframes nudge {
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(3px); }
}
</style>
