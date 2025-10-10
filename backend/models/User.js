// User Model - MongoDB Implementation with Mongoose
const UserSchema = require('../schemas/UserSchema');

class User {
    constructor() {
        this.model = UserSchema;
    }

    async getAllUsers() {
        try {
            const users = await this.model.find().select('-password');
            return { users };
        } catch (error) {
            console.error('Error reading users data:', error);
            return { users: [] };
        }
    }

    async createUser(userData) {
        try {
            // Check if user already exists
            const existingUser = await this.model.findOne({ email: userData.email });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Create new user (password hashing handled by schema pre-save hook)
            const newUser = new this.model({
                email: userData.email,
                password: userData.password,
                firstName: userData.firstName,
                lastName: userData.lastName
            });

            await newUser.save();

            // Return user without password (handled by schema toJSON method)
            return newUser.toJSON();
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    async getUserByEmail(email) {
        try {
            const user = await this.model.findOne({ email });
            return user || null;
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    async getUserById(userId) {
        try {
            const user = await this.model.findById(userId).select('-password');
            return user || null;
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

    async validatePassword(email, password) {
        try {
            const user = await this.getUserByEmail(email);
            if (!user) {
                return false;
            }
            // Use schema method to compare password
            return await user.comparePassword(password);
        } catch (error) {
            console.error('Error validating password:', error);
            return false;
        }
    }
}

module.exports = User;