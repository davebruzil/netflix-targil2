// Netflix Clone Backend Server
// Main server file handling API routes and static file serving

// Load environment variables
require('dotenv').config();

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

// Increase body parser limit for large video uploads (500MB)
// Also increase parameter limit for large payloads
app.use(bodyParser.json({
    limit: '500mb',
    parameterLimit: 100000
}));
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '500mb',
    parameterLimit: 100000
}));

// Increase timeout for large uploads (10 minutes)
app.use((req, res, next) => {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000); // 10 minutes
    next();
});

// Session middleware with MongoDB store
app.use(session({
    secret: process.env.SESSION_SECRET || 'netflix-clone-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
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

// Serve uploaded files (videos and images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/content', contentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);

// Video streaming route
app.get('/video/:contentId', (req, res) => {
    const { contentId } = req.params;
    
    // For demo purposes, return a sample video stream
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // In a real implementation, you would serve the actual video file
    // For now, we'll return a simple response
    res.json({
        message: 'Video streaming endpoint',
        contentId: contentId,
        note: 'In production, this would serve the actual video file'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Netflix Backend Server is running',
        timestamp: new Date().toISOString()
    });
});

// Serve frontend files for any non-API routes (GET requests only)
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
    }

    // Serve admin.html for admin panel
    if (req.path === '/admin' || req.path === '/admin.html') {
        return res.sendFile(path.join(__dirname, '..', 'frontend', 'admin.html'), (err) => {
            if (err) {
                console.error('Error serving admin.html:', err);
                res.status(404).send('File not found');
            }
        });
    }

    // Serve player.html for video player
    if (req.path === '/player' || req.path === '/player.html') {
        return res.sendFile(path.join(__dirname, '..', 'frontend', 'player.html'), (err) => {
            if (err) {
                console.error('Error serving player.html:', err);
                res.status(404).send('File not found');
            }
        });
    }

    // Serve content-manager.html for content management
    if (req.path === '/content-manager' || req.path === '/content-manager.html') {
        return res.sendFile(path.join(__dirname, '..', 'frontend', 'content-manager.html'), (err) => {
            if (err) {
                console.error('Error serving content-manager.html:', err);
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

// Catch-all for non-GET API requests (POST, PUT, DELETE, etc.)
// This ensures proper JSON 404 responses for all API methods
app.all('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        method: req.method,
        path: req.path
    });
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