class Game {
    constructor(sessionId, sender) {
        this.sessionId = sessionId;
        this.host = sender;
        this.players = [sender];
        this.state = 'LOBBY'; // LOBBY, PLAYING, ENDED
    }

    addPlayer(phoneNumber) {
        if (!this.players.includes(phoneNumber)) {
            this.players.push(phoneNumber);
            return true;
        }
        return false;
    }

    startGame() {
        this.state = 'PLAYING';
        return "Game started!";
    }

    processInput(phoneNumber, text) {
        throw new Error("processInput must be implemented by subclass");
    }

    endGame() {
        this.state = 'ENDED';
        return "Game ended.";
    }
}

module.exports = Game;
