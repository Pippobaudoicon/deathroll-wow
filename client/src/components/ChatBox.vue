<template>
  <div class="wow-card h-96 flex flex-col">
    <div class="flex items-center justify-between mb-4">
      <h3 class="wow-subheading">💬 Chat</h3>
      <div class="text-xs text-wow-text-muted">
        {{ gameStore.messages.length }} messages
      </div>
    </div>

    <!-- Chat Messages -->
    <div ref="messagesContainer" class="chat-messages flex-1 overflow-y-auto mb-4 space-y-2">
      <div
        v-for="message in gameStore.messages"
        :key="message.id"
        class="chat-message"
        :class="{
          'system': message.type === 'system',
          'game': message.type === 'game',
          'player': message.type === 'player'
        }"
      >
        <div class="flex items-start space-x-2">
          <!-- Message Icon -->
          <div class="flex-shrink-0 text-sm">
            <span v-if="message.type === 'system'" class="text-wow-blue">🛠️</span>
            <span v-else-if="message.type === 'game'" class="text-wow-gold">🎲</span>
            <span v-else class="text-wow-text-muted">💬</span>
          </div>
          
          <!-- Message Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center space-x-2 mb-1">
              <!-- Sender Name -->
              <span 
                class="font-semibold text-xs"
                :class="{
                  'text-wow-blue': message.type === 'system',
                  'text-wow-gold': message.type === 'game',
                  'text-wow-gold': message.playerId === gameStore.currentPlayer?.id,
                  'text-wow-text-primary': message.type === 'player' && message.playerId !== gameStore.currentPlayer?.id
                }"
              >
                {{ message.playerName }}
              </span>
              
              <!-- Timestamp -->
              <span class="text-xs text-wow-text-muted">
                {{ formatTime(message.timestamp) }}
              </span>
            </div>
            
            <!-- Message Text -->
            <div 
              class="text-sm break-words"
              :class="{
                'text-wow-blue': message.type === 'system',
                'text-wow-gold': message.type === 'game',
                'text-wow-text-primary': message.type === 'player'
              }"
            >
              {{ message.message }}
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="gameStore.messages.length === 0" class="text-center py-8 text-wow-text-muted">
        <p>No messages yet</p>
        <p class="text-sm">Start the conversation!</p>
      </div>
    </div>

    <!-- Chat Input -->
    <div class="relative flex items-center gap-2 p-2 bg-wow-bg-medium border-2 border-wow-border rounded-lg shadow-wow-inset mt-auto">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type a message..."
        class="flex-1 bg-transparent text-wow-text-primary placeholder-wow-text-muted focus:outline-none px-3 py-2.5 text-sm"
        maxlength="200"
        @keyup.enter="sendMessage"
        :disabled="!gameStore.connected"
      />
      <button
        @click="sendMessage"
        :disabled="!newMessage.trim() || !gameStore.connected"
        class="flex-shrink-0 px-4 py-2 rounded-lg transition-all duration-200 font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        :class="newMessage.trim() && gameStore.connected 
          ? gameStore.selectedFaction === 'alliance' 
            ? 'bg-wow-blue text-white hover:bg-blue-600 shadow-md hover:shadow-lg' 
            : 'bg-wow-red text-white hover:bg-red-700 shadow-md hover:shadow-lg'
          : 'bg-wow-bg-tertiary text-wow-text-muted'"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 2L11 13"></path>
          <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
        </svg>
      </button>
    </div>

    <!-- Connection status for chat -->
    <div v-if="!gameStore.connected" class="text-center mt-2">
      <p class="text-xs text-wow-text-muted">
        Disconnected - Cannot send messages
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { useGameStore } from '@/stores/game'

const gameStore = useGameStore()

// Local state
const newMessage = ref('')
const messagesContainer = ref(null)
const isUserScrolling = ref(false)

// Note: Using gameStore directly in template to maintain reactivity

// Check if user is scrolling away from bottom
const handleScroll = () => {
  if (!messagesContainer.value) return
  
  const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
  const isAtBottom = scrollHeight - scrollTop - clientHeight < 50 // 50px threshold
  
  isUserScrolling.value = !isAtBottom
}

// Auto-scroll to bottom when new messages arrive
watch(() => gameStore.messages, async () => {
  await nextTick()
  // Only auto-scroll if user hasn't manually scrolled up
  if (!isUserScrolling.value) {
    scrollToBottom()
  }
}, { deep: true })

onMounted(() => {
  scrollToBottom()
  // Add scroll event listener
  if (messagesContainer.value) {
    messagesContainer.value.addEventListener('scroll', handleScroll)
  }
})

const sendMessage = () => {
  if (!newMessage.value.trim() || !gameStore.connected) return
  
  gameStore.sendMessage(newMessage.value.trim())
  newMessage.value = ''
  
  // Scroll to bottom when user sends a message
  isUserScrolling.value = false
  nextTick(() => scrollToBottom())
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
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
