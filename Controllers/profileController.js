const User = require('../models/User');
const Post = require('../models/Post');
const mongoose = require('mongoose');

// Get user profile page
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;
    
    // Find the target user
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).render('error', { message: 'User not found' });
    }
    
    // Get real-time follower and following counts using aggregation
    const followerCount = await User.countDocuments({ 
      following: targetUser._id 
    });
    
    const followingCount = targetUser.following.length;
    
    // Get user's posts (latest 12)
    const posts = await Post.find({ user: targetUser._id })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate('user', 'username profilePicture');
    
    const postsCount = await Post.countDocuments({ user: targetUser._id });
    
    // Check if current user is following this user
    const isFollowing = await User.findOne({
      _id: currentUserId,
      following: targetUser._id
    }) !== null;
    
    // Check if this is the current user's own profile
    const isOwnProfile = currentUserId.toString() === targetUser._id.toString();
    
    res.render('profile/profile', {
      targetUser,
      currentUser: req.user,
      isOwnProfile,
      isFollowing,
      followerCount,
      followingCount,
      postsCount,
      posts,
      timeAgo: req.app.locals.timeAgo || ((date) => {
        const now = new Date();
        const postDate = new Date(date);
        const diffInSeconds = Math.floor((now - postDate) / 1000);
        
        if (diffInSeconds < 60) return 'now';
        else if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        else if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        else if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        else return `${Math.floor(diffInSeconds / 604800)}w`;
      })
    });
    
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).render('error', { message: 'Error loading profile' });
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;
    
    // Find the target user
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Can't follow yourself
    if (currentUserId.toString() === targetUser._id.toString()) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    // Check if already following
    const currentUser = await User.findById(currentUserId);
    if (currentUser.following.includes(targetUser._id)) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    // Add to following/followers arrays
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: { following: targetUser._id }
    });
    
    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { followers: currentUserId }
    });
    
    // Get updated counts
    const followerCount = await User.countDocuments({ 
      following: targetUser._id 
    });
    
    res.json({ 
      success: true, 
      isFollowing: true,
      followerCount
    });
    
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Error following user' });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;
    
    // Find the target user
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Remove from following/followers arrays
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { following: targetUser._id }
    });
    
    await User.findByIdAndUpdate(targetUser._id, {
      $pull: { followers: currentUserId }
    });
    
    // Get updated counts
    const followerCount = await User.countDocuments({ 
      following: targetUser._id 
    });
    
    res.json({ 
      success: true, 
      isFollowing: false,
      followerCount
    });
    
  } catch (error) {
    console.error('Unfollow error:', error);
    res.status(500).json({ error: 'Error unfollowing user' });
  }
}; 