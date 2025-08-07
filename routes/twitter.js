const express = require('express');
const router = express.Router();
const twitterController = require('../Controllers/twitterController');
const isLoggedIn = require('../middleware/auth');

// GET /twitter/callback - Handle Twitter OAuth callback (no auth required)
router.get('/callback', twitterController.handleOAuthCallback);

// All other routes require authentication
router.use(isLoggedIn);

// GET /twitter/auth - Initiate Twitter OAuth
router.get('/auth', twitterController.initiateOAuth);

// GET /twitter/status - Get connection status
router.get('/status', twitterController.getConnectionStatus);

// DELETE /twitter/disconnect - Disconnect Twitter account
router.delete('/disconnect', twitterController.disconnectAccount);

// POST /twitter/share - Share post to Twitter
router.post('/share', twitterController.sharePostToTwitter);

module.exports = router;