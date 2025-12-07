require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const MessagingService = require('./twilio/service');
const SessionManager = require('./engine/SessionManager');
const GameRegistry = require('./GameRegistry');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const PORT = process.env.PORT || 3000;

app.post('/sms', async (req, res) => {
    const { From, Body } = req.body;
    const sender = From;
    const message = Body.trim();

    console.log(`Received SMS from ${sender}: ${message}`);

    // 1. Check if User exists (Onboarding)
    const UserManager = require('./engine/UserManager');
    const user = await UserManager.getUser(sender);
    if (!user) {
        // New User Flow
        const onboardingState = SessionManager.onboarding.get(sender);
        if (!onboardingState) {
            SessionManager.onboarding.set(sender, { step: 'NAME' });
            await MessagingService.send(sender, "Welcome to Gameloop! I don't recognize this number. What should I call you?");
        } else {
            // Save Name
            await UserManager.createUser(sender, message);
            SessionManager.onboarding.delete(sender);
            await MessagingService.send(sender, `Nice to meet you, ${message}! Reply with a number to pick a game.`);
            await sendMenu(sender);
        }
        res.type('text/xml').send('<Response></Response>');
        return;
    }

    // 2. Check if in Active Game
    let session = SessionManager.getSession(sender);
    if (session) {
        if (message.toLowerCase() === 'quit') {
            SessionManager.endSession(sender);
            await MessagingService.send(sender, "You have left the game.");
        } else {
            // Chat Relay: Broadcast to others
            const others = session.players.filter(p => p !== sender);
            if (others.length > 0) {
                const userProfile = await UserManager.getUser(sender);
                const senderName = userProfile ? userProfile.name : "Player";
                await MessagingService.broadcast(others, `${senderName}: ${message}`);
            }

            // Game Processing
            session.processInput(sender, message);
        }
        res.type('text/xml').send('<Response></Response>');
        return;
    }

    // 3. Check if in Lobby Setup
    const lobby = SessionManager.lobbies.get(sender);
    if (lobby) {
        if (message.toLowerCase() === 'start') {
            // Start the game with gathered players
            const newSession = SessionManager.createSession(lobby.gameClass, sender, lobby.players);
            SessionManager.lobbies.delete(sender);

            await MessagingService.send(sender, "Starting game...");
            const response = newSession.startGame(); // This usually returns a string, but broadcasts are better
            // Ideally startGame broadcasts to everyone.
        } else if (message.toLowerCase() === 'cancel') {
            SessionManager.lobbies.delete(sender);
            await MessagingService.send(sender, "Lobby cancelled.");
            await sendMenu(sender);
        } else {
            // Parsing Invites
            const InputParser = require('./engine/InputParser');

            const parsed = InputParser.parseInvites(message);
            let addedCount = 0;
            let responseMsg = "";

            // Add new friends
            for (const f of parsed.newFriends) {
                // Determine if valid phone
                await UserManager.addFriend(sender, f.name, f.phone);
                if (!lobby.players.includes(f.phone)) {
                    lobby.players.push(f.phone);
                    // Notify the friend? Maybe not yet to avoid spam, or yes to invite?
                    // For simplicity, we assume they are 'in' when game starts.
                    responseMsg += `Added ${f.name} (${f.phone}). `;
                    addedCount++;
                }
            }

            // Add existing names
            for (const name of parsed.existingNames) {
                const friend = await UserManager.getFriendByName(sender, name);
                if (friend) {
                    if (!lobby.players.includes(friend.phone)) {
                        lobby.players.push(friend.phone);
                        responseMsg += `Added ${friend.name}. `;
                        addedCount++;
                    }
                } else {
                    responseMsg += `Could not find friend '${name}'. `;
                }
            }

            if (addedCount > 0) {
                await MessagingService.send(sender, `${responseMsg}\nCurrent Lobby: ${lobby.players.length} players. Reply 'START' to begin or add more.`);
            } else {
                const friends = await UserManager.getFriendListDisplay(sender);
                await MessagingService.send(sender, `I didn't catch that. Reply with 'Add [Name] [Number]' or just '[Name]' if they are in your history.\n\nYour Friends: ${friends}\n\nReply START to go.`);
            }
        }
        res.type('text/xml').send('<Response></Response>');
        return;
    }

    // 4. Main Menu / Game Selection
    if (GameRegistry[message]) {
        const gameEntry = GameRegistry[message];
        if (!gameEntry.class) {
            await MessagingService.send(sender, `Sorry, ${gameEntry.name} is coming soon!`);
        } else {
            // Create Lobby
            SessionManager.lobbies.set(sender, {
                gameClass: gameEntry.class,
                players: [sender]
            });
            await MessagingService.send(sender, `Setting up ${gameEntry.name}!\n\nWho are we playing with? Reply with:\n"Add Name Number" (e.g. Add Bob 555-1234)\nOr just "Bob" if you've played before.\n\nReply 'START' when ready.`);
        }
    } else {
        await sendMenu(sender);
    }
    res.type('text/xml').send('<Response></Response>');
});

async function sendMenu(to) {
    const user = await require('./engine/UserManager').getUser(to);
    let menu = `Welcome back to Gameloop, ${user ? user.name : 'Player'}! Reply with a number:\n`;
    Object.keys(GameRegistry).forEach(key => {
        menu += `${key}. ${GameRegistry[key].name}\n`;
    });
    await MessagingService.send(to, menu);
}

app.listen(PORT, () => {
    console.log(`Gameloop running on port ${PORT}`);
});

module.exports = app;
