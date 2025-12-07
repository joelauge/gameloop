const Game = require('./Game');
const MessagingService = require('../twilio/service');

class TextTacToeRoyale extends Game {
    constructor(sessionId, host) {
        super(sessionId, host);
        this.board = Array(5).fill().map(() => Array(5).fill('.'));
        this.symbols = ['X', 'O', '∆', '#', '@'];
        this.turnIndex = 0;
    }

    startGame() {
        super.startGame();
        this.printBoard();
        this.askNextPlayer();
        return "Text-Tac-Toe Royale Started! 5x5 Grid. Last symbol standing wins.";
    }

    printBoard() {
        // Simple string representation
        const boardStr = this.board.map(row => row.join(' ')).join('\n');
        MessagingService.broadcast(this.players, `\n${boardStr}`);
    }

    askNextPlayer() {
        const currentPlayer = this.players[this.turnIndex % this.players.length];
        const symbol = this.symbols[this.turnIndex % this.players.length]; // Assign symbol by order for simplicity

        MessagingService.send(currentPlayer, `Your turn! You are '${symbol}'. Reply 'row,col' (e.g., 2,3) to place.`);
    }

    processInput(player, text) {
        const currentPlayer = this.players[this.turnIndex % this.players.length];
        if (player !== currentPlayer) return;

        const coords = text.split(',').map(n => parseInt(n.trim()) - 1);
        if (coords.length !== 2 ||
            coords[0] < 0 || coords[0] >= 5 ||
            coords[1] < 0 || coords[1] >= 5) {
            MessagingService.send(player, "Invalid format. Use row,col between 1 and 5.");
            return;
        }

        const [r, c] = coords;
        const symbol = this.symbols[this.turnIndex % this.symbols.length];

        if (this.board[r][c] !== '.') {
            // "Attack" or overwrite mechanics could go here, for now just simple block
            if (this.board[r][c] !== symbol) {
                MessagingService.broadcast(this.players, `@${player} ATTACKED ${this.board[r][c]} at ${r + 1},${c + 1}!`);
                this.board[r][c] = symbol; // Overwrite
            } else {
                MessagingService.send(player, "You already have a piece there.");
                return;
            }
        } else {
            this.board[r][c] = symbol;
        }

        // Random event
        if (Math.random() > 0.8) {
            MessagingService.broadcast(this.players, "EVENT: Earthquake! The board shuffles!");
            // Shuffle board logic simplified
            this.board = this.board.reverse();
        }

        this.printBoard();
        this.turnIndex++;
        this.askNextPlayer();
    }
}

module.exports = TextTacToeRoyale;
