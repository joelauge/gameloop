const Game = require('./Game');
const MessagingService = require('../twilio/service');

class CrypticCourier extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.turnIndex = 0;
        this.scenarios = [
            { deliver: "a Flamingo", location: "Sector 9", options: ["sneak", "barter", "dash"] },
            { deliver: "a Cursed Pizza", location: "the Vampire District", options: ["knock", "toss", "shout"] },
            { deliver: "a Briefcase of Bees", location: "the Library", options: ["walk", "run", "tiptoe"] }
        ];
        this.consequences = [
            "The union protests. Lose 2 dignity points.",
            "You tripped. The recipient is unimpressed.",
            "It explodes... with confetti! You are now fabulous.",
            "You got a tip! It's a coupon for expired milk."
        ];
    }

    startGame() {
        super.startGame();
        this.askNextPlayer();
        return "Welcome to Cryptic Courier! Deliveries are about to get weird.";
    }

    askNextPlayer() {
        if (this.turnIndex >= 5) { // Game length cap for demo
            MessagingService.broadcast(this.players, "Shift over! You survived the deliveries.");
            this.endGame();
            return;
        }

        const currentPlayer = this.players[this.turnIndex % this.players.length];
        const scenario = this.scenarios[Math.floor(Math.random() * this.scenarios.length)];
        this.currentScenario = scenario;

        MessagingService.broadcast(this.players, `Turn ${this.turnIndex + 1}: @${currentPlayer} has a job!`);
        MessagingService.send(currentPlayer, `You must deliver ${scenario.deliver} to ${scenario.location}. Choose: ${scenario.options.join(', ')}.`);
    }

    processInput(player, text) {
        const currentPlayer = this.players[this.turnIndex % this.players.length];
        if (player !== currentPlayer) return; // Ignore others

        // Simple check if text matches one of the options (loose matching)
        const choice = this.currentScenario.options.find(opt => text.toLowerCase().includes(opt));

        if (choice) {
            const consequence = this.consequences[Math.floor(Math.random() * this.consequences.length)];
            MessagingService.broadcast(this.players, `@${player} chose to ${choice}. ${consequence}`);
            this.turnIndex++;
            setTimeout(() => this.askNextPlayer(), 2000); // Delay for pacing
        } else {
            MessagingService.send(player, `Invalid choice. Options: ${this.currentScenario.options.join(', ')}`);
        }
    }
}

module.exports = CrypticCourier;
