const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const Post = require('./models/Post');
const User = require('./models/User'); // Make sure you have this model
require("dotenv").config();

const app = express();

// Middleware (moved before routes)
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

// Helper function to calculate time ago
function timeAgo(date) {
  const now = new Date();
  const postDate = new Date(date);
  const diffInSeconds = Math.floor((now - postDate) / 1000);
  
  if (diffInSeconds < 60) {
    return 'now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  } else if (diffInSeconds < 1209600) { // 2 weeks
    return '1w';
  } else if (diffInSeconds < 2419200) { // 4 weeks
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks}w`;
  } else {
    // More than 4 weeks, show date
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
}

// Make timeAgo available in EJS templates
app.locals.timeAgo = timeAgo;

// Authentication check middleware
async function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    try {
      // Get full user object from database for post functionality
      const user = await User.findById(req.session.userId);
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  }
  res.redirect('/auth/login');
}

// Root route - redirect based on login state
app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect('/home');
  } else {
    res.redirect('/auth/login');
  }
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Post routes for API endpoints
const postRoutes = require('./routes/post');
app.use('/posts', postRoutes);

// Search routes for API endpoints
const searchRoutes = require('./routes/search');
app.use('/search', searchRoutes);

// Profile routes for user profiles
const profileRoutes = require('./routes/profile');
app.use('/u', profileRoutes);

// Protected home route - loads posts from DB and passes to feed.ejs
app.get("/home", isAuthenticated, async (req, res) => {
  try {
    console.log('Loading feed for user:', req.user.username);
    
    const posts = await Post.find()
      .populate('user', 'username avatar isVerified')
      .populate('comments.user', 'username avatar') // This populates comment users
      .sort({ createdAt: -1 });
    
    // Filter out posts with missing users
    const validPosts = posts.filter(post => {
      if (!post.user) {
        console.log('⚠️ Found post with missing user:', post._id);
        return false;
      }
      return true;
    });
    
    console.log(`Found ${posts.length} total posts, ${validPosts.length} valid posts`);
    
    if (validPosts.length > 0) {
      console.log('Valid posts with comments:', validPosts.map(p => ({ 
        id: p._id, 
        user: p.user.username, 
        caption: p.caption?.substring(0, 50) || 'No caption',
        image: p.image,
        commentsCount: p.comments ? p.comments.length : 0 // Add this debug line
      })));
    } else {
      console.log('❌ No valid posts found');
    }
    
    res.render("feed_screen/feed", { posts: validPosts, user: req.user });
  } catch (err) {
    console.error("❌ Error loading posts:", err);
    res.status(500).send("Internal server error while loading feed.");
  }
});

// Add this temporary debug route
app.get("/debug-database", isAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find().limit(10);
    const users = await User.find().limit(10);
    
    console.log('=== DATABASE DEBUG ===');
    console.log('Posts in database:', posts.length);
    console.log('Users in database:', users.length);
    
    if (posts.length > 0) {
      console.log('Sample post:', {
        id: posts[0]._id,
        user: posts[0].user,
        caption: posts[0].caption,
        image: posts[0].image,
        createdAt: posts[0].createdAt
      });
    }
    
    if (users.length > 0) {
      console.log('Sample user:', {
        id: users[0]._id,
        username: users[0].username,
        email: users[0].email
      });
    }
    
    res.json({
      postsCount: posts.length,
      usersCount: users.length,
      currentUser: req.user.username,
      samplePosts: posts.map(p => ({
        id: p._id,
        user: p.user,
        caption: p.caption,
        image: p.image
      })),
      sampleUsers: users.map(u => ({
        id: u._id,
        username: u.username
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.message === 'Only image files are allowed!') {
    return res.status(400).json({ error: 'Only image files are allowed!' });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send('Page not found');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

module.exports = app;