/**
 * =================================================================
 * AUTHENTICATION MIDDLEWARE
 * =================================================================
 *
 * This middleware provides authentication and authorization functions:
 * - isLoggedIn: Verifies JWT token and loads user data
 * - checkRole: Validates user roles for protected routes
 *
 * =================================================================
 */

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = {};

authMiddleware.isLoggedIn = async function (req, res, next) {
    try {
        // Get token from header, removing 'Bearer ' prefix
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'No token, authorization denied.' });
        }
        
        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Extract user ID from token payload (handle both 'id' and 'userId' for compatibility)
        const userId = decoded.id || decoded.userId;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Invalid token payload.' });
        }
        
        // Load user data
        req.user = await prisma.user.findUnique({ where: { id: userId } });
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'User not found, authorization denied.' });
        }
        
        // Check if user account is active
        if (req.user.status !== 'active') {
            return res.status(403).json({ success: false, error: 'User account is not active.' });
        }
        
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(401).json({ success: false, error: 'Token is not valid.' });
    }
};


authMiddleware.checkRole = function (allowedRoles) {
    // The returned function is the actual middleware
    return async (req, res, next) => {
        try {
            // First, run the isLoggedIn logic to make sure we have a valid user
            await authMiddleware.isLoggedIn(req, res, () => {
                // If isLoggedIn was successful, req.user will exist.
                // Now, check if the user's role is in the list of allowed roles.
                if (req.user && allowedRoles.includes(req.user.user_role)) {
                    next(); // Role is allowed, proceed to the route handler
                } else {
                    return res.status(403).json({ 
                        success: false, 
                        error: 'Forbidden: You do not have the required permissions.' 
                    });
                }
            });
        } catch (error) {
            console.error('Role check error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error.' });
        }
    };
};


module.exports = authMiddleware;
