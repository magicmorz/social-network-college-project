const Post = require("../models/Post");
const User = require("../models/User");
const Group = require("../models/Group");
const Place = require("../models/Place");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch"); // for GIPHY API calls

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userId = req.user._id.toString();
    const uploadDir = path.join(
      __dirname,
      "..",
      "uploads",
      `user_${userId}`,
      "posts"
    );
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|webm|mov/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only images (jpeg, jpg, png, gif) and videos (mp4, webm, mov) are allowed"
      ),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: fileFilter,
});

exports.uploadMedia = upload.single("media");

// Create new post
exports.createPost = async (req, res) => {
  try {
    const { caption, group, placeId, placeName, placeLat, placeLng, type } =
      req.body;

    console.log("Received body:", req.body); // Debug log
    console.log("Received file:", req.file); // Debug log

    if (!req.file) {
      return res.status(400).json({ error: "Media is required" });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Validate file type and set type if not provided
    const validTypes = ["image", "video"];
    let mediaType = type;
    if (!mediaType) {
      // Fallback: Determine type from MIME type
      mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    }
    if (!validTypes.includes(mediaType)) {
      return res
        .status(400)
        .json({ error: `Invalid media type: ${mediaType}` });
    }

    // If posting to a group, verify user is a member
    if (group) {
      const groupDoc = await Group.findById(group);
      if (!groupDoc) {
        return res.status(404).json({ error: "Group not found" });
      }
      if (!groupDoc.members.includes(req.user._id)) {
        return res
          .status(403)
          .json({ error: "Not authorized to post to this group" });
      }
    }

    // Handle place creation/finding
    let placeRef = null;
    if (placeId && placeName && placeLat && placeLng) {
      try {
        const lat = parseFloat(placeLat);
        const lng = parseFloat(placeLng);
        if (isNaN(lat) || isNaN(lng)) {
          throw new Error("Invalid coordinates");
        }
        const placeData = {
          placeId: placeId.trim(),
          name: placeName.trim(),
          formattedAddress: placeName.trim(),
          lat: lat,
          lng: lng,
        };
        const place = await Place.findOrCreate(placeData);
        placeRef = place._id;
        await place.incrementPostsCount();
      } catch (placeError) {
        console.error("Place error:", placeError);
        placeRef = null;
      }
    }

    const hashtags = caption ? caption.match(/#\w+/g) || [] : [];

    const newPost = new Post({
      user: req.user._id,
      caption: caption || "",
      media: `uploads/user_${req.user._id}/posts/${req.file.filename}`,
      type: mediaType,
      place: placeRef,
      group: group || null,
      hashtags: hashtags.map((tag) => tag.toLowerCase()),
    });

    const savedPost = await newPost.save();

    await savedPost.populate("group", "name");
    if (savedPost.place) {
      await savedPost.populate(
        "place",
        "name formattedAddress placeId coordinates"
      );
    }

    if (savedPost.group) {
      res.json({
        success: true,
        post: savedPost,
        redirectTo: `/group/${savedPost.group._id}`,
      });
    } else {
      res.json({
        success: true,
        post: savedPost,
        redirectTo: "/home",
      });
    }
  } catch (error) {
    console.error("Error creating post:", error.message);
    console.error("Full error:", error);

    // Clean up uploaded file if save fails
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete file:", err);
      });
    }

    res.status(500).json({
      error: "Failed to create post",
      details: error.message,
    });
  }
};

// Get all posts for feed (updated to include group posts)
exports.getFeed = async (req, res) => {
  try {
    // Get user's groups to show group posts they have access to
    const userGroups = await Group.find({ members: req.user._id });
    const groupIds = userGroups.map((g) => g._id);

    const posts = await Post.find({
      $or: [
        { group: null }, // Public posts
        { group: { $in: groupIds } }, // Group posts user has access to
      ],
    })
      .populate("user", "username avatar isVerified")
      .populate("place", "name formattedAddress placeId coordinates")
      .populate("group", "name") // Add group info
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    res.render("feed", { posts, user: req.user });
  } catch (error) {
    console.error("Error fetching feed:", error);
    res.status(500).render("error", { message: "Failed to load feed" });
  }
};

// Get posts as JSON for AJAX requests (updated to include group posts)
exports.getPostsJson = async (req, res) => {
  try {
    // Get user's groups to show group posts they have access to
    const userGroups = await Group.find({ members: req.user._id });
    const groupIds = userGroups.map((g) => g._id);

    const posts = await Post.find({
      $or: [
        { group: null }, // Public posts
        { group: { $in: groupIds } }, // Group posts user has access to
      ],
    })
      .populate("user", "username avatar isVerified")
      .populate("place", "name formattedAddress placeId coordinates")
      .populate("group", "name")
      .populate("comments.user", "username avatar")
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// Get comments for a specific post
exports.getPostComments = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId)
      .populate("comments.user", "username avatar")
      .select("comments");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = post.comments.map((comment) => ({
      _id: comment._id,
      text: comment.text,
      gifUrl: comment.gifUrl,
      createdAt: comment.createdAt,
      user: {
        _id: comment.user._id,
        username: comment.user.username,
        avatar: comment.user.avatar,
      },
    }));

    res.json({
      success: true,
      comments: comments.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      ),
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

// Like/Unlike post
exports.toggleLike = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if post is in a group and user has access
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group || !group.members.includes(userId)) {
        return res
          .status(403)
          .json({ error: "Not authorized to interact with this post" });
      }
    }

    const likeIndex = post.likes.indexOf(userId);
    let liked = false;

    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1);
    } else {
      // Like
      post.likes.push(userId);
      liked = true;
    }

    await post.save();

    res.json({
      success: true,
      liked: liked,
      likesCount: post.likes.length,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Failed to toggle like" });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const postId = req.params.id;
    const { text, gifUrl } = req.body;

    if (!text && !gifUrl) {
      return res.status(400).json({ error: "Comment text or GIF is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group || !group.members.includes(req.user._id)) {
        return res
          .status(403)
          .json({ error: "Not authorized to comment on this post" });
      }
    }

    const comment = {
      user: req.user._id,
      text: text ? text.trim() : "",
      gifUrl: gifUrl || "",
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    await post.populate("comments.user", "username avatar");

    const newComment = post.comments[post.comments.length - 1];

    res.json({
      success: true,
      comment: newComment,
      commentsCount: post.comments.length,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

// Delete post
exports.deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user owns the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this post" });
    }

    // Log post.media to understand what it contains
    console.log("Post media:", post.media);

    // Construct full path based on media
    let mediaPath;

    if (path.isAbsolute(post.media)) {
      mediaPath = post.media; // already absolute
    } else if (post.media.includes(req.user._id.toString())) {
      // If post.media already includes user directory
      mediaPath = path.join(__dirname, "..", post.media);
    } else {
      // Otherwise, assume media is just filename
      mediaPath = path.join(
        __dirname,
        "../uploads",
        req.user._id.toString(),
        path.basename(post.media)
      );
    }

    console.log("Resolved media path:", mediaPath);

    // Delete media file
    if (fs.existsSync(mediaPath)) {
      fs.unlinkSync(mediaPath);
      console.log("Media deleted successfully");
    } else {
      console.warn("Media file not found at path:", mediaPath);
    }

    // Delete post from DB
    await Post.findByIdAndDelete(postId);

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};

// Get single post
exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "username avatar isVerified")
      .populate("place", "name formattedAddress placeId coordinates")
      .populate("group", "name")
      .populate("comments.user", "username avatar");

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if post is in a group and user has access
    if (post.group) {
      const group = await Group.findById(post.group);
      if (!group || !group.members.includes(req.user._id)) {
        return res.status(403).json({ error: "Not authorized to view this post" });
      }
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to load post" });
  }
};
// Get user's posts
exports.getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Get user's groups to filter posts appropriately
    const userGroups = await Group.find({ members: req.user._id });
    const groupIds = userGroups.map((g) => g._id);

    const posts = await Post.find({
      user: userId,
      $or: [
        { group: null }, // Public posts
        { group: { $in: groupIds } }, // Group posts user has access to
      ],
    })
      .populate("user", "username avatar isVerified")
      .populate("place", "name formattedAddress placeId coordinates")
      .populate("group", "name")
      .sort({ createdAt: -1 });

    res.json({ posts });
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

// Delete comment from post
exports.deleteComment = async (req, res) => {
  try {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check ownership
    if (comment.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "You are not authorized to delete this comment" });
    }

    console.log("Delete Comment:", {
      user: req.user._id,
      postId: req.params.postId,
      commentId: req.params.commentId,
    });

    // Remove the comment and save
    post.comments.pull({ _id: commentId });
    await post.save();

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};

// endpoint to search GIFs via GIPHY API
exports.searchGifs = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${
        process.env.GIPHY_API_KEY
      }&q=${encodeURIComponent(query)}&limit=10&rating=g`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch GIFs from GIPHY");
    }
    const data = await response.json();
    res.json({ success: true, data: data.data });
  } catch (error) {
    console.error("Error fetching GIFs:", error);
    res.status(500).json({ error: "Failed to fetch GIFs" });
  }
};

// Export upload middleware
exports.uploadImage = upload.single("image");
