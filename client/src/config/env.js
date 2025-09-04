// Environment configuration for different deployment environments

const config = {
  development: {
    API_URL: 'http://localhost:3040',
    SOCKET_URL: 'http://localhost:3040'
  },
  production: {
    API_URL: 'https://deathroll.tommasolopiparo.com', // Update with your actual domain
    SOCKET_URL: 'https://deathroll.tommasolopiparo.com' // Update with your actual domain
  }
}

// Detect environment
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const environment = isDevelopment ? 'development' : 'production'

console.log('🌍 Environment detected:', environment)
console.log('🔗 Using configuration:', config[environment])

export const API_URL = config[environment].API_URL
export const SOCKET_URL = config[environment].SOCKET_URL
