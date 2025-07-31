const Post = require('../models/Post');

// GET feed page - shows all posts sorted by newest first
exports.showFeed = async (req, res, next) => {
    try {
        const posts = await Post.find({}).sort({ createdAt: -1 }).lean();

        res.render('feed_screen/feed', {
            posts,
            user: req.user || null, // if using authentication
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        });

    } catch (err) {
        next(err);
    }
};
