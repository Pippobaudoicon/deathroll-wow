// Minimal Socket.IO-style wrapper (on/emit/connect/disconnect) over a native WebSocket.
// Frames are JSON { event, data }. Reconnects up to 5 times with a growing delay.
export const createSocket = (roomId) => {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${protocol}://${location.host}/api/rooms/${encodeURIComponent(roomId)}/ws`
  const listeners = {}
  let ws = null
  let attempts = 0
  let closedByUser = false

  const fire = (event, data) => (listeners[event] || []).forEach(fn => fn(data))

  const open = () => {
    ws = new WebSocket(url)
    ws.onopen = () => {
      attempts = 0
      socket.connected = true
      fire('connect')
    }
    ws.onmessage = (e) => {
      const { event, data } = JSON.parse(e.data)
      fire(event, data)
    }
    ws.onclose = () => {
      socket.connected = false
      fire('disconnect')
      if (!closedByUser && attempts < 5) setTimeout(open, 1000 * ++attempts)
    }
  }

  const socket = {
    roomId,
    connected: false,
    on(event, fn) {
      (listeners[event] ||= []).push(fn)
    },
    emit(event, data) {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ event, data }))
    },
    connect() {
      closedByUser = false
      open()
    },
    disconnect() {
      closedByUser = true
      ws?.close()
    },
  }
  return socket
}
