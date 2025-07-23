const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/auth');
const searchController = require('../Controllers/searchController');

// GET user search route
router.get('/users', isLoggedIn, searchController.searchUsers);

// GET post search route  
router.get('/posts', isLoggedIn, searchController.searchPosts);

module.exports = router; 