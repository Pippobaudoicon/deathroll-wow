const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const GameController = require('./src/controllers/GameController');
const RoomController = require('./src/controllers/RoomController');
const socketHandler = require('./src/socket/socketHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

// Controllers
const gameController = new GameController();
const roomController = new RoomController();

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/rooms', (req, res) => {
  const { hostName, isGuest } = req.body;
  
  if (!hostName) {
    return res.status(400).json({ error: 'Host name is required' });
  }

  const room = roomController.createRoom(hostName, isGuest);
  res.json(room);
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const room = roomController.getRoom(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json(room);
});

// Socket.IO connection handling
socketHandler(io, { gameController, roomController });

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🎮 Deathroll WoW Server running on port ${PORT}`);
  console.log(`🌐 Client URL: http://localhost:5173`);
  console.log(`📡 Socket.IO enabled for real-time communication`);
});
