# World of Warcraft Deathroll Web Application

A complete, real-time, multiplayer web application that faithfully recreates the "Deathroll" game from World of Warcraft.

## Features

- **Real-time Multiplayer**: Up to 8 players per room using Socket.IO
- **Authentic WoW Experience**: Dark fantasy theme with WoW-inspired UI/UX
- **Game Mechanics**: Faithful recreation of the Deathroll gameplay
- **Live Chat**: Real-time chat with game event notifications
- **Room System**: Create or join game rooms with unique IDs
- **Game History**: Complete log of all rolls and game events
- **Responsive Design**: Works on both desktop and mobile

## Tech Stack

**Frontend:**
- Vue.js 3 with Composition API
- Vite for build tooling
- Tailwind CSS for styling
- Socket.IO Client for real-time communication
- Tone.js for sound effects
- Pinia for state management

**Backend:**
- Node.js with Express.js
- Socket.IO for real-time communication
- In-memory game state management

## Installation and Setup

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd deathroll-wow
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

### Running the Application

1. Start the server (from the `server` directory):
```bash
cd server
npm run dev
```
The server will start on http://localhost:3001

2. Start the client (from the `client` directory):
```bash
cd client
npm run dev
```
The client will start on http://localhost:5173

3. Open your browser and navigate to http://localhost:5173

## Game Rules

1. **Starting**: The host creates a room and waits for 2-8 players to join
2. **First Roll**: A random player starts by rolling 1-1000
3. **Subsequent Rolls**: Each player rolls 1 to the previous roll result
4. **Elimination**: Rolling a 1 eliminates the player
5. **Victory**: Last player standing wins
6. **New Game**: Host can start a new game with the same players

## Project Structure

```
deathroll-wow/
├── client/                 # Vue.js frontend
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── stores/        # Pinia stores
│   │   ├── views/         # Page views
│   │   ├── assets/        # Static assets
│   │   └── utils/         # Utility functions
│   ├── public/            # Public assets
│   └── package.json
├── server/                # Node.js backend
│   ├── src/
│   │   ├── controllers/   # Game logic
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic
│   │   └── socket/        # Socket.IO handlers
│   ├── server.js          # Main server file
│   └── package.json
└── README.md
```

## Development

### Server Development
The server runs on port 3001 and provides:
- RESTful API endpoints
- Socket.IO real-time communication
- Game state management
- Room management

### Client Development
The client is built with Vue.js 3 and includes:
- Responsive WoW-themed UI
- Real-time game updates
- Sound effects and animations
- State management with Pinia

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational purposes and is inspired by World of Warcraft. All game assets and references are property of Blizzard Entertainment.
