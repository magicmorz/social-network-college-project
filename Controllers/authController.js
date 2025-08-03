const User = require("../models/User");
const fs = require("fs");
const path = require("path");

// GET login page
exports.getLogin = (req, res) => {
  res.render("auth/login", { errors: [] });
};

// POST login form
exports.postLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.render("auth/login", {
        errors: [{ msg: "Username and password are required" }],
      });
    }

    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.render("auth/login", {
        errors: [{ msg: "Invalid username or password" }],
      });
    }

    req.session.userId = user._id;
    res.redirect("/home");
  } catch (error) {
    console.error("Login error:", error);
    res.render("auth/login", {
      errors: [{ msg: "Internal server error during login" }],
    });
  }

};

// GET register page
exports.getRegister = (req, res) => {
  res.render("auth/register", {
    errors: [],
    username: "",
    email: "",
    country: "",
  });
};

// POST register form
exports.postRegister = async (req, res) => {
  const { username, email, password, country, signature } = req.body;
  const errors = [];

  // Input validation
  if (!username) {
    errors.push({ msg: "Username is required" });
  } else if (username.length < 3 || username.length > 30) {
    errors.push({ msg: "Username must be 3-30 characters long" });
  }

  if (!email) {
    errors.push({ msg: "Email is required" });
  } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    errors.push({ msg: "Please enter a valid email" });
  }

  if (!password) {
    errors.push({ msg: "Password is required" });
  } else if (password.length < 6) {
    errors.push({ msg: "Password must be at least 6 characters long" });
  }

  if (!country) {
    errors.push({ msg: "Please select a country" });
  }

  if (!signature || !/^data:image\/[a-zA-Z]+;base64,/.test(signature)) {
    errors.push({ msg: "Please provide a valid signature" });
  }

  // Check for existing user
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) {
    if (existingUser.username === username) {
      errors.push({ msg: "Username already exists" });
    }
    if (existingUser.email === email) {
      errors.push({ msg: "Email already exists" });
    }
  }

  if (errors.length > 0) {
    return res.render("auth/register", {
      errors,
      username,
      email,
      country,
    });
  }

  try {
    const user = new User({
      username,
      email,
      password,
      country,
      signature,
    });
    await user.save(); // Password is auto-hashed by Mongoose middleware

    // Create upload directory for the user
    const baseUploadPath = path.join(
      __dirname,
      "..",
      "uploads",
      `user_${user._id}`
    );
    const profilePicPath = path.join(baseUploadPath, "profile_picture");
    const postsPath = path.join(baseUploadPath, "posts");
    const signaturePath = path.join(baseUploadPath, "signature");

    fs.mkdirSync(profilePicPath, { recursive: true });
    fs.mkdirSync(postsPath, { recursive: true });
    fs.mkdirSync(signaturePath, { recursive: true });

    // Extract base64 content from data URI
    const base64Data = signature.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Save signature image
    const signatureFilePath = path.join(signaturePath, "signature.png");
    fs.writeFileSync(signatureFilePath, buffer);

    // Continue with login session
    req.session.userId = user._id;
    res.redirect("/auth/profile_creation");
  } catch (err) {
    console.error("Registration failed:", err);
    if (err.name === "ValidationError") {
      const validationErrors = Object.values(err.errors).map((e) => ({
        msg: e.message,
      }));
      return res.render("auth/register", {
        errors: validationErrors,
        username,
        email,
        country,
      });
    }
    res.render("auth/register", {
      errors: [{ msg: "Registration error. Please try again." }],
      username,
      email,
      country,
    });
  }
};

// GET logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
};

// GET profile creation page
exports.getProfileCreation = (req, res) => {
  res.render("auth/profile_creation_page", { user: req.user, errors: [] });
};
