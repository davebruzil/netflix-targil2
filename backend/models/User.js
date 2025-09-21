const fs = require('fs').promises;
const path = require('path');

class User {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'data', 'users.json');
    }

    async getAllUsers() {
        // TODO: Read users.json file, return parsed JSON
        // Implementation needed by Developer 1
    }

    async saveUsers(users) {
        // TODO: Save users array to users.json file
        // Implementation needed by Developer 1
    }

    async createUser(userData) {
        // TODO: Add new user to users array, save file
        // userData: {email, password, firstName, lastName}
        // Implementation needed by Developer 1
    }

    async getUserByEmail(email) {
        // TODO: Find user by email, return user or null
        // Implementation needed by Developer 1
    }

    async validatePassword(email, password) {
        // TODO: Check if email and password match, return true/false
        // Implementation needed by Developer 1
    }
}

module.exports = User;