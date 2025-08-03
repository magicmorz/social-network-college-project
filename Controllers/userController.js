// controllers/userController.js
const User = require('../models/User');
const path = require("path");
const fs = require("fs");

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

exports.serveAvatar = (req, res) => {
  const userId = req.params.userId;
  
  const avatarPath = path.join(
    __dirname,
    "..",
    "uploads",
    `${userId}`,
    "profile_picture",
    "profile.jpg"
  );

  console.log(`Checking for avatar at: ${avatarPath}`);

  if (fs.existsSync(avatarPath)) {
    console.log(` Avatar found for user ${userId}`);
    return res.sendFile(avatarPath);
  }

  const fallback = path.join(
    __dirname,
    "..",
    "public",
    "avatars",
    "default_profile_picture.jpg"
  );

  console.log(` Avatar not found. Serving default from: ${fallback}`);
  return res.sendFile(fallback);
};
