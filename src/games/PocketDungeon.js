const Game = require('./Game');
const MessagingService = require('../twilio/service');

class PocketDungeon extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.rooms = [
            { text: "A goblin who only speaks in emojis.", options: ["poke", "trade", "run"] },
            { text: "A treasure chest that seems to be breathing.", options: ["open", "kick", "soothe"] },
            { text: "A magical vending machine.", options: ["buy", "shake", "worship"] }
        ];
        this.loot = ["Golden Spork", "Cursed Sock", "Invisible Hat", "Pocket Lint of Power"];
    }

    async startGame() {
        await super.startGame();
        await this.nextTurn();
        return "Entering the Pocket Dungeon...";
    }

    async nextTurn() {
        // Random player
        const currentPlayer = this.players[Math.floor(Math.random() * this.players.length)];
        const room = this.rooms[Math.floor(Math.random() * this.rooms.length)];
        this.currentRoom = room;
        this.currentPlayer = currentPlayer;

        await MessagingService.broadcast(this.players, `@${currentPlayer} encounters: ${room.text}`);
        await MessagingService.send(currentPlayer, `What do you do? Options: ${room.options.join(', ')}`);
    }

    processInput(player, text) {
        if (player !== this.currentPlayer) return;

        const choice = this.currentRoom.options.find(opt => text.toLowerCase().includes(opt));
        if (!choice) {
            MessagingService.send(player, `Invalid choice. Options: ${this.currentRoom.options.join(', ')}`);
            return;
        }

        const foundLoot = Math.random() > 0.5 ? this.loot[Math.floor(Math.random() * this.loot.length)] : null;
        let response = `@${player} chose to ${choice}. `;

        if (foundLoot) {
            response += `Success! Found: ${foundLoot}.`;
        } else {
            response += `It was a trap! Lost 5 HP.`;
        }

        MessagingService.broadcast(this.players, response);

        // Endless loop for now, or just continue
        setTimeout(() => this.nextTurn(), 2000);
    }
}

module.exports = PocketDungeon;
