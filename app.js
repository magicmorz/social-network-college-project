const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const path = require("path");
const fs = require("fs");
const Post = require('./models/Post');
const User = require('./models/User');
const Group = require('./models/Group'); 
const Place = require('./models/Place'); 
require("dotenv").config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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
  
  if (diffInSeconds < 60) return 'now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)}w`;
  
  return postDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}

// Make timeAgo available in EJS templates
app.locals.timeAgo = timeAgo;

// Authentication check middleware (MOVED HERE - BEFORE IT'S USED)
async function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    try {
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

// Auth routes (no auth needed)
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// API routes (with authentication)
const groupRouter = require('./routes/group');  
const usersRouter = require('./routes/users');
app.use('/api/users', isAuthenticated, usersRouter);
app.use('/api/group', isAuthenticated, groupRouter);

// Other protected routes
const postRoutes = require('./routes/post');
app.use('/posts', postRoutes);

const searchRoutes = require('./routes/search');
app.use('/search', searchRoutes);


const profileRoutes = require('./routes/profile');
const placeRoutes = require('./routes/place');
app.use('/u', profileRoutes);
app.use('/places', placeRoutes);

// Home route - loads posts from followed users, groups, and user's own posts
app.get("/home", isAuthenticated, async (req, res) => {
  try {
    const { group: groupId } = req.query;
    let posts;
    let currentGroup = null;

    if (groupId) {
      // Load specific group posts
      currentGroup = await Group.findById(groupId);
      if (!currentGroup || !currentGroup.members.includes(req.user._id)) {
        return res.redirect('/home');
      }
      posts = await Post.find({ group: groupId })
        .populate('user', 'username avatar isVerified')
        .populate('group', 'name')
        .populate({
          path: 'place',
          model: 'Place',
          select: 'name formattedAddress placeId coordinates'
        })
        .populate('comments.user', 'username avatar')
        .sort({ createdAt: -1 });
    } else {
      // Load posts from followed users, groups, and user's own posts
      const user = await User.findById(req.user._id).lean();
      const followedUserIds = user.following ? user.following.map(f => f.user) : [];
      const userGroups = await Group.find({ members: req.user._id });
      const groupIds = userGroups.map(g => g._id);

      posts = await Post.find({
        $or: [
          { user: { $in: followedUserIds } }, // Posts from followed users
          { group: { $in: groupIds } }, // Group posts
          { user: req.user._id } // User's own posts
        ]
      })
        .populate('user', 'username avatar isVerified')
        .populate('group', 'name')
        .populate({
          path: 'place',
          model: 'Place',
          select: 'name formattedAddress placeId coordinates'
        })
        .populate('comments.user', 'username avatar')
        .sort({ createdAt: -1 });
    }

    // Filter out posts with missing users
    const validPosts = posts.filter(post => post.user);
    res.render("feed_screen/feed", {
      posts: validPosts,
      user: req.user,
      currentGroup,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY
    });
  } catch (err) {
    console.error("Error in /home route:", err.message);
    res.status(500).send("Internal server error while loading feed.");
  }
});

// Debug route
app.get("/debug-database", isAuthenticated, async (req, res) => {
  try {
    const posts = await Post.find().limit(10);
    const users = await User.find().limit(10);
    const groups = await Group.find().limit(10); // Add groups to debug
    
    console.log('=== DATABASE DEBUG ===');
    console.log('Posts in database:', posts.length);
    console.log('Users in database:', users.length);
    console.log('Groups in database:', groups.length);
    
    if (posts.length > 0) {
      console.log('Sample post:', {
        id: posts[0]._id,
        user: posts[0].user,
        caption: posts[0].caption,
        image: posts[0].image,
        group: posts[0].group,
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
    
    if (groups.length > 0) {
      console.log('Sample group:', {
        id: groups[0]._id,
        name: groups[0].name,
        members: groups[0].members?.length || 0
      });
    }
    
    res.json({
      postsCount: posts.length,
      usersCount: users.length,
      groupsCount: groups.length,
      currentUser: req.user.username,
      samplePosts: posts.map(p => ({
        id: p._id,
        user: p.user,
        caption: p.caption,
        image: p.image,
        group: p.group
      })),
      sampleUsers: users.map(u => ({
        id: u._id,
        username: u.username
      })),
      sampleGroups: groups.map(g => ({
        id: g._id,
        name: g.name,
        membersCount: g.members?.length || 0
      }))
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.json({ error: error.message });
  }
});

// Debug endpoint specifically for places
app.get('/debug/places', async (req, res) => {
  try {
    const postsWithPlace = await Post.find({ place: { $exists: true, $ne: null } })
      .populate('place')
      .limit(10);
    
    const places = await Place.find().limit(10);
    
    res.json({
      totalPostsWithPlaces: await Post.countDocuments({ place: { $exists: true, $ne: null } }),
      totalPlaces: await Place.countDocuments(),
      posts: postsWithPlace.map(p => ({
        postId: p._id,
        caption: p.caption?.substring(0, 30),
        place: p.place
      })),
      places: places
    });
  } catch (error) {
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