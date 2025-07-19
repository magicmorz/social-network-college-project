// Controllers/groupController.js
const Group = require('../models/Group');
const Post = require('../models/Post'); // You'll likely need this for posts

module.exports = {
  // List all groups the current user belongs to
  async getUserGroups(req, res) {
    try {
      const groups = await Group.find({ members: req.session.userId });
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create a new group
  async createGroup(req, res) {
    try {
      const { name, description, isPublic, members = [] } = req.body;
      if (!name) return res.status(400).json({ error: 'Name required' });
      
      const group = new Group({
        name,
        description,
        isPublic: isPublic === true,
        createdBy: req.session.userId,
        members: [req.session.userId, ...members],
        admins: [req.session.userId]
      });
      
      await group.save();
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Join an existing group
  async joinGroup(req, res) {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      
      if (!group.members.includes(req.session.userId)) {
        group.members.push(req.session.userId);
        await group.save();
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Leave a group
  async leaveGroup(req, res) {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      
      group.members = group.members.filter(m => m.toString() !== req.session.userId);
      group.admins = group.admins.filter(a => a.toString() !== req.session.userId);
      
      await group.save();
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get details for a specific group
  async getGroupDetails(req, res) {
    try {
      const group = await Group.findById(req.params.id)
        .populate('members', 'username avatar')
        .populate('admins', 'username avatar')
        .populate('createdBy', 'username avatar');
      
      if (!group) return res.status(404).json({ error: 'Group not found' });
      
      // Check if user is a member
      if (!group.members.some(member => member._id.toString() === req.session.userId)) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }
      
      res.json(group);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },


// Get posts for a specific group
async getGroupPosts(req, res) {
  try {
    const groupId = req.params.id;
    
    // Verify group exists and user has access
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    // Check if user is a member
    if (!group.members.includes(req.session.userId)) {
      return res.status(403).json({ error: 'Not authorized to view this group' });
    }
    
    // Get posts for this group
    const Post = require('../models/Post');
    const posts = await Post.find({ group: groupId })
      .populate('user', 'username avatar isVerified')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
},

  // Get all public groups for discovery
  async getPublicGroups(req, res) {
    try {
      const groups = await Group.find({ isPublic: true })
        .populate('createdBy', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(20); // Limit to avoid too much data
      
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Search groups by name or description
  async searchGroups(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ error: 'Search query required' });
      
      const groups = await Group.find({
        $and: [
          { isPublic: true }, // Only search public groups
          {
            $or: [
              { name: { $regex: q, $options: 'i' } },
              { description: { $regex: q, $options: 'i' } }
            ]
          }
        ]
      })
      .populate('createdBy', 'username avatar')
      .limit(10);
      
      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};