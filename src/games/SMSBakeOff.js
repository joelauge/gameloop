const Game = require('./Game');
const MessagingService = require('../twilio/service');

class SMSBakeOff extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.ingredients = [
            "unicorn dust", "pickled thunder", "spicy regret", "corn (suspicious)"
        ];
        this.actions = ["whip", "fold", "nuke", "summon sous-chef"];
    }

    async startGame() {
        await super.startGame();
        await this.askAllPlayers();
        return "Welcome to the SMS Bake-Off! Prepare your aprons.";
    }

    async askAllPlayers() {
        const ing = this.ingredients[Math.floor(Math.random() * this.ingredients.length)];
        this.currentIngredient = ing;

        await MessagingService.broadcast(this.players, `Today's secret ingredient is: ${ing}.`);
        await MessagingService.broadcast(this.players, `Reply with one action: ${this.actions.join(', ')}`);

        this.roundSubmissions = {};
    }

    processInput(player, text) {
        if (this.roundSubmissions[player]) return;

        const action = this.actions.find(a => text.toLowerCase().includes(a));
        if (action) {
            this.roundSubmissions[player] = action;
            MessagingService.send(player, "Action received.");
        } else {
            MessagingService.send(player, "Invalid technique! Paul Hollywood is watching.");
        }

        if (Object.keys(this.roundSubmissions).length === this.players.length) {
            this.judgeRound();
        }
    }

    judgeRound() {
        let narrative = "JUDGING TIME:\n";
        this.players.forEach(p => {
            const action = this.roundSubmissions[p];
            const score = Math.floor(Math.random() * 10) + 1;
            narrative += `@${p} used ${action} on ${this.currentIngredient}. Result: ${score}/10.\n`;
        });

        narrative += "The winner is... arbitrary!";
        MessagingService.broadcast(this.players, narrative);
        this.endGame();
    }
}

module.exports = SMSBakeOff;
