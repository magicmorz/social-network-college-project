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
  // Extract userId from request parameters
  const userId = req.params.userId;

  // Construct the full path to the user's profile picture on the server
  const avatarPath = path.join(
    __dirname,
    "..",
    "uploads",
    `${userId}`, // Folder named after the userId
    "profile_picture", // Subfolder for profile pictures
    "profile.jpg" // Filename of the profile image
  );

  // Log the path where the server is checking for the avatar
  console.log(`Checking for avatar at: ${avatarPath}`);

  // Check if the user's avatar file exists on disk
  if (fs.existsSync(avatarPath)) {
    console.log(` Avatar found for user ${userId}`);
    // If found, send the user's avatar file as the response
    return res.sendFile(avatarPath);
  }

  // If the avatar does not exist, define the fallback default avatar path
  const fallback = path.join(
    __dirname,
    "..",
    "public",
    "avatars",
    "default_profile_picture.jpg"
  );

  // Log that the avatar was not found and that the default will be served instead
  console.log(` Avatar not found. Serving default from: ${fallback}`);

  // Send the default avatar file as the response
  return res.sendFile(fallback);
};
