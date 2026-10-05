# World of Warcraft Deathroll Web Application

A complete, real-time, multiplayer web application that faithfully recreates the "Deathroll" game from World of Warcraft.

## Features

- **Real-time Multiplayer**: Up to 8 players per room over WebSockets
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
- Tone.js for sound effects
- Pinia for state management

**Backend:**
- Cloudflare Workers (API + static assets)
- Durable Objects (one per room) with WebSockets for real-time state

## Installation and Setup

### Prerequisites
- Node.js (version 18 or higher)

### Installation

```bash
git clone https://github.com/Pippobaudoicon/deathroll-wow
cd deathroll-wow
npm install
```

### Running the Application

```bash
npm run dev:worker   # API + Durable Objects on http://localhost:8787
npm run dev:client   # Vite on http://localhost:5173 (proxies /api to the worker)
```

Then open http://localhost:5173.

### Deploying

`npm run deploy` builds the client and deploys everything to Cloudflare Workers. See [DEPLOYMENT.md](DEPLOYMENT.md).

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
├── worker/
│   └── index.js           # Worker API + Room Durable Object (game logic)
├── wrangler.jsonc         # Cloudflare config
└── README.md
```

## Development

### Worker Development
`worker/index.js` provides:
- REST endpoints for creating and looking up rooms
- A WebSocket per room, handled by the `Room` Durable Object
- Game and room state, persisted in Durable Object storage

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
