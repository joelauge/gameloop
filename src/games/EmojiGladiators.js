const Game = require('./Game');
const MessagingService = require('../twilio/service');

class EmojiGladiators extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.emojis = ['🐙', '🐉', '🤖', '🐔', '🧀'];
        this.attacks = ['lunge', 'yeet', 'smash', 'confuse', 'hide'];
        this.playerStats = {};
    }

    async startGame() {
        await super.startGame();

        // Solo mode Check
        if (this.players.length === 1) {
            const botName = '+0000000000'; // Ghost Bot
            this.players.push(botName);
            this.playerStats[botName] = { hp: 3, emoji: '🤖', isBot: true };
            await MessagingService.send(this.players[0], "Solo Mode: You are fighting the ROBO-GLADIATOR!");
        }

        this.players.forEach(p => {
            if (!this.playerStats[p]) {
                this.playerStats[p] = { hp: 3, emoji: this.emojis[Math.floor(Math.random() * this.emojis.length)] };
            }
        });

        await this.nextTurn();
        return "Welcome to the Arena!";
    }

    async nextTurn() {
        // Are we done?
        const alive = this.players.filter(p => this.playerStats[p].hp > 0);
        if (alive.length === 1 && this.players.length > 1) {
            const winner = alive[0];
            const winnerName = this.playerStats[winner].isBot ? "ROBO-GLADIATOR" : `@${winner}`;
            await MessagingService.broadcast(this.players.filter(p => !this.playerStats[p].isBot), `WINNER: ${this.playerStats[winner].emoji} (${winnerName})!`);
            this.endGame();
            return;
        } else if (alive.length === 0) {
            // Everyone died (possible if dot happens or simultaneous)
            await MessagingService.broadcast(this.players.filter(p => !this.playerStats[p].isBot), "Everyone is KO. It's a draw!");
            this.endGame();
            return;
        }

        const arena = ["Jell-O Stadium", "The Moon", "A Walmart Parking Lot"][Math.floor(Math.random() * 3)];
        const humanPlayers = this.players.filter(p => !this.playerStats[p].isBot);
        await MessagingService.broadcast(humanPlayers, `Current Arena: ${arena}`);

        humanPlayers.forEach(p => {
            if (this.playerStats[p].hp > 0) {
                MessagingService.send(p, `You are ${this.playerStats[p].emoji}. HP: ${this.playerStats[p].hp}. Attack! (${this.attacks.join(', ')})`);
            }
        });

        this.moves = {};

        // Auto-move for Bot
        const bot = this.players.find(p => this.playerStats[p].isBot);
        if (bot && this.playerStats[bot].hp > 0) {
            this.moves[bot] = this.attacks[Math.floor(Math.random() * this.attacks.length)];
        }
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
