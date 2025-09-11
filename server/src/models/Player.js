class Player {
  constructor(id, name, socketId, isHost = false, isGuest = true, faction = 'alliance') {
    this.id = id;
    this.name = name;
    this.socketId = socketId;
    this.isHost = isHost;
    this.isGuest = isGuest;
    this.faction = faction;
    this.isEliminated = false;
    this.isConnected = true;
    this.joinedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      isHost: this.isHost,
      isGuest: this.isGuest,
      faction: this.faction,
      isEliminated: this.isEliminated,
      isConnected: this.isConnected,
      joinedAt: this.joinedAt
    };
  }

  eliminate() {
    this.isEliminated = true;
  }

  reset() {
    this.isEliminated = false;
  }

  disconnect() {
    this.isConnected = false;
  }

  reconnect(socketId) {
    this.socketId = socketId;
    this.isConnected = true;
  }
}

module.exports = Player;
