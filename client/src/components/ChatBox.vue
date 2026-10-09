<template>
  <section class="flex flex-col h-80 lg:h-96">
    <!-- Tabs -->
    <div class="flex gap-1 pl-1">
      <span class="tab is-active">General</span>
      <span class="tab">Combat Log</span>
    </div>

    <div class="chat-frame flex-1 min-h-0 flex flex-col">
      <!-- Messages -->
      <div
        ref="messagesContainer"
        class="wow-scroll flex-1 overflow-y-auto px-2 py-1.5 font-chat text-sm leading-snug space-y-0.5"
        @scroll="handleScroll"
      >
        <p v-for="message in gameStore.messages" :key="message.id" class="line break-words">
          <span class="text-white/40 text-xs mr-1">[{{ formatTime(message.timestamp) }}]</span>
          <template v-if="message.type === 'player'">
            <span :class="nameClass(message)">[{{ message.playerName }}]</span>:
            <span class="text-chan-say">{{ message.message }}</span>
          </template>
          <span v-else class="text-chan-system">{{ message.message }}</span>
        </p>

        <p v-if="gameStore.messages.length === 0" class="line text-chan-system">
          Welcome to the Deathroll. Say hello!
        </p>
      </div>

      <!-- Edit box -->
      <div class="edit-box flex items-center gap-2 px-2 py-1">
        <label for="chat-input" class="font-chat text-sm text-chan-say shrink-0">Say:</label>
        <input
          id="chat-input"
          v-model="newMessage"
          type="text"
          placeholder="Press Enter to send"
          class="flex-1 min-w-0 bg-transparent font-chat text-sm text-chan-say placeholder-white/30 outline-none py-1"
          maxlength="200"
          @keyup.enter="sendMessage"
          :disabled="!gameStore.connected"
        />
        <button
          @click="sendMessage"
          :disabled="!newMessage.trim() || !gameStore.connected"
          class="wow-btn-steel px-3 py-0.5 text-xs"
        >
          Send
        </button>
      </div>
    </div>

    <p v-if="!gameStore.connected" class="font-chat text-xs text-chan-error mt-1 text-center">
      You are disconnected and cannot send messages.
    </p>
  </section>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

const newMessage = ref('')
const messagesContainer = ref(null)
const isUserScrolling = ref(false)

// Track whether the user scrolled away from the bottom
const handleScroll = () => {
  if (!messagesContainer.value) return
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  isUserScrolling.value = scrollHeight - scrollTop - clientHeight >= 50
}

// Auto-scroll to bottom when new messages arrive, unless the user scrolled up
watch(() => gameStore.messages, async () => {
  await nextTick()
  if (!isUserScrolling.value) scrollToBottom()
}, { deep: true })

onMounted(() => {
  scrollToBottom()
})

const sendMessage = () => {
  if (!newMessage.value.trim() || !gameStore.connected) return

  gameStore.sendMessage(newMessage.value.trim())
  newMessage.value = ''

  isUserScrolling.value = false
  nextTick(() => scrollToBottom())
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const nameClass = (message) => {
  if (message.playerId === gameStore.currentPlayer?.id) return 'text-gold'
  const faction = gameStore.players.find(p => p.id === message.playerId)?.faction
  if (faction === 'alliance') return 'name-alliance'
  if (faction === 'horde') return 'name-horde'
  return 'text-chan-say'
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
}
</script>

<style scoped>
.chat-frame {
  background: rgb(0 0 0 / 0.55);
  border: 1px solid rgb(255 255 255 / 0.12);
  border-radius: 0 4px 4px 4px;
}
.line { text-shadow: 1px 1px 0 #000; }

.tab {
  font-family: 'Roboto Condensed', 'Arial Narrow', sans-serif;
  font-size: 12px;
  padding: 2px 10px;
  color: rgb(255 209 0 / 0.55);
  background: rgb(0 0 0 / 0.35);
  border: 1px solid rgb(255 255 255 / 0.1);
  border-bottom: none;
  border-radius: 4px 4px 0 0;
  text-shadow: 1px 1px 0 #000;
}
.tab.is-active {
  color: #ffd100;
  background: rgb(0 0 0 / 0.6);
  border-color: rgb(255 255 255 / 0.2);
}

.edit-box {
  background: rgb(0 0 0 / 0.7);
  border-top: 1px solid #5f5f5f;
  box-shadow: inset 0 2px 6px rgb(0 0 0 / 0.9);
}
.edit-box:focus-within { border-top-color: #ffd100; }

.name-horde { color: #ff7a5c; }
.name-alliance { color: #6ea8ff; }
</style>
