const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

/**
 * Authentication middleware
 * Supports both JWT and Firebase tokens
 */
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        let user = null;

        // Try Firebase token first
        try {
            const decodedToken = await admin.auth().verifyIdToken(token);
            user = await User.findOne({ firebaseUid: decodedToken.uid });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found in database'
                });
            }
        } catch (firebaseError) {
            // If Firebase token verification fails, try JWT
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = await User.findById(decoded.userId);

                if (!user) {
                    return res.status(401).json({
                        success: false,
                        message: 'User not found'
                    });
                }
            } catch (jwtError) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
        }

        // Check if user is active
        if (!user.isActive || user.deletedAt) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication server error'
        });
    }
};

/**
 * Role-based authorization middleware
 */
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Convert single role to array
        if (typeof roles === 'string') {
            roles = [roles];
        }

        // Allow access if no specific roles required
        if (roles.length === 0) {
            return next();
        }

        // Check if user has required role
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Permission-based authorization middleware
 */
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Admin has all permissions
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if user has the required permission
        if (!req.user.hasPermission(permission)) {
            return res.status(403).json({
                success: false,
                message: 'Permission denied'
            });
        }

        next();
    };
};

/**
 * Branch access control middleware
 */
const checkBranchAccess = (req, res, next) => {
    const branchId = req.params.branchId || req.body.branchId || req.query.branchId;

    // Admin has access to all branches
    if (req.user.role === 'admin') {
        return next();
    }

    // Check if user belongs to the requested branch
    if (req.user.branchId.toString() !== branchId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied to this branch'
        });
    }

    next();
};

/**
 * Rate limiting middleware for sensitive operations
 */
const strictRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many attempts, please try again later.'
    }
});

module.exports = {
    authMiddleware,
    authorize,
    checkPermission,
    checkBranchAccess,
    strictRateLimit
};