/**
 * GROUP CONTROLLER
 * 
 * This controller handles all group-related functionality for the social platform.
 * It provides comprehensive group management including:
 * - Group creation and discovery
 * - Member management (join, leave, remove)
 * - Admin functionality (promote, demote, settings)
 * - Group content access (posts within groups)
 * - Search and public group browsing
 * 
 * The controller enforces proper permissions and handles edge cases like:
 * - Automatic group deletion when last member leaves
 * - Admin privilege inheritance for group creators
 * - Security checks for all operations
 */

// Controllers/groupController.js
const Group = require('../models/Group');  // Group data model
const Post = require('../models/Post');    // Post model for group content and cleanup

module.exports = {
  
  // ═══════════════════════════════════════════════════════════════════
  // CORE GROUP FUNCTIONALITY
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET USER'S GROUPS
   * Retrieves all groups that the current user is a member of.
   * Used by the frontend to populate the groups sidebar/dropdown.
   * 
   * @route GET /api/group
   * @access Private (requires authentication)
   * @returns {Array} Array of group objects with populated creator and admin info
   */
  async getUserGroups(req, res) {
    try {
      // Find all groups where the current user is listed as a member
      // Populate creator and admin information for UI display
      const groups = await Group.find({ members: req.session.userId })
        .populate('createdBy', 'username avatar')  // Show who created each group
        .populate('admins', 'username avatar');    // Show current admins

      res.json(groups);
    } catch (error) {
      // Log error for debugging while sending generic message to client
      console.error('Error fetching user groups:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * CREATE NEW GROUP
   * Creates a new group with the current user as creator and first admin.
   * Automatically adds selected members and sets up initial permissions.
   * 
   * @route POST /api/group
   * @access Private
   * @body {string} name - Group name (required)
   * @body {string} description - Group description (optional)
   * @body {boolean} isPublic - Whether group is publicly discoverable
   * @body {Array} members - Array of user IDs to add as initial members
   */
  async createGroup(req, res) {
    try {
      const { name, description, isPublic, members = [] } = req.body;
      
      // Validate required fields
      if (!name) return res.status(400).json({ error: 'Name required' });
      
      // Create new group with creator automatically included
      const group = new Group({
        name,
        description,
        isPublic: isPublic === true,           // Ensure boolean type
        createdBy: req.session.userId,         // Set creator
        members: [req.session.userId, ...members], // Creator + selected members
        admins: [req.session.userId]           // Creator starts as admin
      });
      
      await group.save();
      res.json(group);
    } catch (error) {
      console.error('Error creating group:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // MEMBERSHIP MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  /**
   * JOIN EXISTING GROUP
   * Allows a user to join a public group or accept an invitation.
   * Prevents duplicate memberships and handles edge cases.
   * 
   * @route POST /api/group/:id/join
   * @access Private
   * @param {string} id - Group ID to join
   */
  async joinGroup(req, res) {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      
      // TODO: Add public group check here if implementing private groups
      // if (!group.isPublic) return res.status(403).json({ error: 'Cannot join private group' });
      
      // Only add user if they're not already a member (prevent duplicates)
      if (!group.members.includes(req.session.userId)) {
        group.members.push(req.session.userId);
        await group.save();
      }
      
      res.json(group);
    } catch (error) {
      console.error('Error joining group:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * LEAVE GROUP (Basic Implementation)
   * Original leave group implementation - removes user from members and admins.
   * Note: This doesn't handle the "delete if last member" logic - see leaveGroup below.
   * 
   * @route POST /api/group/:id/leave
   * @access Private
   * @param {string} id - Group ID to leave
   */
  async leaveGroup(req, res) {
    try {
      const group = await Group.findById(req.params.id);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      
      // Remove user from both members and admins arrays
      group.members = group.members.filter(m => m.toString() !== req.session.userId);
      group.admins = group.admins.filter(a => a.toString() !== req.session.userId);
      
      await group.save();
      res.json(group);
    } catch (error) {
      console.error('Error leaving group:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // GROUP INFORMATION AND CONTENT
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET GROUP DETAILS
   * Retrieves detailed information about a specific group.
   * Includes member lists, admin status, and permission flags for the current user.
   * Used when displaying group pages and admin interfaces.
   * 
   * @route GET /api/group/:id
   * @access Private (members only)
   * @param {string} id - Group ID
   * @returns {Object} Group object with populated members and permission flags
   */
  async getGroupDetails(req, res) {
    try {
      // Fetch group with all related user information populated
      const group = await Group.findById(req.params.id)
        .populate('members', 'username avatar')      // All members with basic info
        .populate('admins', 'username avatar')       // All admins with basic info
        .populate('createdBy', 'username avatar');   // Group creator info
      
      if (!group) return res.status(404).json({ error: 'Group not found' });
      
      // Security check: Only group members can view group details
      if (!group.members.some(member => member._id.toString() === req.session.userId)) {
        return res.status(403).json({ error: 'Not a member of this group' });
      }
      
      // Add permission flags for the current user to the response
      // This helps the frontend determine what actions are available
      const groupObj = group.toObject();
      groupObj.isCurrentUserAdmin = group.admins.some(admin => 
        admin._id.toString() === req.session.userId
      );
      groupObj.isCurrentUserCreator = group.createdBy._id.toString() === req.session.userId;
      
      res.json(groupObj);
    } catch (error) {
      console.error('Error fetching group details:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * GET GROUP POSTS
   * Retrieves all posts that belong to a specific group.
   * Enforces membership requirements and returns posts in chronological order.
   * 
   * @route GET /api/group/:id/posts
   * @access Private (group members only)
   * @param {string} id - Group ID
   * @returns {Array} Array of post objects with populated user and comment data
   */
  async getGroupPosts(req, res) {
    try {
      const groupId = req.params.id;
      
      // Verify group exists and user has access
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Security check: Only group members can view group posts
      if (!group.members.includes(req.session.userId)) {
        return res.status(403).json({ error: 'Not authorized to view this group' });
      }
      
      // Fetch posts with all necessary user information for display
      // Note: Re-requiring Post here for clarity, could be moved to top
      const Post = require('../models/Post');
      const posts = await Post.find({ group: groupId })
        .populate('user', 'username avatar isVerified')     // Post author info
        .populate('comments.user', 'username avatar')       // Comment authors info
        .sort({ createdAt: -1 });                          // Newest first
      
      res.json(posts);
    } catch (error) {
      console.error('Error fetching group posts:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC GROUP DISCOVERY
  // ═══════════════════════════════════════════════════════════════════

  /**
   * GET PUBLIC GROUPS
   * Retrieves publicly discoverable groups for the browse/discover interface.
   * Limited to prevent performance issues and includes creator information.
   * 
   * @route GET /api/groups/public
   * @access Public
   * @returns {Array} Array of public groups with creator info
   */
  async getPublicGroups(req, res) {
    try {
      const groups = await Group.find({ isPublic: true })
        .populate('createdBy', 'username avatar')  // Show group creators
        .sort({ createdAt: -1 })                   // Newest groups first
        .limit(20);                                // Limit to prevent performance issues
      
      res.json(groups);
    } catch (error) {
      console.error('Error fetching public groups:', error);
      res.status(500).json({ error: error.message });
    }
  },

  /**
   * SEARCH GROUPS
   * Searches through public groups by name and description.
   * Uses case-insensitive regex matching for flexible search results.
   * 
   * @route GET /api/groups/search?q=searchterm
   * @access Public
   * @query {string} q - Search query string
   * @returns {Array} Array of matching groups
   */
  async searchGroups(req, res) {
    try {
      const { q } = req.query;
      if (!q) return res.status(400).json({ error: 'Search query required' });
      
      // Search both name and description fields, case-insensitive
      const groups = await Group.find({
        $and: [
          { isPublic: true },    // Only search public groups
          {
            $or: [
              { name: { $regex: q, $options: 'i' } },           // Match name
              { description: { $regex: q, $options: 'i' } }     // Match description
            ]
          }
        ]
      })
      .populate('createdBy', 'username avatar')
      .limit(10);  // Limit search results for performance
      
      res.json(groups);
    } catch (error) {
      console.error('Error searching groups:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // ═══════════════════════════════════════════════════════════════════
  // ADMINISTRATIVE FUNCTIONS
  // These functions provide advanced group management capabilities
  // for users with appropriate permissions (admins and creators).
  // ═══════════════════════════════════════════════════════════════════

  /**
   * DELETE ENTIRE GROUP
   * Completely removes a group and all associated content.
   * Only the group creator can perform this action.
   * This is a destructive operation that also deletes all group posts.
   * 
   * @route DELETE /api/group/:id
   * @access Private (creator only)
   * @param {string} id - Group ID to delete
   */
  async deleteGroup(req, res) {
    try {
      const groupId = req.params.id;
      const group = await Group.findById(groupId);

      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Security check: Only the group creator can delete the entire group
      if (group.createdBy.toString() !== req.session.userId) {
        return res.status(403).json({ error: 'Only the group creator can delete the group' });
      }

      // Cascade deletion: Remove all posts associated with this group first
      // This prevents orphaned posts and maintains data integrity
      await Post.deleteMany({ group: groupId });

      // Delete the group itself
      await Group.findByIdAndDelete(groupId);
      
      res.json({ 
        success: true, 
        message: 'Group deleted successfully' 
      });
    } catch (error) {
      console.error('Error deleting group:', error);
      res.status(500).json({ error: 'Failed to delete group' });
    }
  },

  /**
   * PROMOTE USER TO ADMIN
   * Adds admin privileges to an existing group member.
   * Existing admins can promote other members to admin status.
   * Includes validation to ensure target user is a member.
   * 
   * @route POST /api/group/:id/admin/add
   * @access Private (admins only)
   * @param {string} id - Group ID
   * @body {string} userId - ID of user to promote to admin
   */
  async addAdmin(req, res) {
    try {
      const groupId = req.params.id;
      const { userId } = req.body;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Permission check: Only existing admins can add other admins
      if (!group.admins.includes(req.session.userId)) {
        return res.status(403).json({ error: 'Only admins can add other admins' });
      }

      // Validation: Target user must be a member to become admin
      if (!group.members.includes(userId)) {
        return res.status(400).json({ error: 'User must be a member to become admin' });
      }

      // Prevent duplicate admin entries
      if (group.admins.includes(userId)) {
        return res.status(400).json({ error: 'User is already an admin' });
      }

      // Add user to admins array and save
      group.admins.push(userId);
      await group.save();

      // Return updated admin list with populated user information
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

  /**
   * REMOVE ADMIN PRIVILEGES
   * Removes admin status from a user while keeping them as a member.
   * Handles different permission levels and prevents certain actions:
   * - Creators can remove any admin
   * - Admins can only remove themselves
   * - Creators cannot be demoted (they remain admins permanently)
   * 
   * @route POST /api/group/:id/admin/remove
   * @access Private (admins/creator only)
   * @param {string} id - Group ID
   * @body {string} userId - ID of user to demote from admin
   */
  async removeAdmin(req, res) {
    try {
      const groupId = req.params.id;
      const { userId } = req.body;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Determine permission levels for complex authorization logic
      const isCreator = group.createdBy.toString() === req.session.userId;
      const isRemovingSelf = userId === req.session.userId;
      const isAdmin = group.admins.includes(req.session.userId);

      // Permission checks: Only creator can remove others, anyone can remove themselves
      if (!isCreator && !isRemovingSelf) {
        return res.status(403).json({ error: 'Only the creator can remove other admins' });
      }

      // Basic authorization check
      if (!isAdmin && !isCreator) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Business rule: Prevent creator from losing admin privileges
      if (isCreator && isRemovingSelf) {
        return res.status(400).json({ error: 'Group creator cannot be removed as admin' });
      }

      // Remove user from admins array
      group.admins = group.admins.filter(admin => admin.toString() !== userId);
      await group.save();

      // Return updated admin list
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

  /**
   * REMOVE GROUP MEMBER
   * Completely removes a user from the group (both membership and admin status).
   * Only admins can remove other members, with protections for the group creator.
   * This is more severe than just removing admin privileges.
   * 
   * @route POST /api/group/:id/member/remove
   * @access Private (admins only)
   * @param {string} id - Group ID
   * @body {string} userId - ID of user to remove from group
   */
  async removeMember(req, res) {
    try {
      const groupId = req.params.id;
      const { userId } = req.body;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Permission check: Only admins can remove members
      if (!group.admins.includes(req.session.userId)) {
        return res.status(403).json({ error: 'Only admins can remove members' });
      }

      // Business rule: Prevent removing the group creator
      // This maintains group ownership and prevents admin abuse
      if (group.createdBy.toString() === userId) {
        return res.status(400).json({ error: 'Cannot remove the group creator' });
      }

      // Remove user from both members and admins (complete removal)
      group.members = group.members.filter(member => member.toString() !== userId);
      group.admins = group.admins.filter(admin => admin.toString() !== userId);
      
      await group.save();

      // Return updated membership lists
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

  /**
   * UPDATE GROUP SETTINGS
   * Allows admins to modify group properties like name, description, and privacy.
   * Provides flexible updating where only provided fields are changed.
   * 
   * @route PUT /api/group/:id
   * @access Private (admins only)
   * @param {string} id - Group ID
   * @body {string} [name] - New group name (optional)
   * @body {string} [description] - New group description (optional)
   * @body {boolean} [isPublic] - New privacy setting (optional)
   */
  async updateGroup(req, res) {
    try {
      const groupId = req.params.id;
      const { name, description, isPublic } = req.body;
      
      const group = await Group.findById(groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }

      // Permission check: Only admins can update group settings
      if (!group.admins.includes(req.session.userId)) {
        return res.status(403).json({ error: 'Only admins can update group settings' });
      }

      // Update only the fields that were provided (flexible updating)
      if (name) group.name = name;
      if (description !== undefined) group.description = description; // Allow empty string
      if (isPublic !== undefined) group.isPublic = isPublic;          // Allow false

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

// ═══════════════════════════════════════════════════════════════════
// ENHANCED LEAVE GROUP FUNCTIONALITY
// This is an improved version of the leave group function that handles
// the automatic deletion of groups when the last member leaves.
// This should replace or supplement the basic leaveGroup function above.
// ═══════════════════════════════════════════════════════════════════

/**
 * LEAVE GROUP WITH AUTO-DELETE
 * Enhanced leave group function that automatically deletes the group
 * if the leaving user is the last remaining member.
 * This prevents orphaned groups and maintains data integrity.
 * 
 * @route POST /api/group/:groupId/leave
 * @access Private
 * @param {string} groupId - Group ID to leave
 * @returns {Object} Success message and deletion status
 */
exports.leaveGroup = async (req, res) => {
  const groupId = req.params.groupId;
  const userId = req.user._id;  // Note: This assumes req.user instead of req.session

  try {
    const group = await Group.findById(groupId);

    // Validate group exists
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Remove user from both members and admins arrays
    // Using .equals() method for proper ObjectId comparison
    group.members = group.members.filter(member => !member.equals(userId));
    group.admins = group.admins.filter(admin => !admin.equals(userId));

    // Check if this was the last member - if so, delete the entire group
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(groupId);

      // Optional: Also delete all posts associated with this group
      // Uncomment the line below if you want to clean up group posts as well
      // await Post.deleteMany({ group: groupId });

      return res.status(200).json({ 
        message: 'Group deleted because it had no remaining members',
        deleted: true  // Flag to indicate group was deleted
      });
    }

    // If other members remain, just save the updated membership
    await group.save();

    res.status(200).json({ 
      message: 'You left the group successfully',
      deleted: false  // Flag to indicate group still exists
    });
  } catch (err) {
    console.error('Error in leave group operation:', err);
    res.status(500).json({ message: 'Server error' });
  }
};