const Game = require('./Game');
const MessagingService = require('../twilio/service');

class TreasureTextIsland extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.treasures = {}; // player -> count
        this.target = 3;
    }

    async startGame() {
        await super.startGame();
        this.players.forEach(p => this.treasures[p] = 0);
        await this.nextRound();
        return "Welcome to Treasure Text Island! First to 3 treasures wins.";
    }

    async nextRound() {
        this.currentPlayerIdx = (this.currentPlayerIdx !== undefined ? this.currentPlayerIdx + 1 : 0) % this.players.length;
        const player = this.players[this.currentPlayerIdx];

        const dilemma = "You found a crate. Choose: open, burn, hide.";

        await MessagingService.broadcast(this.players, `@${player} is exploring...`);
        await MessagingService.send(player, dilemma);
    }

    processInput(player, text) {
        if (player !== this.players[this.currentPlayerIdx]) return;

        const action = text.toLowerCase();
        let outcome = "";

        if (action.includes("open")) {
            if (Math.random() > 0.4) {
                this.treasures[player]++;
                outcome = "Found a shiny Coconut! +1 Treasure.";
            } else {
                outcome = "It was full of angry crabs. No treasure.";
            }
        } else if (action.includes("burn")) {
            outcome = "You burned it. The smoke signals attracted a pizza drone. No treasure, but tasty.";
        } else {
            outcome = "You hid it. Boring.";
        }

        MessagingService.broadcast(this.players, `@${player}: ${outcome} (Total: ${this.treasures[player]})`);

        if (this.treasures[player] >= this.target) {
            MessagingService.broadcast(this.players, `@${player} WINS! They escape on a jetski.`);
            this.endGame();
        } else {
            setTimeout(() => this.nextRound(), 2000);
        }
    }
}

module.exports = TreasureTextIsland;
