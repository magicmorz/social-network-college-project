const User = require('../models/User');

// Authentication middleware
const isLoggedIn = async (req, res, next) => {
    if (req.session.userId) {
        try {
            // Get full user object from database
            const user = await User.findById(req.session.userId);
            if (user) {
                req.user = user;
                return next();
            }
        } catch (error) {
            console.error('Error fetching user:', error);
        }
    }
    res.redirect('/auth/login');
};

module.exports = isLoggedIn; 