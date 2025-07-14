const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/auth');
const searchController = require('../Controllers/searchController');

// User search API endpoint
router.get('/users', isLoggedIn, searchController.searchUsers);

// Post search API endpoint
router.get('/posts', isLoggedIn, searchController.searchPosts);

// Legacy route (if needed)
router.get('/search', isLoggedIn, searchController.searchUsers);

module.exports = router; 