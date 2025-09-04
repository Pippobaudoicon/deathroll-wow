import { io } from 'socket.io-client'
import { SOCKET_URL } from '@/config/env'

// Socket connection utility
export const createSocket = (url = SOCKET_URL, options = {}) => {
  const defaultOptions = {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000,
  }

  return io(url, { ...defaultOptions, ...options })
}

// Socket event handlers utility
export const setupSocketListeners = (socket, handlers = {}) => {
  Object.keys(handlers).forEach(event => {
    socket.on(event, handlers[event])
  })
}

// Socket cleanup utility
export const cleanupSocket = (socket) => {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
  }
}

// Connection status helper
export const getConnectionStatus = (socket) => {
  return {
    connected: socket?.connected || false,
    id: socket?.id || null,
    transport: socket?.io?.engine?.transport?.name || null,
  }
}

export default {
  createSocket,
  setupSocketListeners,
  cleanupSocket,
  getConnectionStatus,
}
