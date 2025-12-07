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

    // Check if user is in an active session
    let session = SessionManager.getSession(sender);

    if (session) {
        // In-game logic
        if (message.toLowerCase() === 'quit') {
            SessionManager.endSession(sender);
            await MessagingService.send(sender, "You have left the game.");
        } else {
            session.processInput(sender, message);
        }
    } else {
        // Main Menu / Lobby Logic
        if (GameRegistry[message]) {
            // User selected a game by number
            const gameEntry = GameRegistry[message];
            if (!gameEntry.class) {
                await MessagingService.send(sender, `Sorry, ${gameEntry.name} is coming soon! Pick another.`);
            } else {
                const newSession = SessionManager.createSession(gameEntry.class, sender);
                await MessagingService.send(sender, `Starting ${gameEntry.name}...`);
                // For now, simpler single player start or we need a way to add players. 
                // Let's assume for prototype we just start immediately or ask for invites.
                // Simplification: Auto-start for now to test.
                const response = newSession.startGame();
                await MessagingService.send(sender, response);
            }
        } else {
            // Show Menu
            let menu = "Welcome to Gameloop! Reply with a number to play:\n";
            Object.keys(GameRegistry).forEach(key => {
                menu += `${key}. ${GameRegistry[key].name}\n`;
            });
            await MessagingService.send(sender, menu);
        }
    }

    res.type('text/xml').send('<Response></Response>');
});

app.listen(PORT, () => {
    console.log(`Gameloop running on port ${PORT}`);
});

module.exports = app;
