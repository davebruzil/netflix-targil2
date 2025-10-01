const express = require('express');
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/AuthController');

const router = express.Router();
const authController = new AuthController();

// Rate limiter for login attempts (5 attempts per 15 minutes)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 5,  // 5 attempts
    message: {
        success: false,
        error: 'Too many login attempts',
        message: 'Please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// POST /api/auth/register
router.post('/register', (req, res) => authController.register(req, res));

// POST /api/auth/login (with rate limiting)
router.post('/login', loginLimiter, (req, res) => authController.login(req, res));

// POST /api/auth/logout
router.post('/logout', (req, res) => authController.logout(req, res));

module.exports = router;
