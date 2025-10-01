// Logging Middleware
// Purpose: Log all API requests to console and MongoDB
// Dev: David (Dev #1)

const mongoose = require('mongoose');

// Simple API Log Schema for MongoDB
const apiLogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    method: String,
    endpoint: String,
    ip: String,
    userId: String,
    statusCode: Number,
    responseTime: Number
});

const APILog = mongoose.model('APILog', apiLogSchema);

/**
 * Middleware to log all API requests
 * Logs: timestamp, method, endpoint, IP, userId, statusCode, responseTime
 * Saves to MongoDB APILog collection (auto-capped at 1000 entries)
 */
async function requestLogger(req, res, next) {
    const startTime = Date.now();

    // Create log entry object
    const logEntry = {
        timestamp: new Date().toISOString(),
        method: req.method,
        endpoint: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userId: req.session?.userId || 'anonymous'
    };

    // Console log the entry
    console.log(`📝 API Request: ${logEntry.method} ${logEntry.endpoint} | User: ${logEntry.userId} | IP: ${logEntry.ip}`);

    // Intercept response to log status code and response time
    const originalSend = res.send;
    res.send = function(data) {
        res.send = originalSend; // Restore original send
        const responseTime = Date.now() - startTime;

        // Save to MongoDB asynchronously (don't block response)
        saveLogToMongoDB({
            ...logEntry,
            statusCode: res.statusCode,
            responseTime
        });

        return res.send(data);
    };

    next();
}

/**
 * Save log entry to MongoDB
 * Auto-maintains max 1000 logs
 */
async function saveLogToMongoDB(logEntry) {
    try {
        // Create new log
        await APILog.create(logEntry);

        // Keep only last 1000 logs
        const count = await APILog.countDocuments();
        if (count > 1000) {
            const logsToDelete = await APILog.find()
                .sort({ timestamp: 1 })
                .limit(count - 1000)
                .select('_id');

            const idsToDelete = logsToDelete.map(log => log._id);
            await APILog.deleteMany({ _id: { $in: idsToDelete } });
        }
    } catch (error) {
        console.error('❌ Logging error:', error.message);
        // Don't throw error - logging should not break the app
    }
}

module.exports = requestLogger;
