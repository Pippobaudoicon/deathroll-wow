const socketHandler = (io, { gameController, roomController }) => {
  // Periodic cleanup
  const cleanupInterval = setInterval(() => {
    roomController.cleanup();
  }, 60000); // Clean up every minute

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join room
    socket.on('join-room', async (data) => {
      try {
        const { roomId, playerName, isGuest = true } = data;
        
        console.log(`🔍 Join room request: roomId="${roomId}", playerName="${playerName}"`);
        console.log(`🔍 Available rooms:`, Array.from(roomController.rooms.keys()));
        
        if (!roomId || !playerName) {
          socket.emit('error', { message: 'Room ID and player name are required' });
          return;
        }

        const player = roomController.joinRoom(roomId, playerName.trim(), socket.id, isGuest);
        const room = roomController.getRoom(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Join socket room
        socket.join(roomId);
        
        // Send player their info
        socket.emit('player-joined', { 
          player, 
          room: room.toJSON(),
          game: room.game ? room.game.toJSON() : null
        });
        
        // Notify other players
        socket.to(roomId).emit('room-updated', room.toJSON());
        socket.to(roomId).emit('player-list-updated', room.getAllPlayers());
        
        console.log(`✅ Player ${playerName} joined room ${roomId}`);
        
      } catch (error) {
        console.error('Join room error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Leave room
    socket.on('leave-room', () => {
      const result = roomController.leaveRoom(socket.id);
      if (result) {
        const { player, room, roomDeleted } = result;
        
        if (!roomDeleted) {
          // Notify remaining players
          socket.to(room.id).emit('room-updated', room.toJSON());
          socket.to(room.id).emit('player-list-updated', room.getAllPlayers());
        }
        
        socket.leave(room.id);
        socket.emit('left-room');
        
        console.log(`✅ Player ${player.name} left room ${room.id}`);
      }
    });

    // Start game
    socket.on('start-game', (data = {}) => {
      try {
        const room = roomController.getPlayerRoom(socket.id);
        const player = roomController.getPlayerFromSocket(socket.id);
        
        if (!room || !player) {
          socket.emit('error', { message: 'Room or player not found' });
          return;
        }

        if (!player.isHost) {
          socket.emit('error', { message: 'Only the host can start the game' });
          return;
        }

        const startingRoll = data.startingRoll || 1000;
        const game = gameController.startGame(room, startingRoll);
        
        // Notify all players
        io.to(room.id).emit('game-started', {
          game: game.toJSON(),
          room: room.toJSON()
        });
        
        console.log(`🎮 Game started in room ${room.id} by ${player.name} with starting roll ${startingRoll}`);
        
      } catch (error) {
        console.error('Start game error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Roll dice
    socket.on('roll-dice', () => {
      try {
        const room = roomController.getPlayerRoom(socket.id);
        const player = roomController.getPlayerFromSocket(socket.id);
        
        if (!room || !player) {
          socket.emit('error', { message: 'Room or player not found' });
          return;
        }

        const result = gameController.rollDice(room.id, player.id);
        const { roll, gameState } = result;
        
        // Add roll message to room chat
        const rollMessage = gameController.formatRollMessage(roll);
        room.addGameMessage(rollMessage);
        
        // Check if game is finished
        if (gameState.status === 'finished') {
          room.finishGame();
          const winMessage = gameController.formatGameResultMessage(gameState);
          room.addGameMessage(winMessage);
        }
        
        // Notify all players
        io.to(room.id).emit('dice-rolled', {
          roll,
          gameState,
          room: room.toJSON()
        });
        
        if (gameState.status === 'finished') {
          io.to(room.id).emit('game-finished', {
            gameState,
            winner: gameState.winner
          });
        }
        
        console.log(`🎲 Dice rolled in room ${room.id}: ${roll.playerName} -> ${roll.result}`);
        
      } catch (error) {
        console.error('Roll dice error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Send chat message
    socket.on('send-message', (data) => {
      try {
        const { message } = data;
        const room = roomController.getPlayerRoom(socket.id);
        const player = roomController.getPlayerFromSocket(socket.id);
        
        if (!room || !player) {
          socket.emit('error', { message: 'Room or player not found' });
          return;
        }

        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        const chatMessage = room.addMessage(player.id, message.trim());
        
        // Broadcast to all players in room
        io.to(room.id).emit('new-message', chatMessage);
        
        console.log(`💬 Message in room ${room.id} from ${player.name}: ${message.trim()}`);
        
      } catch (error) {
        console.error('Send message error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Reset game
    socket.on('reset-game', () => {
      try {
        const room = roomController.getPlayerRoom(socket.id);
        const player = roomController.getPlayerFromSocket(socket.id);
        
        if (!room || !player) {
          socket.emit('error', { message: 'Room or player not found' });
          return;
        }

        if (!player.isHost) {
          socket.emit('error', { message: 'Only the host can reset the game' });
          return;
        }

        room.resetGame();
        gameController.resetGame(room.id);
        
        // Notify all players
        io.to(room.id).emit('game-reset', {
          room: room.toJSON()
        });
        
        console.log(`🔄 Game reset in room ${room.id} by ${player.name}`);
        
      } catch (error) {
        console.error('Reset game error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Get room info
    socket.on('get-room-info', (data) => {
      try {
        const { roomId } = data;
        const room = roomController.getRoom(roomId);
        
        if (!room) {
          socket.emit('room-info', { exists: false });
          return;
        }
        
        socket.emit('room-info', { 
          exists: true, 
          room: room.toJSON(),
          playerCount: room.players.size,
          canJoin: room.status === 'lobby' && room.players.size < room.maxPlayers
        });
        
      } catch (error) {
        console.error('Get room info error:', error.message);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      
      const result = roomController.handlePlayerDisconnect(socket.id);
      if (result) {
        const { player, room } = result;
        
        // Notify remaining players
        socket.to(room.id).emit('player-disconnected', {
          player: player.toJSON(),
          room: room.toJSON()
        });
        
        console.log(`👋 Player ${player.name} disconnected from room ${room.id}`);
      }
    });

    // Heartbeat/ping for connection monitoring
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  // Cleanup on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
    io.close();
  });

  process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    io.close();
  });
};

module.exports = socketHandler;
