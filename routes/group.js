// routes/group.js
const express = require("express");
const groupController = require("../Controllers/groupController");
const User = require('../models/User');
const router = express.Router();

// Enhanced middleware to ensure user is authenticated
const requireAuth = async (req, res, next) => {
  console.log('🔐 Group Auth middleware - Session:', req.session?.userId);
 
  if (!req.session || !req.session.userId) {
    console.log('❌ No session or userId');
    return res.status(401).json({ error: 'Authentication required' });
  }
 
  try {
    // Get the full user object from database
    const user = await User.findById(req.session.userId);
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }
   
    console.log('✅ User authenticated:', user.username);
    req.user = user; // Attach full user object
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Basic group operations
router.get("/", requireAuth, groupController.getUserGroups);
router.post("/", requireAuth, groupController.createGroup);
router.get("/public", requireAuth, groupController.getPublicGroups);
router.get("/search", requireAuth, groupController.searchGroups);

// Group membership
router.post("/:id/join", requireAuth, groupController.joinGroup);
router.post("/:id/leave", requireAuth, groupController.leaveGroup);

// Group details & posts
router.get("/:id", requireAuth, groupController.getGroupDetails);
router.get("/:id/posts", requireAuth, groupController.getGroupPosts);

// ═══════════════════════════════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════════════════════════════

// Delete group (creator only)
router.delete("/:id", requireAuth, groupController.deleteGroup);

// Admin management
router.post("/:id/admin/add", requireAuth, groupController.addAdmin);
router.post("/:id/admin/remove", requireAuth, groupController.removeAdmin);

// Member management
router.post("/:id/member/remove", requireAuth, groupController.removeMember);

// Group settings
router.put("/:id", requireAuth, groupController.updateGroup);

module.exports = router;