// Game configuration constants
export const GAME_CONFIG = {
  MAX_PLAYERS: 8,
  MIN_PLAYERS: 2,
  STARTING_RANGE: { min: 1, max: 1000 },
  MAX_MESSAGE_LENGTH: 200,
  MAX_PLAYER_NAME_LENGTH: 20,
  ROOM_ID_LENGTH: 6,
  DISCONNECT_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  MAX_CHAT_HISTORY: 100,
  ROLL_ANIMATION_DURATION: 1000, // 1 second
}

// Game status constants
export const GAME_STATUS = {
  LOBBY: 'lobby',
  PLAYING: 'playing',
  FINISHED: 'finished',
}

// Player status constants
export const PLAYER_STATUS = {
  ACTIVE: 'active',
  ELIMINATED: 'eliminated',
  DISCONNECTED: 'disconnected',
}

// Message types
export const MESSAGE_TYPES = {
  PLAYER: 'player',
  SYSTEM: 'system',
  GAME: 'game',
}

// Socket events
export const SOCKET_EVENTS = {
  // Client to Server
  JOIN_ROOM: 'join-room',
  LEAVE_ROOM: 'leave-room',
  START_GAME: 'start-game',
  ROLL_DICE: 'roll-dice',
  SEND_MESSAGE: 'send-message',
  RESET_GAME: 'reset-game',
  GET_ROOM_INFO: 'get-room-info',
  PING: 'ping',

  // Server to Client
  PLAYER_JOINED: 'player-joined',
  ROOM_UPDATED: 'room-updated',
  PLAYER_LIST_UPDATED: 'player-list-updated',
  GAME_STARTED: 'game-started',
  DICE_ROLLED: 'dice-rolled',
  GAME_FINISHED: 'game-finished',
  GAME_RESET: 'game-reset',
  NEW_MESSAGE: 'new-message',
  LEFT_ROOM: 'left-room',
  PLAYER_DISCONNECTED: 'player-disconnected',
  ROOM_INFO: 'room-info',
  ERROR: 'error',
  PONG: 'pong',
}

// UI Constants
export const UI_CONFIG = {
  COLORS: {
    PRIMARY: '#ffd700',
    SECONDARY: '#0084ff',
    DANGER: '#cc2936',
    SUCCESS: '#28a745',
    WARNING: '#ffc107',
    DARK: '#0f0f0f',
    MEDIUM: '#1a1a1a',
    LIGHT: '#2a2a2a',
  },
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
  },
}

// Sound configuration
export const SOUND_CONFIG = {
  VOLUME: 0.5,
  CLICK_FREQUENCY: 'C4',
  ROLL_FREQUENCIES: ['C4', 'D4', 'E4', 'F4', 'G4'],
  WIN_FANFARE: ['C5', 'E5', 'G5', 'C6'],
  LOSE_SEQUENCE: ['G4', 'F4', 'E4', 'D4', 'C4'],
  CHAT_FREQUENCY: 'A4',
}

export default {
  GAME_CONFIG,
  GAME_STATUS,
  PLAYER_STATUS,
  MESSAGE_TYPES,
  SOCKET_EVENTS,
  UI_CONFIG,
  SOUND_CONFIG,
}
