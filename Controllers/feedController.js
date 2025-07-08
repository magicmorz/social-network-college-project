const Post = require('../models/Post');

// GET feed page - shows all posts sorted by newest first
exports.showFeed = async (req, res, next) => {
    try {
        const posts = await Post.find({}).sort({ createdAt: -1 }).lean();
        res.render('feed', { posts });
    } catch (err) {
        next(err);
    }
}; 