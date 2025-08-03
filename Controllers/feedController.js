const Post = require('../models/Post');
const Place = require('../models/Place');

// GET feed page - shows all posts sorted by newest first
exports.showFeed = async (req, res, next) => {
    try {
        const posts = await Post.find({})
            .populate('user', 'username avatar isVerified')
            .populate('group', 'name')
            .sort({ createdAt: -1 });
        
        // Manually attach place data
        for (let post of posts) {
            if (post.place) {
                try {
                    const placeData = await Place.findById(post.place);
                    if (placeData) {
                        post.place = placeData;
                    }
                } catch (error) {
                    // Silent error handling
                }
            }
        }

        res.render('feed_screen/feed', {
            posts,
            user: req.user || null,
            googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
        });

    } catch (err) {
        next(err);
    }
};
