const Game = require('./Game');
const MessagingService = require('../twilio/service');

class ChainReactionStories extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.story = [];
        this.turnIndex = 0;
        this.maxTurns = 10;
        this.twists = [
            "New rule: every player must include a smell.",
            "A penguin joins the story.",
            "Genre shift: It is now a horror story."
        ];
    }

    async startGame() {
        await super.startGame();
        await this.askNextPlayer();
        return "Once upon a time...";
    }

    async askNextPlayer() {
        if (this.turnIndex >= this.maxTurns) {
            await MessagingService.broadcast(this.players, "THE END. Here is your story:\n\n" + this.story.join(' '));
            this.endGame();
            return;
        }

        // Inject Twist?
        if (this.turnIndex > 0 && this.turnIndex % 3 === 0) {
            const twist = this.twists[Math.floor(Math.random() * this.twists.length)];
            await MessagingService.broadcast(this.players, `TWIST: ${twist}`);
        }

        const currentPlayer = this.players[this.turnIndex % this.players.length];
        await MessagingService.send(currentPlayer, "Your turn. Add one sentence.");
    }

    processInput(player, text) {
        const currentPlayer = this.players[this.turnIndex % this.players.length];
        if (player !== currentPlayer) return;

        this.story.push(text);
        MessagingService.broadcast(this.players, `Story Update: ...${text}`);
        this.turnIndex++;
        this.askNextPlayer();
    }
}

module.exports = ChainReactionStories;
