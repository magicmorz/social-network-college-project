// routes/place.js
const express = require('express');
const router = express.Router();
const placeController = require('../Controllers/placeController');

// Authentication middleware
async function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    try {
      const User = require('../models/User');
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

// Search places API route (must come before /:placeId)
router.get('/search', isAuthenticated, placeController.searchPlaces);

// API route for place data (must come before /:placeId)
router.get('/api/:placeId', isAuthenticated, placeController.getPlaceJson);

// Place page route (must come last to avoid conflicts)
router.get('/:placeId', isAuthenticated, placeController.getPlacePage);

module.exports = router; 