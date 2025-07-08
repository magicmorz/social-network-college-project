const User = require('../models/User');

// Search users by username or email
exports.searchUsers = async (req, res, next) => {
    try {
        const term = (req.query.q || '').trim();
        
        if (!term) {
            return res.render('search', { users: [], term });
        }
        
        const regex = new RegExp(term, 'i');
        
        const users = await User.find({
            $or: [
                { username: { $regex: regex } },
                { email: { $regex: regex } }
            ]
        })
        .limit(50)
        .select('username email')
        .lean();
        
        res.render('search', { users, term });
    } catch (err) {
        next(err);
    }
}; 