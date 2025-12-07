class SessionManager {
    constructor() {
        this.sessions = new Map(); // sessionId -> GameInstance
        this.playerMap = new Map(); // phoneNumber -> sessionId
        // New: Track which users are in 'Onboarding' or 'Lobby Setup'
        this.onboarding = new Map(); // phoneNumber -> { state: 'ASK_NAME' }
        this.lobbies = new Map(); // hostNumber -> { gameClass: Class, players: [] }
    }

    createSession(gameClass, hostNumber, players) {
        const sessionId = Math.random().toString(36).substring(7).toUpperCase();
        const game = new gameClass(sessionId, hostNumber);

        // Add all players to the game instance
        if (players && players.length > 0) {
            players.forEach(p => {
                // Game class usually adds host by default, avoid dupe
                if (p !== hostNumber) game.addPlayer(p);
            });
        }

        this.sessions.set(sessionId, game);

        // Map all players to this session
        game.players.forEach(p => this.playerMap.set(p, sessionId));

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
