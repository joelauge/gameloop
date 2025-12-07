class SessionManager {
    constructor() {
        this.sessions = new Map(); // sessionId -> GameInstance
        this.playerMap = new Map(); // phoneNumber -> sessionId
    }

    createSession(gameClass, hostNumber) {
        const sessionId = Math.random().toString(36).substring(7).toUpperCase();
        const game = new gameClass(sessionId, hostNumber);
        this.sessions.set(sessionId, game);
        this.playerMap.set(hostNumber, sessionId);
        return game;
    }

    getSession(phoneNumber) {
        const sessionId = this.playerMap.get(phoneNumber);
        return this.sessions.get(sessionId);
    }

    endSession(phoneNumber) {
        const sessionId = this.playerMap.get(phoneNumber);
        if (sessionId) {
            const game = this.sessions.get(sessionId);
            if (game) {
                game.players.forEach(p => this.playerMap.delete(p));
                this.sessions.delete(sessionId);
            }
        }
    }
}

module.exports = new SessionManager();
