class InputParser {
    /**
     * Extracts name and phone number pairs from a string.
     * Supports:
     * "Add Bob 905-555-1234"
     * "Invite Alice 5555555555 and John 1234567890"
     * "Bob" (if looking up from contacts)
     */
    static parseInvites(text) {
        // Normalize
        const cleanText = text.replace(/and/gi, ',').replace(/add/gi, '').replace(/invite/gi, '');
        const parts = cleanText.split(/[,;]/).map(p => p.trim()).filter(p => p);

        const results = {
            newFriends: [], // { name, phone }
            existingNames: [] // [name1, name2]
        };

        const phoneRegex = /(?:\+?1[-. ]?)?\(?([2-9][0-8][0-9])\)?[-. ]?([2-9][0-9]{2})[-. ]?([0-9]{4})/g;

        parts.forEach(part => {
            // Check for phone number
            const phoneMatch = part.match(phoneRegex); // Just find the number in this chunk

            if (phoneMatch) {
                // It's a new friend with a number
                const phoneNumberStr = phoneMatch[0];
                // Extract Name: Everything before the number?
                let name = part.replace(phoneNumberStr, '').trim();
                name = name.replace(/[^a-zA-Z0-9 ]/g, ''); // Clean special chars

                // Normalize Phone to E.164-ish (+1...)
                let cleanPhone = phoneNumberStr.replace(/[^0-9]/g, '');
                if (cleanPhone.length === 10) cleanPhone = '1' + cleanPhone;
                cleanPhone = '+' + cleanPhone;

                if (name) {
                    results.newFriends.push({ name, phone: cleanPhone });
                }
            } else {
                // It's just a name, probably a contact lookup
                const name = part.replace(/[^a-zA-Z0-9 ]/g, '').trim();
                if (name) {
                    results.existingNames.push(name);
                }
            }
        });

        return results;
    }
}

module.exports = InputParser;
