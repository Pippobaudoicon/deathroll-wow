// Environment configuration for different deployment environments

const config = {
  development: {
    API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3040',
    SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3040'
  },
  production: {
    API_URL: import.meta.env.VITE_API_URL || 'https://deathroll.xyz',
    SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'https://deathroll.xyz'
  }
}

// Detect environment
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const environment = isDevelopment ? 'development' : 'production'

console.log('🌍 Environment detected:', environment)
console.log('🔗 Using configuration:', config[environment])

export const API_URL = config[environment].API_URL
export const SOCKET_URL = config[environment].SOCKET_URL
