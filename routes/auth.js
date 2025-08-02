const express = require("express");  
const router = express.Router();  
const path = require("path");  // for path operations
const fs = require("fs"); // for file system operations
const multer = require("multer"); // for handling file uploads

const authController = require("../Controllers/authController");
const isLoggedIn = require("../middleware/auth");
const User = require("../models/User");

// Configure multer to use memory storage (for file location control)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET login page
router.get("/login", authController.getLogin);

// POST login form
router.post("/login", authController.postLogin);

// register routes
router.get("/register", authController.getRegister);
router.post("/register", authController.postRegister);

// GET profile creation page
router.get("/profile_creation", isLoggedIn, authController.getProfileCreation);

// ✅ POST complete profile setup (profile pic + bio)
router.post(
  "/complete-profile",
  isLoggedIn,
  upload.single("profilePic"),
  async (req, res) => {
    const userId = req.session.userId;
    const bio = req.body.bio;

    const profilePicDir = path.join(
      __dirname,
      "..",
      "uploads",
      `user_${userId}`,
      "profile_picture"
    );
    const profilePicPath = path.join(profilePicDir, "profile.jpg");

    try {
      // Ensure the folder exists
      fs.mkdirSync(profilePicDir, { recursive: true });

      if (req.file) {
        // Save uploaded profile picture
        fs.writeFileSync(profilePicPath, req.file.buffer);
      } else {
        // No file uploaded – use default image
        const defaultPic = path.join(
          __dirname,
          "..",
          "public",
          "avatars",
          "default_profile_picture.png"
        );
        fs.copyFileSync(defaultPic, profilePicPath);
      }

      // Save bio to the database
      await User.findByIdAndUpdate(userId, { bio });

      res.redirect("/home"); // Change this to your actual homepage route
    } catch (err) {
      console.error("Profile setup error:", err);
      res.status(500).send("Something went wrong. Please try again.");
    }
  }
);

// logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login_screen/login");
  });
});

module.exports = router;
