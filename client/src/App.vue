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
  // Initialize sound system
  gameStore.initializeSound()
  
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
