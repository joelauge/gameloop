class UserManager {
    constructor() {
        this.users = new Map(); // phoneNumber -> { name, friends: [] }
        // Friends = [ { name, phone } ]
    }

    getUser(phoneNumber) {
        return this.users.get(phoneNumber);
    }

    createUser(phoneNumber, name) {
        if (!this.users.has(phoneNumber)) {
            this.users.set(phoneNumber, {
                name: name,
                friends: []
            });
        }
        return this.users.get(phoneNumber);
    }

    addFriend(hostNumber, friendName, friendNumber) {
        const user = this.getUser(hostNumber);
        if (!user) return;

        // Check if already exists
        const exists = user.friends.find(f => f.phone === friendNumber || f.name.toLowerCase() === friendName.toLowerCase());
        if (!exists) {
            user.friends.push({ name: friendName, phone: friendNumber });
        }
    }

    getFriendByName(hostNumber, name) {
        const user = this.getUser(hostNumber);
        if (!user) return null;

        return user.friends.find(f => f.name.toLowerCase() === name.toLowerCase());
    }

    // Helper to format a friend list for display
    getFriendListDisplay(hostNumber) {
        const user = this.getUser(hostNumber);
        if (!user || user.friends.length === 0) return "No saved friends.";
        return user.friends.map(f => `${f.name}`).join(', ');
    }
}

// Singleton for Prototype
module.exports = new UserManager();
