// Authentication Middleware
// Purpose: Protect routes that require authentication
// Dev: David (Dev #1)

/**
 * Middleware to check if user is authenticated
 * Checks req.session for userId
 * Returns 401 if not authenticated
 * Calls next() if authenticated
 */
function requireAuth(req, res, next) {
    // Check if session exists and has userId
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }

    // User is authenticated, proceed to next middleware/route handler
    next();
}

/**
 * Middleware to check if user is admin (optional enhancement)
 * Checks req.session for admin role
 */
function requireAdmin(req, res, next) {
    // First check if authenticated
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            message: 'Please log in to access this resource'
        });
    }

    // Check if user has admin role
    if (!req.session.isAdmin) {
        return res.status(403).json({
            success: false,
            error: 'Forbidden',
            message: 'You do not have permission to access this resource'
        });
    }

    // User is admin, proceed
    next();
}

module.exports = {
    requireAuth,
    requireAdmin
};
