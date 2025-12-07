const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const MessagingService = {
    send: async (to, body) => {
        try {
            if (process.env.NODE_ENV === 'test' || process.env.MOCK_SMS) {
                console.log(`[MOCK SMS] To: ${to}, Body: ${body}`);
                return { sid: 'mock-sid' };
            }
            const message = await client.messages.create({
                body: body,
                from: fromNumber,
                to: to
            });
            return message;
        } catch (error) {
            console.error('Error sending SMS:', error);
            return null;
        }
    },

    broadcast: async (players, body) => {
        const promises = players.map(player => MessagingService.send(player, body));
        return Promise.all(promises);
    }
};

module.exports = MessagingService;
