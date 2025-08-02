// routes/users.js
const express = require('express');
const router = express.Router();
const User   = require('../models/User');

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

module.exports = router;
