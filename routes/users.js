// routes/users.js
const express = require('express');
const router = express.Router();
const User   = require('../models/User');
const userController = require("../Controllers/userController");


// GET /api/users → return all users
router.get('/', async (req, res) => {
  try {
    // select only the fields you need
    const users = await User.find().select('_id username');
    res.json(users);
  } catch (e) {
    console.error('Failed to load users:', e);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// Serve user avatar image
router.get("/avatars/:userId", userController.serveAvatar);


module.exports = router;

