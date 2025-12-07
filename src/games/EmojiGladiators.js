const Game = require('./Game');
const MessagingService = require('../twilio/service');

class EmojiGladiators extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.emojis = ['🐙', '🐉', '🤖', '🐔', '🧀'];
        this.attacks = ['lunge', 'yeet', 'smash', 'confuse', 'hide'];
        this.playerStats = {};
    }

    startGame() {
        super.startGame();
        this.players.forEach(p => {
            this.playerStats[p] = { hp: 3, emoji: this.emojis[Math.floor(Math.random() * this.emojis.length)] };
        });

        this.nextTurn();
        return "Welcome to the Arena!";
    }

    nextTurn() {
        // Are we done?
        const alive = this.players.filter(p => this.playerStats[p].hp > 0);
        if (alive.length === 1 && this.players.length > 1) {
            MessagingService.broadcast(this.players, `WINNER: ${this.playerStats[alive[0]].emoji} (@${alive[0]})!`);
            this.endGame();
            return;
        } else if (alive.length === 0) {
            // Everyone died (possible if dot happens or simultaneous)
            MessagingService.broadcast(this.players, "Everyone is KO. It's a draw!");
            this.endGame();
            return;
        }

        const arena = ["Jell-O Stadium", "The Moon", "A Walmart Parking Lot"][Math.floor(Math.random() * 3)];
        MessagingService.broadcast(this.players, `Current Arena: ${arena}`);

        alive.forEach(p => {
            MessagingService.send(p, `You are ${this.playerStats[p].emoji}. HP: ${this.playerStats[p].hp}. Attack! (${this.attacks.join(', ')})`);
        });

        this.moves = {};
    }

    processInput(player, text) {
        if (this.playerStats[player].hp <= 0) return;
        if (this.moves[player]) return;

        const attack = this.attacks.find(a => text.toLowerCase().includes(a));
        if (attack) {
            this.moves[player] = attack;
        } else {
            MessagingService.send(player, "Invalid technique. You stumble.");
            this.moves[player] = "stumble";
        }

        const aliveCount = this.players.filter(p => this.playerStats[p].hp > 0).length;
        if (Object.keys(this.moves).length === aliveCount) {
            this.resolveTurn();
        }
    }

    resolveTurn() {
        let report = "TURN REPORT:\n";
        this.players.forEach(p => {
            if (this.playerStats[p].hp <= 0) return;

            const move = this.moves[p];
            // Random damage logic
            const dmg = Math.floor(Math.random() * 2);

            // Target random other player
            const targets = this.players.filter(t => t !== p && this.playerStats[t].hp > 0);
            if (targets.length > 0) {
                const target = targets[Math.floor(Math.random() * targets.length)];
                this.playerStats[target].hp -= dmg;
                report += `@${p} used ${move} on @${target}. Dealt ${dmg} dmg.\n`;
            } else {
                report += `@${p} flailed at nothing.\n`;
            }
        });

        MessagingService.broadcast(this.players, report);
        setTimeout(() => this.nextTurn(), 3000);
    }
}

module.exports = EmojiGladiators;
