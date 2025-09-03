<template>
  <div class="chat-container">
    <div class="flex items-center justify-between mb-4">
      <h3 class="wow-subheading">💬 Chat</h3>
      <div class="text-xs text-wow-text-muted">
        {{ gameStore.messages.length }} messages
      </div>
    </div>

    <!-- Chat Messages -->
    <div ref="messagesContainer" class="chat-messages">
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
    <div class="flex space-x-2">
      <input
        v-model="newMessage"
        type="text"
        placeholder="Type a message..."
        class="wow-input flex-1"
        maxlength="200"
        @keyup.enter="sendMessage"
        :disabled="!gameStore.connected"
      />
      <button
        @click="sendMessage"
        :disabled="!newMessage.trim() || !gameStore.connected"
        class="wow-button px-4"
      >
        📤
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

// Note: Using gameStore directly in template to maintain reactivity

// Auto-scroll to bottom when new messages arrive
watch(() => gameStore.messages, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  scrollToBottom()
})

const sendMessage = () => {
  if (!newMessage.value.trim() || !gameStore.connected) return
  
  gameStore.sendMessage(newMessage.value.trim())
  newMessage.value = ''
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
