const Post = require("../models/Post");
const Place = require("../models/Place");
const User = require("../models/User");
const Group = require("../models/Group");

exports.showFeed = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id).lean();
    if (!currentUser) {
      return res.status(404).send("User not found");
    }

    const followedUserIds = currentUser.following.map((entry) => entry.user);

    // Fetch group IDs if groups are stored by name
    const userGroupsDocs = await Group.find({
      name: { $in: currentUser.groups },
    });
    const userGroupIds = userGroupsDocs.map((group) => group._id);

    const posts = await Post.find({
      $or: [
        { user: { $in: followedUserIds } },
        { group: { $in: userGroupIds } },
      ],
    })
      .populate("user", "username avatar isVerified")
      .populate("group", "name")
      .sort({ createdAt: -1 });

    for (let post of posts) {
      if (post.place) {
        try {
          const placeData = await Place.findById(post.place);
          if (placeData) {
            post.place = placeData;
          }
        } catch (error) {
          // Silent fail
        }
      }
    }

    res.render("feed_screen/feed", {
      posts,
      user: req.user || null,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    });
  } catch (err) {
    next(err);
  }
};
