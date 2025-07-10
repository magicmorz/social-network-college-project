const express = require('express');
const router = express.Router();
const postController = require('../Controllers/postController');
const User = require('../models/User'); // Add this import

// Enhanced middleware to ensure user is authenticated
const requireAuth = async (req, res, next) => {
  console.log('🔐 Auth middleware - Session:', req.session?.userId);
  
  if (!req.session || !req.session.userId) {
    console.log('❌ No session or userId');
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Get the full user object from database
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('✅ User authenticated:', user.username);
    req.user = user; // Attach full user object
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// POST /posts - Create new post (for your modal)
router.post('/', requireAuth, postController.uploadImage, postController.createPost);

// POST /posts/:id/like - Like/unlike post
router.post('/:id/like', requireAuth, postController.toggleLike);

// POST /posts/:id/comment - Add comment
router.post('/:id/comment', requireAuth, postController.addComment);

// GET /posts/json - Get posts as JSON (for AJAX)
router.get('/json', requireAuth, postController.getPostsJson);

// DELETE /posts/:id - Delete post
router.delete('/:id', requireAuth, postController.deletePost);

router.get('/:id/comments', requireAuth, postController.getPostComments);

module.exports = router;