const express = require('express');
const router = express.Router();
const User = require('../models/User');
const profileController = require('../Controllers/profileController');

// Authentication middleware (duplicated here for now - should be centralized)
async function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    try {
      // Get full user object from database for post functionality
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

// Profile page
router.get('/:username', isAuthenticated, profileController.getUserProfile);

// Insights page (owner-only)
router.get('/:username/insights', isAuthenticated, profileController.getUserInsights);

// Follow a user API endpoint
router.post('/:username/follow', isAuthenticated, profileController.followUser);

// Unfollow a user API endpoint
router.post('/:username/unfollow', isAuthenticated, profileController.unfollowUser);

module.exports = router; 