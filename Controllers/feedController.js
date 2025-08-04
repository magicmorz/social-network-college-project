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
    console.log("Current User ID:", req.user._id); // Log 1
    console.log("followedUserIds:", followedUserIds); // Log 2
    const userGroupsDocs = await Group.find({
      name: { $in: currentUser.groups },
    });
    const userGroupIds = userGroupsDocs.map((group) => group._id);
    console.log("userGroupIds:", userGroupIds); // Log 3

    const posts = await Post.find({
      $or: [
        { user: { $in: followedUserIds } },
        { group: { $in: userGroupIds } },
      ],
    })
      .populate("user", "username avatar isVerified")
      .populate("group", "name")
      .sort({ createdAt: -1 });
    console.log(
      "Fetched posts:",
      posts.map((p) => ({ id: p._id, user: p.user._id, group: p.group }))
    ); // Log 4

    for (let post of posts) {
      if (post.place) {
        try {
          const placeData = await Place.findById(post.place);
          if (placeData) {
            post.place = placeData;
          }
        } catch (error) {
          console.log(
            "Place fetch error for post",
            post._id,
            ":",
            error.message
          ); // Log 5
        }
      }
    }

    res.render("feed_screen/feed", {
      posts,
      user: req.user || null,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    });
  } catch (err) {
    console.log("Error in showFeed:", err.message); // Log 6
    next(err);
  }
};
