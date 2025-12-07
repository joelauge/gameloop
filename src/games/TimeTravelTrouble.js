const Game = require('./Game');
const MessagingService = require('../twilio/service');

class TimeTravelTrouble extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.pieces = 0;
        this.eras = ["Jurassic", "1980s Suburb", "Future Dystopia", "Medieval Castle"];
    }

    async startGame() {
        await super.startGame();
        await this.nextJump();
        return "Time Machine Malfunction! Gathering pieces...";
    }

    async nextJump() {
        if (this.pieces >= 3) {
            await MessagingService.broadcast(this.players, "Machine Repaired! You return to the present safely.");
            this.endGame();
            return;
        }

        const era = this.eras[Math.floor(Math.random() * this.eras.length)];
        const player = this.players[Math.floor(Math.random() * this.players.length)];
        this.currentPlayer = player;

        await MessagingService.broadcast(this.players, `JUMP! Arrived in: ${era}.`);
        await MessagingService.send(player, "A local approaches. Choose: hide, befriend, ride.");
    }

    processInput(player, text) {
        if (player !== this.currentPlayer) return;

        // Random success
        if (Math.random() > 0.3) {
            this.pieces++;
            MessagingService.broadcast(this.players, `Success! Found a machine part. Total: ${this.pieces}/3`);
        } else {
            MessagingService.broadcast(this.players, "Failed. A dinosaur ate your homework.");
        }

        setTimeout(() => this.nextJump(), 2000);
    }
}

module.exports = TimeTravelTrouble;
