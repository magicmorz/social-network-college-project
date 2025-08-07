const User = require('../models/User');

// Authentication middleware with session caching
const isLoggedIn = async (req, res, next) => {
    console.log('Auth middleware - checking authentication:', {
        path: req.path,
        sessionId: req.sessionID,
        userId: req.session?.userId,
        hasSession: !!req.session,
        cookies: req.headers.cookie
    });
    
    if (req.session.userId) {
        try {
            // Check if user is already cached in session to reduce DB calls
            if (req.session.userCache && req.session.userCache.id === req.session.userId) {
                // Create a user object with _id for cached users
                req.user = {
                    _id: req.session.userCache.id,
                    username: req.session.userCache.username,
                    email: req.session.userCache.email,
                    avatar: req.session.userCache.avatar,
                    isVerified: req.session.userCache.isVerified
                };
                console.log('Auth middleware - user from cache:', req.user._id);
                return next();
            }
            
            // Get full user object from database
            const user = await User.findById(req.session.userId);
            if (user) {
                // Cache user in session to reduce future DB calls
                req.session.userCache = {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    isVerified: user.isVerified
                };
                req.user = user;
                console.log('Auth middleware - user from DB:', req.user._id);
                return next();
            }
        } catch (error) {
            console.error('❌ Auth error:', error.message);
        }
    }
    console.log('Auth middleware - redirecting to login, no session.userId');
    res.redirect('/auth/login');
};

module.exports = isLoggedIn; 