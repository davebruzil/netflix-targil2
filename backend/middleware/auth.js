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
    // TODO: Check if req.session exists and has userId

    // TODO: If not authenticated, return 401 error

    // TODO: If authenticated, call next()
}

/**
 * Middleware to check if user is admin (optional enhancement)
 * Checks req.session for admin role
 */
function requireAdmin(req, res, next) {
    // TODO: Check if user is admin

    // TODO: Return 403 if not admin

    // TODO: Call next() if admin
}

module.exports = {
    requireAuth,
    requireAdmin
};
