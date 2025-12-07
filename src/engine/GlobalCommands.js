const SessionManager = require('./SessionManager');
const MessagingService = require('../twilio/service');
const UserManager = require('./UserManager');

class GlobalCommands {

    // Returns TRUE if a command was handled and execution should stop.
    async handle(sender, message) {
        const cmd = message.trim().toUpperCase();

        // 1. QUIT / EXIT
        if (cmd === 'QUIT' || cmd === 'EXIT') {
            await this.handleQuit(sender);
            return true;
        }

        // 2. MENU / HOME
        if (cmd === 'MENU' || cmd === 'HOME') {
            await this.handleQuit(sender); // Quit implicitly
            return false; // Allow index.js to show menu? Or explicitly show menu here?
            // Better to just quit and let index.js show menu if they send "Menu" again? 
            // Actually, let's explicitly show menu.
        }

        // 3. RESTART (Host Only?)
        if (cmd === 'RESTART') {
            await this.handleRestart(sender);
            return true;
        }

        // 4. JOIN [Target]
        if (cmd.startsWith('JOIN ')) {
            const target = message.substring(5).trim(); // Name or Number
            await this.handleJoin(sender, target);
            return true;
        }

        return false;
    }

    async handleQuit(sender) {
        const session = SessionManager.getSession(sender);
        if (session) {
            // Remove player from session
            session.removePlayer(sender); // Method needs to exist on Game or we handle it in SessionManager
            SessionManager.leaveSession(sender);
            await MessagingService.send(sender, "You have left the game. Reply 'MENU' key to pick a new game.");

            // Notify others
            const user = await UserManager.getUser(sender);
            const name = user ? user.name : "A player";
            MessagingService.broadcast(session.players, `${name} has left the game.`);
        } else {
            await MessagingService.send(sender, "You aren't in a game.");
        }
    }

    async handleRestart(sender) {
        const session = SessionManager.getSession(sender);
        if (!session) return;

        // Only host? For now, anyone.
        await MessagingService.broadcast(session.players, "Restarting game...");

        // Reset Logic: 
        // 1. Get current class and players
        const GameClass = session.constructor;
        const players = [...session.players];
        const host = session.host; // Assuming games store host

        // 2. End old session
        SessionManager.endSession(host); // Nuke it for everyone

        // 3. Start new session
        const newSession = SessionManager.createSession(GameClass, host, players);
        newSession.startGame();
    }

    async handleJoin(sender, target) {
        // Try to find a session where 'target' is a player
        // Target might be a phone number or a name
        let targetPhone = null;

        // Is it a phone number?
        const cleanPhone = target.replace(/[^0-9]/g, '');
        if (cleanPhone.length >= 10) {
            // Assume phone
            targetPhone = '+' + (cleanPhone.length === 10 ? '1' : '') + cleanPhone;
            // Rough normalization, might fail if strict
        } else {
            // Look up name in *overall* DB? Or just check active players?
            // Checking all active players is safer/faster
            targetPhone = SessionManager.findActivePlayerByName(target);
        }

        if (targetPhone) {
            const session = SessionManager.getSession(targetPhone);
            if (session) {
                // Add sender to this session
                SessionManager.joinSession(session.id, sender);

                // Notify
                const user = await UserManager.getUser(sender);
                const name = user ? user.name : "A new player";

                await MessagingService.send(sender, "Creating uplink... Connected!");
                MessagingService.broadcast(session.players, `${name} has joined the game!`);
                return;
            }
        }

        await MessagingService.send(sender, `Could not find a game with '${target}'. Ask them for their exact phone number.`);
    }
}

module.exports = new GlobalCommands();
