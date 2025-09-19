// Netflix Clone Backend Server
// Main server file handling API routes and static file serving

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const contentRoutes = require('./routes/content');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:8888'],
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from frontend directory
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/content', contentRoutes);

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