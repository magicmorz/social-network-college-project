const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/auth');
const searchController = require('../Controllers/searchController');

// GET search route
router.get('/search', isLoggedIn, searchController.searchUsers);

module.exports = router; 