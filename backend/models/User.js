const fs = require('fs').promises;
const path = require('path');

class User {
    constructor() {
        this.dataFile = path.join(__dirname, '..', 'data', 'users.json');
    }

    async getAllUsers() {
        try {
            const data = await fs.readFile(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading users data:', error);
            // Return empty structure if file doesn't exist or is corrupted
            return { users: [] };
        }
    }

    async saveUsers(users) {
        try {
            await fs.writeFile(this.dataFile, JSON.stringify(users, null, 2));
            return true;
        } catch (error) {
            console.error('Error saving users data:', error);
            throw new Error('Failed to save users data');
        }
    }

    async createUser(userData) {
        try {
            // 1. Get existing users
            const usersData = await this.getAllUsers();
            
            // 2. Check if user already exists
            const existingUser = usersData.users.find(user => user.email === userData.email);
            if (existingUser) {
                throw new Error('User with this email already exists');
            }
            
            // 3. Create new user object
            const newUser = {
                id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                email: userData.email,
                password: userData.password, // In production, hash this password
                firstName: userData.firstName,
                lastName: userData.lastName,
                createdAt: new Date().toISOString()
            };
            
            // 4. Add to users array
            usersData.users.push(newUser);
            
            // 5. Save to file
            await this.saveUsers(usersData);
            
            // 6. Return user without password for security
            const { password, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const usersData = await this.getAllUsers();
            const user = usersData.users.find(user => user.email === email);
            return user || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    async validatePassword(email, password) {
        try {
            const user = await this.getUserByEmail(email);
            if (!user) {
                return false;
            }
            return user.password === password;
        } catch (error) {
            console.error('Error validating password:', error);
            return false;
        }
    }
}

module.exports = User;