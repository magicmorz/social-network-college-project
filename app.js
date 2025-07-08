const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use(session({
  secret: process.env.SESSION_SECRET || "devsecret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// View engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Authentication check middleware
function isAuthenticated(req, res, next) {
  if (req.session.userId) return next();
  res.redirect('/auth/login');
}

// Root route - ADD THIS
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect('/home');
  } else {
    res.redirect('/auth/login');
  }
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Protected home page
app.get("/home", isAuthenticated, (req, res) => {
  res.render("feed_screen/feed");
});

// Mongo connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));