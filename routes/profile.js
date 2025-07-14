const express = require('express');
const router = express.Router();
const User = require('../models/User');
const profileController = require('../Controllers/profileController');

// Authentication middleware (copied from app.js to ensure req.user is populated)
async function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    try {
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }
  res.redirect('/auth/login');
}

// User profile page - /u/:username
router.get('/:username', isAuthenticated, profileController.getUserProfile);

// Follow a user API endpoint
router.post('/:username/follow', isAuthenticated, profileController.followUser);

// Unfollow a user API endpoint
router.post('/:username/unfollow', isAuthenticated, profileController.unfollowUser);

module.exports = router; 