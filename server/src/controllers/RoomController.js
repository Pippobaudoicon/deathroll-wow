const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const Player = require('../models/Player');

class RoomController {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
    this.playerToRoom = new Map(); // playerId -> roomId
    this.socketToPlayer = new Map(); // socketId -> playerId
  }

  createRoom(hostName, isGuest = true) {
    const roomId = this.generateRoomId();
    const room = new Room(roomId, hostName, isGuest);
    
    this.rooms.set(roomId, room);
    
    console.log(`🏠 Room ${roomId} created by ${hostName}`);
    return room;
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  deleteRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Clean up player mappings
    room.getAllPlayers().forEach(player => {
      this.playerToRoom.delete(player.id);
      this.socketToPlayer.delete(player.socketId);
    });

    this.rooms.delete(roomId);
    console.log(`🗑️ Room ${roomId} deleted`);
    return true;
  }

  joinRoom(roomId, playerName, socketId, isGuest = true) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new Error('Room not found');
    }

    // Check if player already exists in room by socket
    const existingPlayer = room.getPlayerBySocketId(socketId);
    if (existingPlayer) {
      return existingPlayer;
    }

    // Check if player name is already taken - handle reconnection
    const players = room.getAllPlayers();
    const existingPlayerByName = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    
    if (existingPlayerByName) {
      console.log(`🔄 Player ${playerName} is reconnecting to room ${roomId}`);
      
      // Remove old socket mapping
      if (existingPlayerByName.socketId) {
        this.socketToPlayer.delete(existingPlayerByName.socketId);
      }
      
      // Update player with new socket ID and mark as connected
      existingPlayerByName.socketId = socketId;
      existingPlayerByName.isConnected = true;
      
      // Update mappings with new socket
      this.playerToRoom.set(existingPlayerByName.id, roomId);
      this.socketToPlayer.set(socketId, existingPlayerByName.id);
      
      console.log(`✅ Player ${playerName} reconnected to room ${roomId}`);
      return existingPlayerByName;
    }

    // Create new player
    const playerId = uuidv4();
    // Check if this player should be the host (same name as room host and first to join)
    const isPlayerHost = playerName.toLowerCase() === room.hostName.toLowerCase() && players.length === 0;
    const player = new Player(playerId, playerName, socketId, isPlayerHost, isGuest);
    
    console.log(`👤 Creating player: ${playerName}, isHost: ${isPlayerHost}, room host: ${room.hostName}, existing players: ${players.length}`);
    
    // Add player to room
    room.addPlayer(player);
    
    // Update mappings
    this.playerToRoom.set(playerId, roomId);
    this.socketToPlayer.set(socketId, playerId);

    console.log(`👤 Player ${playerName} joined room ${roomId}`);
    return player;
  }

  leaveRoom(socketId) {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return null;

    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.removePlayer(playerId);
    if (!player) return null;

    // Clean up mappings
    this.playerToRoom.delete(playerId);
    this.socketToPlayer.delete(socketId);

    // Delete room if empty
    if (room.isEmpty()) {
      this.deleteRoom(roomId);
    }

    console.log(`👤 Player ${player.name} left room ${roomId}`);
    return { player, room, roomDeleted: room.isEmpty() };
  }

  disconnectPlayer(socketId) {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return null;

    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.disconnectPlayer(playerId);
    if (!player) return null;

    // Clean up socket mapping but keep player mapping for reconnection
    this.socketToPlayer.delete(socketId);

    console.log(`🔌 Player ${player.name} disconnected from room ${roomId}`);
    return { player, room };
  }

  handlePlayerDisconnect(socketId) {
    // Use disconnectPlayer for socket disconnections to allow reconnections
    return this.disconnectPlayer(socketId);
  }

  getPlayerRoom(socketId) {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return null;

    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    return this.rooms.get(roomId);
  }

  getPlayerFromSocket(socketId) {
    const playerId = this.socketToPlayer.get(socketId);
    if (!playerId) return null;

    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    return room.getPlayer(playerId);
  }

  handlePlayerDisconnect(socketId) {
    const player = this.getPlayerFromSocket(socketId);
    const room = this.getPlayerRoom(socketId);
    
    if (!player || !room) return null;

    player.disconnect();
    room.addSystemMessage(`${player.name} disconnected`);
    
    console.log(`🔌 Player ${player.name} disconnected from room ${room.id}`);
    return { player, room };
  }

  handlePlayerReconnect(socketId, playerId) {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.getPlayer(playerId);
    if (!player) return null;

    // Update socket mapping
    this.socketToPlayer.delete(player.socketId); // Remove old socket
    this.socketToPlayer.set(socketId, playerId); // Add new socket
    
    player.reconnect(socketId);
    room.addSystemMessage(`${player.name} reconnected`);
    
    console.log(`🔌 Player ${player.name} reconnected to room ${room.id}`);
    return { player, room };
  }

  generateRoomId() {
    // Generate a 6-character room ID
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Ensure uniqueness
    if (this.rooms.has(result)) {
      return this.generateRoomId();
    }
    
    return result;
  }

  getRoomStats() {
    const totalRooms = this.rooms.size;
    const totalPlayers = this.socketToPlayer.size;
    const roomsInGame = Array.from(this.rooms.values()).filter(room => room.status === 'playing').length;
    
    return {
      totalRooms,
      totalPlayers,
      roomsInGame,
      roomsInLobby: totalRooms - roomsInGame
    };
  }

  // Clean up disconnected players periodically
  cleanup() {
    const now = Date.now();
    const DISCONNECT_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    this.rooms.forEach((room, roomId) => {
      const playersToRemove = [];
      
      room.getAllPlayers().forEach(player => {
        if (!player.isConnected && (now - player.joinedAt.getTime()) > DISCONNECT_TIMEOUT) {
          playersToRemove.push(player.id);
        }
      });

      playersToRemove.forEach(playerId => {
        const player = room.getPlayer(playerId);
        if (player) {
          room.removePlayer(playerId);
          this.playerToRoom.delete(playerId);
          this.socketToPlayer.delete(player.socketId);
          console.log(`🧹 Cleaned up disconnected player ${player.name} from room ${roomId}`);
        }
      });

      if (room.isEmpty()) {
        this.deleteRoom(roomId);
      }
    });
  }
}

module.exports = RoomController;
