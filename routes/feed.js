const express = require('express');
const router = express.Router();
const isLoggedIn = require('../middleware/auth');
const feedController = require('../Controllers/feedController');

// GET feed page
router.get('/feed', isLoggedIn, feedController.showFeed);

module.exports = router; 