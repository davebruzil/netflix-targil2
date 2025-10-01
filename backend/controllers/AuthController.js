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

            // 3. Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid email format',
                    message: 'Please provide a valid email address'
                });
            }

            // 4. Strong password validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    error: 'Weak password',
                    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)'
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

            // 6. Create new user (password hashing handled by schema pre-save hook)
            const newUser = await this.userModel.createUser({
                email,
                password,
                firstName,
                lastName
            });

            // 7. Create session for new user
            req.session.userId = newUser._id;
            req.session.email = newUser.email;

            // 8. Return success response
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

            // 3. Validate email format
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

            // 5. Validate password (uses bcrypt comparison)
            const isValidPassword = await this.userModel.validatePassword(email, password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: 'Invalid credentials',
                    message: 'Email or password is incorrect'
                });
            }

            // 6. Create session
            req.session.userId = user._id;
            req.session.email = user.email;

            // 7. Return success response with user data (without password)
            const { password: _, ...userWithoutPassword } = user.toObject();
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

    async logout(req, res) {
        try {
            if (req.session) {
                req.session.destroy((err) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            error: 'Logout failed',
                            message: 'Failed to destroy session'
                        });
                    }

                    res.clearCookie('connect.sid');  // Clear session cookie
                    res.json({
                        success: true,
                        message: 'Logged out successfully'
                    });
                });
            } else {
                res.json({
                    success: true,
                    message: 'No active session'
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout failed',
                message: error.message
            });
        }
    }
}

module.exports = AuthController;