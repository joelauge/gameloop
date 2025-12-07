const Game = require('./Game');
const MessagingService = require('../twilio/service');

class WereTextMystery extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.rounds = 0;
        this.maxRounds = 5;
        this.texterwolf = null;
        this.votes = {};
        this.challenges = [
            { text: "A storm hits the village. Choose: reinforce, evacuate, gather.", options: ["reinforce", "evacuate", "gather"] },
            { text: "Someone stole the cookies. Choose: investigate, accuse, eat crumbs.", options: ["investigate", "accuse", "eat"] },
            { text: "The generator is failing. Choose: fix, kick, ignore.", options: ["fix", "kick", "ignore"] }
        ];
        this.currentChallenge = null;
        this.playerMoves = {}; // Map<player, move>
    }

    async startGame() {
        await super.startGame();
        // Assign roles
        if (this.players.length < 2) {
            // For testing/single player
            this.texterwolf = this.players[0]; // Host is wolf in single player
            await MessagingService.send(this.players[0], "Solo Mode: You are the Texterwolf (and also the Villager). Practice round!");
        } else {
            const wolfIndex = Math.floor(Math.random() * this.players.length);
            this.texterwolf = this.players[wolfIndex];

            // Notify players of roles
            for (const p of this.players) {
                if (p === this.texterwolf) {
                    await MessagingService.send(p, "You are the Texterwolf! Sabotage the group.");
                } else {
                    await MessagingService.send(p, "You are a Villager. Find the Texterwolf and survive.");
                }
            }
        }

        await this.nextRound();
        return "The Were-Text Mystery Begins! Roles have been assigned.";
    }

    async nextRound() {
        this.rounds++;
        if (this.rounds > this.maxRounds) {
            await this.startVoting();
            return;
        }

        this.currentChallenge = this.challenges[Math.floor(Math.random() * this.challenges.length)];
        this.playerMoves = {};
        await MessagingService.broadcast(this.players, `Round ${this.rounds}: ${this.currentChallenge.text} (Text me privately)`);
    }

    processInput(player, text) {
        if (this.state === 'VOTING') {
            this.processVote(player, text);
            return;
        }

        if (this.playerMoves[player]) {
            MessagingService.send(player, "You already moved this round.");
            return;
        }

        // Simple validation
        const isValid = this.currentChallenge.options.some(opt => text.toLowerCase().includes(opt));
        if (!isValid) {
            MessagingService.send(player, `Invalid option. Choose: ${this.currentChallenge.options.join(', ')}`);
            return;
        }

        this.playerMoves[player] = text.toLowerCase();
        MessagingService.send(player, "Move recorded.");

        if (Object.keys(this.playerMoves).length === this.players.length) {
            this.resolveRound();
        }
    }

    resolveRound() {
        // Did the wolf vote?
        // For simplicity in this text game, we just say if wolf participated, something 'bad' might happen
        // or we implement the 'sabotage' logic from the prompt.
        // Prompt says: "GM reveals majority vote + a mysterious sabotage effect if the Texterwolf acted."

        let moveCounts = {};
        let wolfMove = this.playerMoves[this.texterwolf];

        Object.values(this.playerMoves).forEach(m => {
            moveCounts[m] = (moveCounts[m] || 0) + 1;
        });

        // Find majority
        let majorityMove = Object.keys(moveCounts).reduce((a, b) => moveCounts[a] > moveCounts[b] ? a : b);

        let outcome = `The village chose to ${majorityMove}.`;

        if (wolfMove) {
            outcome += " BUT... strange scratches were found on the walls. Parameters were sub-optimal.";
        } else {
            outcome += " It seems peaceful... for now.";
        }

        MessagingService.broadcast(this.players, outcome);
        setTimeout(() => this.nextRound(), 3000);
    }

    startVoting() {
        this.state = 'VOTING';
        MessagingService.broadcast(this.players, "Final Round! Who is the Texterwolf? Reply with the phone number or name (if known).");
    }

    processVote(player, text) {
        // Simplified voting for prototype: Assume they text a number that matches the wolf
        // In reality we'd need a mapping of Player 1, Player 2 etc. to numbers to make this usable.
        // For this demo, we'll just check if they text 'wolf' or something generic or cheat and text the number.

        if (text === this.texterwolf) {
            MessagingService.broadcast(this.players, "The Texterwolf was caught! Villagers win!");
            this.endGame();
        } else {
            MessagingService.broadcast(this.players, "That was not the wolf... The Texterwolf feasts tonight!");
            this.endGame();
        }
    }
}

module.exports = WereTextMystery;
