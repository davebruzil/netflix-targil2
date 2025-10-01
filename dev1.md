🔨 Your Priority Tasks:
1. Password Encryption with bcrypt (CRITICAL - DO THIS FIRST)

 Install bcrypt: npm install bcrypt
 Update User.js → createUser() to hash passwords before saving
 Update User.js → validatePassword() to use bcrypt.compare()
 Test registration and login with encrypted passwords
Implementation:

// In backend/models/User.js
const bcrypt = require('bcrypt');

async createUser(userData) {
    // Hash password with salt rounds = 10
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const newUser = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        password: hashedPassword,  // Store hashed password
        firstName: userData.firstName,
        lastName: userData.lastName,
        createdAt: new Date().toISOString()
    };

    usersData.users.push(newUser);
    await this.saveUsers(usersData);

    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
}

async validatePassword(email, password) {
    const user = await this.getUserByEmail(email);
    if (!user) return false;

    // Compare plain text password with hashed password
    return await bcrypt.compare(password, user.password);
}
2. Enhanced Password Validation

 Add strong password validation in AuthController.js
Minimum 8 characters
At least 1 uppercase letter
At least 1 lowercase letter
At least 1 number
At least 1 special character
 Return helpful error messages for weak passwords
Password validation regex:

// In backend/controllers/AuthController.js
async register(req, res) {
    const { password } = req.body;

    // Strong password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            error: 'Weak password',
            message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
        });
    }

    // ... rest of registration
}
3. Session Management with express-session

 Install express-session: npm install express-session
 Configure session middleware in server.js
 Save user session on successful login
 Create secure session cookies
 Implement session timeout (24 hours)
Session setup:

// In backend/server.js
const session = require('express-session');

app.use(session({
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,  // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
}));
Update AuthController login:

async login(req, res) {
    // ... validate credentials ...

    // Create session
    req.session.userId = user.id;
    req.session.email = user.email;

    res.json({
        success: true,
        message: 'Login successful',
        data: { user: userWithoutPassword }
    });
}
4. Logging System

 Create backend/middleware/logger.js for automatic request logging
 Log all API requests (method, endpoint, timestamp, user, IP)
 Log authentication events in content.json → activityLog
 Log login attempts (success and failure)
 Log registration events
 Apply logging middleware to all routes
Logger middleware:

// backend/middleware/logger.js
const fs = require('fs').promises;
const path = require('path');

async function requestLogger(req, res, next) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        endpoint: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.session?.userId || 'anonymous'
    };

    console.log('📝 API Request:', logEntry);

    // Save to content.json activityLog
    try {
        const contentPath = path.join(__dirname, '..', 'data', 'content.json');
        const data = JSON.parse(await fs.readFile(contentPath, 'utf8'));

        if (!data.apiLogs) data.apiLogs = [];
        data.apiLogs.push(logEntry);

        // Keep only last 1000 logs
        if (data.apiLogs.length > 1000) {
            data.apiLogs = data.apiLogs.slice(-1000);
        }

        await fs.writeFile(contentPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Logging error:', error);
    }

    next();
}

module.exports = requestLogger;
Apply in server.js:

const requestLogger = require('./middleware/logger');
app.use(requestLogger);
5. Protected Routes Middleware

 Create backend/middleware/auth.js authentication middleware
 Check if user session exists
 Return 401 if not authenticated
 Apply to protected routes (profiles, content)
Auth middleware:

// backend/middleware/auth.js
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }
    next();
}

module.exports = requireAuth;
Apply to routes:

// backend/routes/ProfileRoutes.js
const requireAuth = require('../middleware/auth');

router.get('/', requireAuth, (req, res) => profileController.getAllProfiles(req, res));
router.post('/', requireAuth, (req, res) => profileController.createProfile(req, res));
6. Enhanced Logout

 Clear session on server side
 Return confirmation message
 Frontend should clear localStorage
Logout implementation:

// In backend/controllers/AuthController.js
async logout(req, res) {
    try {
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Logout failed'
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
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
}
7. Rate Limiting for Login Attempts

 Install express-rate-limit: npm install express-rate-limit
 Limit login attempts to 5 per 15 minutes
 Return helpful error message when rate limited
Rate limiting:

// In backend/routes/AuthRoutes.js
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // 5 attempts
    message: {
        success: false,
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes'
    }
});

router.post('/login', loginLimiter, (req, res) => authController.login(req, res));
Files to create/modify:

backend/models/User.js (add bcrypt)
backend/controllers/AuthController.js (password validation, session)
backend/middleware/logger.js (create new)
backend/middleware/auth.js (create new)
backend/server.js (add express-session)
backend/routes/AuthRoutes.js (add rate limiting)
backend/routes/ProfileRoutes.js (add auth middleware)
backend/routes/ContentRoutes.js (add auth middleware)