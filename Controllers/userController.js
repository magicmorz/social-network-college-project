// controllers/userController.js
const User = require('../models/User');

exports.listUsers = async (req, res) => {
  try {
    // return only the fields we need for checkboxes
    const users = await User.find({}, 'username');
    res.json(users);
  } catch (err) {
    console.error('Failed to list users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};
