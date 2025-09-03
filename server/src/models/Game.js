class Game {
  constructor(roomId, players, startingRoll = 1000) {
    this.roomId = roomId;
    this.players = [...players]; // Copy array to avoid mutation
    this.currentPlayerIndex = 0;
    this.currentRange = { min: 1, max: startingRoll };
    this.originalStartingRoll = startingRoll; // Store original starting roll
    this.rolls = []; // History of rolls
    this.status = 'active'; // 'active', 'finished'
    this.winner = null;
    this.startedAt = new Date();
    
    // Randomly select the starting player
    this.currentPlayerIndex = Math.floor(Math.random() * this.players.length);
  }

  getCurrentPlayer() {
    if (this.status !== 'active' || this.currentPlayerIndex >= this.players.length) {
      return null;
    }
    return this.players[this.currentPlayerIndex];
  }

  getActivePlayers() {
    return this.players.filter(p => !p.isEliminated);
  }

  roll(playerId) {
    if (this.status !== 'active') {
      throw new Error('Game is not active');
    }

    const currentPlayer = this.getCurrentPlayer();
    if (!currentPlayer || currentPlayer.id !== playerId) {
      throw new Error('Not your turn');
    }

    if (currentPlayer.isEliminated) {
      throw new Error('Player is eliminated');
    }

    // Generate random roll
    const rollResult = Math.floor(Math.random() * this.currentRange.max) + this.currentRange.min;
    
    // Create roll record
    const roll = {
      id: Date.now() + Math.random(),
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      result: rollResult,
      range: { ...this.currentRange },
      timestamp: new Date(),
      isEliminating: rollResult === 1
    };

    this.rolls.push(roll);

    // Check if player rolled 1 (eliminated)
    if (rollResult === 1) {
      currentPlayer.eliminate();
      roll.isEliminating = true;
      
      // Check if game is over
      const activePlayers = this.getActivePlayers();
      if (activePlayers.length <= 1) {
        this.status = 'finished';
        this.winner = activePlayers.length === 1 ? activePlayers[0] : null;
        this.finishedAt = new Date();
        return roll;
      }
      
      // Reset range to original starting roll after elimination
      this.currentRange = { min: 1, max: this.originalStartingRoll };
    } else {
      // Update range for next player
      this.currentRange = { min: 1, max: rollResult };
    }

    // Move to next active player
    this.moveToNextPlayer();

    return roll;
  }

  moveToNextPlayer() {
    if (this.status !== 'active') return;

    const activePlayers = this.getActivePlayers();
    if (activePlayers.length <= 1) {
      this.status = 'finished';
      this.winner = activePlayers.length === 1 ? activePlayers[0] : null;
      this.finishedAt = new Date();
      return;
    }

    // Find next active player
    let attempts = 0;
    do {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
      attempts++;
    } while (this.players[this.currentPlayerIndex].isEliminated && attempts < this.players.length * 2);

    // Safety check
    if (attempts >= this.players.length * 2) {
      this.status = 'finished';
      this.winner = null;
      this.finishedAt = new Date();
    }
  }

  isPlayerTurn(playerId) {
    const currentPlayer = this.getCurrentPlayer();
    return currentPlayer && currentPlayer.id === playerId && this.status === 'active';
  }

  getGameState() {
    return {
      roomId: this.roomId,
      status: this.status,
      currentPlayer: this.getCurrentPlayer(),
      currentRange: this.currentRange,
      originalStartingRoll: this.originalStartingRoll,
      activePlayers: this.getActivePlayers(),
      eliminatedPlayers: this.players.filter(p => p.isEliminated),
      rolls: this.rolls,
      winner: this.winner,
      startedAt: this.startedAt,
      finishedAt: this.finishedAt || null,
      totalRolls: this.rolls.length
    };
  }

  toJSON() {
    return this.getGameState();
  }
}

module.exports = Game;
