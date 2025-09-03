const Game = require('../models/Game');

class GameController {
  constructor() {
    this.games = new Map(); // roomId -> Game
  }

  startGame(room, startingRoll = 1000) {
    if (!room.canStartGame()) {
      throw new Error('Cannot start game - need at least 2 players');
    }

    const activePlayers = room.getActivePlayers();
    const game = new Game(room.id, activePlayers, startingRoll);
    
    this.games.set(room.id, game);
    room.startGame();
    room.game = game;

    // Add game start message
    const currentPlayer = game.getCurrentPlayer();
    room.addGameMessage(`🎮 Game started! ${currentPlayer.name} goes first!`);
    room.addGameMessage(`🎲 Roll between 1 and ${game.currentRange.max}!`);

    console.log(`🎮 Game started in room ${room.id} with ${activePlayers.length} players, starting roll: ${startingRoll}`);
    return game;
  }

  rollDice(roomId, playerId) {
    const game = this.games.get(roomId);
    if (!game) {
      throw new Error('No active game found');
    }

    const roll = game.roll(playerId);
    
    console.log(`🎲 Player ${roll.playerName} rolled ${roll.result} (${roll.range.min}-${roll.range.max}) in room ${roomId}`);
    
    return {
      roll,
      gameState: game.getGameState()
    };
  }

  getGame(roomId) {
    return this.games.get(roomId);
  }

  finishGame(roomId) {
    const game = this.games.get(roomId);
    if (!game) return null;

    game.status = 'finished';
    console.log(`🏁 Game finished in room ${roomId}`);
    
    return game;
  }

  resetGame(roomId) {
    const game = this.games.get(roomId);
    if (game) {
      this.games.delete(roomId);
      console.log(`🔄 Game reset in room ${roomId}`);
    }
    return true;
  }

  deleteGame(roomId) {
    const deleted = this.games.delete(roomId);
    if (deleted) {
      console.log(`🗑️ Game deleted for room ${roomId}`);
    }
    return deleted;
  }

  getGameStats() {
    const totalGames = this.games.size;
    const activeGames = Array.from(this.games.values()).filter(game => game.status === 'active').length;
    const finishedGames = totalGames - activeGames;

    return {
      totalGames,
      activeGames,
      finishedGames
    };
  }

  // Get formatted roll message for chat
  formatRollMessage(roll) {
    if (roll.isEliminating) {
      return `💀 ${roll.playerName} rolls ${roll.result} (1-${roll.range.max}) and is eliminated!`;
    } else {
      return `🎲 ${roll.playerName} rolls ${roll.result} (1-${roll.range.max})`;
    }
  }

  // Get formatted game result message
  formatGameResultMessage(game) {
    if (!game.winner) {
      return "🤷 Game ended with no winner!";
    }
    
    return `🏆 ${game.winner.name} wins the Deathroll! Victory is theirs!`;
  }
}

module.exports = GameController;
