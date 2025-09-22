const User = require('../models/User');

class AuthController {
    constructor() {
        this.userModel = new User();
    }

    async register(req, res) {
        try {
            // 1. Extract data from request body
            const { email, password, firstName, lastName } = req.body;

            // 2. Validate required fields
            if (!email || !password || !firstName || !lastName) {
                return res.status(400).json({
                    success: false,
                    error: 'All fields are required',
                    message: 'Please provide email, password, firstName, and lastName'
                });
            }

            // 3. Validate email format (basic validation)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format',
                    message: 'Please provide a valid email address'
                });
            }

            // 4. Validate password length
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Password too short',
                    message: 'Password must be at least 6 characters long'
                });
            }

            // 5. Check if user already exists
            const existingUser = await this.userModel.getUserByEmail(email);
            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: 'User already exists',
                    message: 'An account with this email already exists'
                });
            }

            // 6. Create new user
            const newUser = await this.userModel.createUser({
                email,
                password,
                firstName,
                lastName
            });

            // 7. Return success response
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    user: newUser
                }
            });

        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed',
                message: error.message
            });
        }
    }

    async login(req, res) {
        try {
            // 1. Extract credentials from request body
            const { email, password } = req.body;

            // 2. Validate required fields
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: 'Email and password are required',
                    message: 'Please provide both email and password'
                });
            }

            // 3. Validate email format (basic validation)
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format',
                    message: 'Please provide a valid email address'
                });
            }

            // 4. Check if user exists
            const user = await this.userModel.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect'
                });
            }

            // 5. Validate password
            const isValidPassword = await this.userModel.validatePassword(email, password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect'
                });
            }

            // 6. Return success response with user data (without password)
            const { password: _, ...userWithoutPassword } = user;
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    user: userWithoutPassword
                }
            });

        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed',
                message: error.message
            });
        }
    }
}

module.exports = AuthController;