const User = require("../models/User");

// GET login page
exports.getLogin = (req, res) => {
  res.render("auth/login");
};

// POST login form
exports.postLogin = async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).send("Invalid login");
  }

  req.session.userId = user._id;
  res.redirect("/home");
};

// GET register page
exports.getRegister = (req, res) => {
  res.render("auth/register");
};

// POST register form
exports.postRegister = async (req, res) => {
  const { username, email, password, country, signature } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    const user = new User({
      username,
      email,
      password,
      country,
      signature,
    });
    await user.save(); // password is auto-hashed

    // Log the user in by setting session
    req.session.userId = user._id;

    // Redirect to profile creation page
    res.redirect("/auth/profile_creation");
  } catch (err) {
    console.error("Registration failed:", err);
    res.status(500).send("Registration error");
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
  res.render("auth/profile_creation_page", { user: req.user });
};