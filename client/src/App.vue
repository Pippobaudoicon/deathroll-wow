<template>
  <router-view />
</template>

<script setup>
import { onMounted, onUnmounted, watchEffect } from 'vue'
import { useGameStore } from './stores/game'

const gameStore = useGameStore()

// Faction drives the theme tokens in style.css
watchEffect(() => {
  document.documentElement.dataset.faction = gameStore.selectedFaction
})

const initAudio = () => gameStore.initializeSound().catch(() => {})
const handleBeforeUnload = () => gameStore.disconnect()

onMounted(() => {
  // Audio context needs a user gesture
  document.addEventListener('click', initAudio, { once: true })
  document.addEventListener('touchstart', initAudio, { once: true })
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  gameStore.disconnect()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
