const User = require('../models/User');
const Post = require('../models/Post');

// Advanced user search endpoint
exports.searchUsers = async (req, res, next) => {
    try {
        const { 
            username = '', 
            joinedAfter, 
            isVerified, 
            group, 
            page = 1, 
            limit = 20 
        } = req.query;

        // Build MongoDB filter
        let filter = {};
        
        // Username search (case-insensitive partial match)
        if (username.trim()) {
            filter.username = { $regex: username.trim(), $options: 'i' };
        }

        // Joined after filter
        if (joinedAfter) {
            filter.createdAt = { $gte: new Date(joinedAfter) };
        }

        // Verified status filter
        if (isVerified !== undefined) {
            filter.isVerified = isVerified === 'true';
        }

        // Group filter (exact match)
        if (group && group.trim()) {
            filter.groups = group.trim();
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Execute search
        const users = await User.find(filter)
            .select('username email createdAt isVerified groups profilePicture avatar')
            .sort({ username: 1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const totalUsers = await User.countDocuments(filter);

        res.json({
            users,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalUsers,
                pages: Math.ceil(totalUsers / limitNum)
            }
        });

    } catch (err) {
        console.error('Error in user search:', err);
        next(err);
    }
};

// Advanced post search endpoint
exports.searchPosts = async (req, res, next) => {
    try {
        const { 
            caption = '', 
            type, 
            dateFrom, 
            dateTo, 
            tags, 
            page = 1, 
            limit = 20 
        } = req.query;

        // Build MongoDB filter
        let filter = {};
        
        // Caption search (case-insensitive partial match)
        if (caption.trim()) {
            filter.caption = { $regex: caption.trim(), $options: 'i' };
        }

        // Type filter
        if (type && ['text', 'image', 'video'].includes(type)) {
            filter.type = type;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            filter.createdAt = {};
            if (dateFrom) {
                filter.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                filter.createdAt.$lte = new Date(dateTo);
            }
        }

        // Tags filter (match all provided tags)
        if (tags) {
            const tagArray = Array.isArray(tags) ? tags : [tags];
            const cleanTags = tagArray.map(tag => tag.toLowerCase().replace('#', ''));
            if (cleanTags.length > 0) {
                filter.hashtags = { $all: cleanTags };
            }
        }

        // Pagination
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        // Execute search
        const posts = await Post.find(filter)
            .populate('user', 'username isVerified')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean();

        // Get total count for pagination
        const totalPosts = await Post.countDocuments(filter);

        res.json({
            posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: totalPosts,
                pages: Math.ceil(totalPosts / limitNum)
            }
        });

    } catch (err) {
        console.error('Error in post search:', err);
        next(err);
    }
}; 