class Room {
  constructor(id, hostName, isGuestHost = true) {
    this.id = id;
    this.hostName = hostName;
    this.isGuestHost = isGuestHost;
    this.players = new Map(); // playerId -> Player
    this.maxPlayers = 8;
    this.status = 'lobby'; // 'lobby', 'playing', 'finished'
    this.game = null;
    this.createdAt = new Date();
    this.messages = []; // Chat messages
  }

  addPlayer(player) {
    if (this.players.size >= this.maxPlayers) {
      throw new Error('Room is full');
    }
    
    if (this.status === 'playing') {
      throw new Error('Game is already in progress');
    }

    this.players.set(player.id, player);
    
    // Add system message
    this.addSystemMessage(`${player.name} joined the room`);
    
    return player;
  }

  removePlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    this.players.delete(playerId);
    this.addSystemMessage(`${player.name} left the room`);
    
    // If host leaves, transfer host to another player
    if (player.isHost && this.players.size > 0) {
      const newHost = Array.from(this.players.values())[0];
      newHost.isHost = true;
      this.hostName = newHost.name;
      this.addSystemMessage(`${newHost.name} is now the host`);
    }
    
    return player;
  }

  disconnectPlayer(playerId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    // Mark as disconnected but keep in room for potential reconnection
    player.isConnected = false;
    player.socketId = null;
    
    this.addSystemMessage(`${player.name} disconnected`);
    
    return player;
  }

  reconnectPlayer(playerId, socketId) {
    const player = this.players.get(playerId);
    if (!player) return null;

    player.isConnected = true;
    player.socketId = socketId;
    
    this.addSystemMessage(`${player.name} reconnected`);
    
    return player;
  }

  getPlayer(playerId) {
    return this.players.get(playerId);
  }

  getPlayerBySocketId(socketId) {
    return Array.from(this.players.values()).find(p => p.socketId === socketId);
  }

  getActivePlayers() {
    return Array.from(this.players.values()).filter(p => !p.isEliminated && p.isConnected);
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  getHost() {
    return Array.from(this.players.values()).find(p => p.isHost);
  }

  addMessage(playerId, message) {
    const player = this.players.get(playerId);
    if (!player) return null;

    const chatMessage = {
      id: Date.now() + Math.random(),
      playerId: player.id,
      playerName: player.name,
      message: message.trim(),
      timestamp: new Date(),
      type: 'player'
    };

    this.messages.push(chatMessage);
    
    // Keep only last 100 messages
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
    
    return chatMessage;
  }

  addSystemMessage(message) {
    const systemMessage = {
      id: Date.now() + Math.random(),
      playerId: null,
      playerName: 'System',
      message: message,
      timestamp: new Date(),
      type: 'system'
    };

    this.messages.push(systemMessage);
    
    // Keep only last 100 messages
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
    
    return systemMessage;
  }

  addGameMessage(message) {
    const gameMessage = {
      id: Date.now() + Math.random(),
      playerId: null,
      playerName: 'Game',
      message: message,
      timestamp: new Date(),
      type: 'game'
    };

    this.messages.push(gameMessage);
    
    // Keep only last 100 messages
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
    
    return gameMessage;
  }

  canStartGame() {
    return this.status === 'lobby' && this.getActivePlayers().length >= 2;
  }

  startGame() {
    if (!this.canStartGame()) {
      throw new Error('Cannot start game');
    }
    
    this.status = 'playing';
    this.addGameMessage('🎲 The Deathroll begins! May fortune favor the bold!');
  }

  finishGame() {
    this.status = 'finished';
  }

  resetGame() {
    this.status = 'lobby';
    this.game = null;
    // Reset all players
    this.players.forEach(player => player.reset());
    this.addGameMessage('🔄 Game has been reset. Ready for another round!');
  }

  isEmpty() {
    return this.players.size === 0;
  }

  toJSON() {
    return {
      id: this.id,
      hostName: this.hostName,
      isGuestHost: this.isGuestHost,
      maxPlayers: this.maxPlayers,
      playerCount: this.players.size,
      status: this.status,
      createdAt: this.createdAt,
      players: this.getAllPlayers(),
      messages: this.messages.slice(-50), // Return last 50 messages
      canStartGame: this.canStartGame()
    };
  }
}

module.exports = Room;
