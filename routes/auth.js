const express = require("express");
const router = express.Router();
const authController = require("../Controllers/authController");
const isLoggedIn = require("../middleware/auth");

// GET login page
router.get("/login", authController.getLogin);

// POST login form
router.post("/login", authController.postLogin);

// register routes
router.get("/register", authController.getRegister);
router.post("/register", authController.postRegister);

// profile creation route
router.get("/profile_creation", isLoggedIn, authController.getProfileCreation);
// logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login_screen/login");
  });
});

module.exports = router;
