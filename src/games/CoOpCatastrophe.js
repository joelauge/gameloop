const Game = require('./Game');
const MessagingService = require('../twilio/service');

class CoOpCatastrophe extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.shipIntegrity = 5;
        this.events = [
            { text: "The gravity generator smells like lasagna.", action: "fix", playerSpecific: true },
            { text: "Aliens challenge you to karaoke.", action: "sing", playerSpecific: true },
            { text: "Hull breach in the cafeteria!", action: "seal", playerSpecific: true }
        ];
    }

    async startGame() {
        await super.startGame();
        await this.nextEvent();
        return "Ship System Online. Integrity: 5/5.";
    }

    async nextEvent() {
        if (this.shipIntegrity <= 0) {
            await MessagingService.broadcast(this.players, "GAME OVER. The ship has exploded (beautifully).");
            this.endGame();
            return;
        }

        const event = this.events[Math.floor(Math.random() * this.events.length)];
        const targetPlayer = this.players[Math.floor(Math.random() * this.players.length)];
        this.targetPlayer = targetPlayer;
        this.currentEvent = event;

        await MessagingService.broadcast(this.players, `ALERT: ${event.text}`);
        await MessagingService.send(targetPlayer, `It's up to you! Reply with '${event.action}' to solve it, or anything else to fail.`);
    }

    processInput(player, text) {
        if (player !== this.targetPlayer) return;

        if (text.toLowerCase().includes(this.currentEvent.action)) {
            MessagingService.broadcast(this.players, `Crisis averted by @${player}! Integrity holds.`);
        } else {
            this.shipIntegrity--;
            MessagingService.broadcast(this.players, `@${player} failed! The ship takes damage. Integrity: ${this.shipIntegrity}`);
        }

        setTimeout(() => this.nextEvent(), 2000);
    }
}

module.exports = CoOpCatastrophe;
