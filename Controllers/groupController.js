// Controllers/groupController.js
const Group = require('../models/Group');
const Post = require('../models/Post'); // You'll likely need this for posts

module.exports = {
  // List all groups the current user belongs to
  async getUserGroups(req, res) {
    try {
      const groups = await Group.find({ members: req.session.userId })
        .populate('createdBy', 'username avatar')
        .populate('admins', 'username avatar');
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
      
      // Add admin status for current user (ADDED THIS)
      const groupObj = group.toObject();
      groupObj.isCurrentUserAdmin = group.admins.some(admin => admin._id.toString() === req.session.userId);
      groupObj.isCurrentUserCreator = group.createdBy._id.toString() === req.session.userId;
      
      res.json(groupObj);
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
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN FUNCTIONS (ADDED THESE)
  // ═══════════════════════════════════════════════════════════════════

  // Delete group (creator only)
  async deleteGroup(req, res) {
    try {
      const groupId = req.params.id;
      const group = await Group.findById(groupId);

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check if user is the creator
      if (group.createdBy.toString() !== req.session.userId) {
        return res.status(403).json({ error: 'Only the group creator can delete the group' });
      }

      // Delete all posts in the group first
      await Post.deleteMany({ group: groupId });

      // Delete the group
      await Group.findByIdAndDelete(groupId);
      
      res.json({ success: true, message: 'Group deleted successfully' });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({ error: 'Failed to delete group' });
    }
  },

  // Add admin (admins can add other admins)
  async addAdmin(req, res) {
    try {
      const groupId = req.params.id;
      const { userId } = req.body;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check if current user is admin
      if (!group.admins.includes(req.session.userId)) {
        return res.status(403).json({ error: 'Only admins can add other admins' });
      }

      // Check if target user is a member
      if (!group.members.includes(userId)) {
        return res.status(400).json({ error: 'User must be a member to become admin' });
      }

      // Check if user is already admin
      if (group.admins.includes(userId)) {
        return res.status(400).json({ error: 'User is already an admin' });
      }

      group.admins.push(userId);
      await group.save();

      const updatedGroup = await Group.findById(groupId)
        .populate('admins', 'username avatar');

      res.json({ 
        success: true, 
        message: 'Admin added successfully',
        admins: updatedGroup.admins 
      });
    } catch (error) {
      console.error('Error adding admin:', error);
      res.status(500).json({ error: 'Failed to add admin' });
    }
  },

  // Remove admin (creator can remove any admin, admins can remove themselves)
  async removeAdmin(req, res) {
    try {
      const groupId = req.params.id;
      const { userId } = req.body;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check permissions
      const isCreator = group.createdBy.toString() === req.session.userId;
      const isRemovingSelf = userId === req.session.userId;
      const isAdmin = group.admins.includes(req.session.userId);

      if (!isCreator && !isRemovingSelf) {
        return res.status(403).json({ error: 'Only the creator can remove other admins' });
      }

      if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Prevent creator from removing themselves
      if (isCreator && isRemovingSelf) {
        return res.status(400).json({ error: 'Group creator cannot be removed as admin' });
      }

      group.admins = group.admins.filter(admin => admin.toString() !== userId);
      await group.save();

      const updatedGroup = await Group.findById(groupId)
        .populate('admins', 'username avatar');

      res.json({ 
        success: true, 
        message: 'Admin removed successfully',
        admins: updatedGroup.admins 
      });
    } catch (error) {
      console.error('Error removing admin:', error);
      res.status(500).json({ error: 'Failed to remove admin' });
    }
  },

  // Remove member (admins can remove members)
  async removeMember(req, res) {
    try {
      const groupId = req.params.id;
      const { userId } = req.body;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check if current user is admin
      if (!group.admins.includes(req.session.userId)) {
        return res.status(403).json({ error: 'Only admins can remove members' });
      }

      // Prevent removing the creator
      if (group.createdBy.toString() === userId) {
        return res.status(400).json({ error: 'Cannot remove the group creator' });
      }

      // Remove from members and admins (if applicable)
      group.members = group.members.filter(member => member.toString() !== userId);
      group.admins = group.admins.filter(admin => admin.toString() !== userId);
      
      await group.save();

      const updatedGroup = await Group.findById(groupId)
        .populate('members', 'username avatar')
        .populate('admins', 'username avatar');

      res.json({ 
        success: true, 
        message: 'Member removed successfully',
        members: updatedGroup.members,
        admins: updatedGroup.admins
      });
    } catch (error) {
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Failed to remove member' });
    }
  },

  // Update group settings (admins only)
  async updateGroup(req, res) {
    try {
      const groupId = req.params.id;
      const { name, description, isPublic } = req.body;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Check if current user is admin
      if (!group.admins.includes(req.session.userId)) {
        return res.status(403).json({ error: 'Only admins can update group settings' });
      }

      if (name) group.name = name;
      if (description !== undefined) group.description = description;
      if (isPublic !== undefined) group.isPublic = isPublic;

      await group.save();

      res.json({ 
        success: true, 
        message: 'Group updated successfully',
        group: group
      });
    } catch (error) {
      console.error('Error updating group:', error);
      res.status(500).json({ error: 'Failed to update group' });
    }
  }
};