// Logging Middleware
// Purpose: Log all API requests to console and content.json
// Dev: David (Dev #1)

const fs = require('fs').promises;
const path = require('path');

/**
 * Middleware to log all API requests
 * Logs: timestamp, method, endpoint, IP, userId
 * Saves to content.json -> apiLogs array (keep last 1000 logs)
 */
async function requestLogger(req, res, next) {
    // TODO: Create log entry object with timestamp, method, endpoint, IP, userId

    // TODO: Console log the entry

    // TODO: Read content.json file

    // TODO: Add log to apiLogs array

    // TODO: Keep only last 1000 logs

    // TODO: Write back to content.json

    // TODO: Handle errors gracefully

    next();
}

module.exports = requestLogger;
