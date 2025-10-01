// Netflix Clone Backend Server
// Main server file handling API routes and static file serving

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');

// Import MongoDB connection
const connectDB = require('./config/database');

// Import MVC routes
const contentRoutes = require('./routes/ContentRoutes');
const authRoutes = require('./routes/AuthRoutes');
const profileRoutes = require('./routes/ProfileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: ['http://localhost:5000', 'http://localhost:3000', 'http://localhost:8080', 'http://localhost:8888'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware with MongoDB store
app.use(session({
    secret: 'netflix-clone-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: 'mongodb+srv://davidbruzil_db_user:HsDK9gcjmf5jdBSj@cluster0.uvfwkum.mongodb.net/netflix?retryWrites=true&w=majority&appName=Cluster0',
        touchAfter: 24 * 3600 // Lazy session update (24 hours)
    }),
    cookie: {
        secure: false,  // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000  // 24 hours
    }
}));

// Request logging middleware
const requestLogger = require('./middleware/logger');
app.use(requestLogger);

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/content', contentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Netflix Backend Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend files for any non-API routes
app.get('*', (req, res) => {
    // Don't serve for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Handle favicon.ico requests
    if (req.path === '/favicon.ico') {
        return res.status(204).end(); // No content
    }

    // Serve main.html for the main app
    if (req.path === '/' || req.path === '/main' || req.path === '/main.html') {
        return res.sendFile(path.join(__dirname, '..', 'frontend', 'main.html'), (err) => {
            if (err) {
                console.error('Error serving main.html:', err);
                res.status(404).send('File not found');
            }
        });
    } else {
        // Try to serve the requested file with error handling
        const filePath = path.join(__dirname, '..', 'frontend', req.path);
        res.sendFile(filePath, (err) => {
            if (err) {
                console.warn(`File not found: ${req.path}`);
                res.status(404).send('File not found');
            }
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Netflix Backend Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:${PORT}`);
    console.log(`🔌 API: http://localhost:${PORT}/api`);
    console.log(`❤️  Health Check: http://localhost:${PORT}/api/health`);
});