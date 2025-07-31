const User = require('../models/User');

// Authentication middleware with session caching
const isLoggedIn = async (req, res, next) => {
    if (req.session.userId) {
        try {
            // Check if user is already cached in session to reduce DB calls
            if (req.session.userCache && req.session.userCache.id === req.session.userId) {
                req.user = req.session.userCache;
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
                return next();
            }
        } catch (error) {
            console.error('❌ Auth error:', error.message);
        }
    }
    res.redirect('/auth/login');
};

module.exports = isLoggedIn; 