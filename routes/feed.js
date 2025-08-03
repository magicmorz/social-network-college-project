const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/auth');
const feedController = require('../Controllers/feedController');

// GET home/feed page
router.get('/home', isLoggedIn, feedController.showFeed);

module.exports = router; 