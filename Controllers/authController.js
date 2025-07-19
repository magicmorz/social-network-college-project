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

    await new User({
      username,
      email,
      password,
      country,
      signature,
    }).save(); // password is auto-hashed
    res.redirect("/auth/login");
  } catch (err) {
    console.error(" Registration failed:", err);
    res.status(500).send("Registration error");
  }
};

// GET logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/auth/login");
  });
};
