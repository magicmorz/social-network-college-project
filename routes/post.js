const express = require("express");
const router = express.Router();
const postController = require("../Controllers/postController");
const User = require("../models/User");

// Enhanced middleware to ensure user is authenticated
const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    // Get the full user object from database
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user; // Attach full user object
    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(500).json({ error: "Authentication error" });
  }
};

// POST /posts - Create new post
router.post(
  "/",
  requireAuth,
  postController.uploadMedia,
  postController.createPost
);


// POST /posts/:id/like - Like/unlike post
router.post("/:id/like", requireAuth, postController.toggleLike);

// POST /posts/:id/comment - Add comment
router.post("/:id/comment", requireAuth, postController.addComment);

// GET /posts/json - Get posts as JSON (for AJAX)
router.get("/json", requireAuth, postController.getPostsJson);

// DELETE /posts/:id - Delete post
router.delete("/:id", requireAuth, postController.deletePost);

// GET /posts/:id/comments - Get comments for a post
router.get("/:id/comments", requireAuth, postController.getPostComments);

// DELETE comment route
router.delete(
  "/:postId/comments/:commentId",
  requireAuth,
  postController.deleteComment
);

// GET /post/:id - Get single post 
router.get("/:id", requireAuth, postController.getPost);

module.exports = router;
