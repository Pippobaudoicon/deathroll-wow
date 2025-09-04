<template>
  <div id="app" class="min-h-screen">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useGameStore } from './stores/game'

const gameStore = useGameStore()

onMounted(() => {
  // Initialize audio context on first user interaction
  const initAudioOnClick = () => {
    gameStore.initializeSound().catch(() => {})
  }
  document.addEventListener('click', initAudioOnClick, { once: true })
  document.addEventListener('touchstart', initAudioOnClick, { once: true })
  
  // Handle page refresh/close
  const handleBeforeUnload = () => {
    gameStore.disconnect()
  }
  
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  gameStore.disconnect()
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>

<style>
/* Global app styles are in assets/style.css */
</style>
