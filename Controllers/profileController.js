const User = require("../models/User");
const Post = require("../models/Post");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Get user profile page
exports.getUserProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;

    // Find the target user
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).render("error", { message: "User not found" });
    }

    // Get follower and following counts using new embedded object structure
    const followerCount = targetUser.followers
      ? targetUser.followers.length
      : 0;
    const followingCount = targetUser.following
      ? targetUser.following.length
      : 0;

    // Get user's posts (latest 12)
    const posts = await Post.find({ user: targetUser._id })
      .sort({ createdAt: -1 })
      .limit(12)
      .populate("user", "username avatar");

    const postsCount = await Post.countDocuments({ user: targetUser._id });

    // Check if current user is following this user (using new embedded structure)
    const isFollowing = targetUser.followers
      ? targetUser.followers.some(
          (follower) => follower.user.toString() === currentUserId.toString()
        )
      : false;

    // Check if this is the current user's own profile
    const isOwnProfile = currentUserId.toString() === targetUser._id.toString();

    res.render("profile/profile", {
      targetUser,
      currentUser: req.user,
      isOwnProfile,
      isFollowing,
      followerCount,
      followingCount,
      postsCount,
      posts,
      timeAgo:
        req.app.locals.timeAgo ||
        ((date) => {
          const now = new Date();
          const postDate = new Date(date);
          const diffInSeconds = Math.floor((now - postDate) / 1000);

          if (diffInSeconds < 60) return "now";
          else if (diffInSeconds < 3600)
            return `${Math.floor(diffInSeconds / 60)}m`;
          else if (diffInSeconds < 86400)
            return `${Math.floor(diffInSeconds / 3600)}h`;
          else if (diffInSeconds < 604800)
            return `${Math.floor(diffInSeconds / 86400)}d`;
          else return `${Math.floor(diffInSeconds / 604800)}w`;
        }),
    });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).render("error", { message: "Error loading profile" });
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
      return res.status(404).json({ error: "User not found" });
    }

    // Can't follow yourself
    if (currentUserId.toString() === targetUser._id.toString()) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    // Check if already following using new embedded structure
    const currentUser = await User.findById(currentUserId);
    const alreadyFollowing = currentUser.following
      ? currentUser.following.some(
          (follow) => follow.user.toString() === targetUser._id.toString()
        )
      : false;

    if (alreadyFollowing) {
      return res.status(400).json({ error: "Already following this user" });
    }

    const followedAt = new Date();

    // Add to following array of current user (embedded object with followedAt)
    await User.findByIdAndUpdate(currentUserId, {
      $addToSet: {
        following: {
          user: targetUser._id,
          followedAt: followedAt,
        },
      },
    });

    // Add to followers array of target user (embedded object with followedAt)
    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: {
        followers: {
          user: currentUserId,
          followedAt: followedAt,
        },
      },
    });

    // Get updated follower count
    const updatedTargetUser = await User.findById(targetUser._id);
    const followerCount = updatedTargetUser.followers
      ? updatedTargetUser.followers.length
      : 0;

    res.json({
      success: true,
      isFollowing: true,
      followerCount,
    });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ error: "Error following user" });
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
      return res.status(404).json({ error: "User not found" });
    }

    // Remove from following array of current user (using embedded object structure)
    await User.findByIdAndUpdate(currentUserId, {
      $pull: {
        following: {
          user: targetUser._id,
        },
      },
    });

    // Remove from followers array of target user (using embedded object structure)
    await User.findByIdAndUpdate(targetUser._id, {
      $pull: {
        followers: {
          user: currentUserId,
        },
      },
    });

    // Get updated follower count
    const updatedTargetUser = await User.findById(targetUser._id);
    const followerCount = updatedTargetUser.followers
      ? updatedTargetUser.followers.length
      : 0;

    res.json({
      success: true,
      isFollowing: false,
      followerCount,
    });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ error: "Error unfollowing user" });
  }
};

// Get user insights - posts per day and followers per day for last 30 days
exports.getUserInsights = async (req, res) => {
  try {
    const { username } = req.params;
    const currentUserId = req.user._id;

    // Find the target user
    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if current user is the owner of this profile
    const isOwnProfile = currentUserId.toString() === targetUser._id.toString();
    if (!isOwnProfile) {
      return res
        .status(403)
        .json({ error: "Access denied. You can only view your own insights." });
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregation for posts per day (last 30 days)
    const postsPerDay = await Post.aggregate([
      {
        $match: {
          user: targetUser._id,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $addFields: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
        },
      },
      {
        $group: {
          _id: "$day",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Aggregation for followers per day (last 30 days)
    const followersPerDay = await User.aggregate([
      {
        $match: { _id: targetUser._id },
      },
      {
        $unwind: "$followers",
      },
      {
        $match: {
          "followers.followedAt": { $gte: thirtyDaysAgo },
        },
      },
      {
        $addFields: {
          day: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$followers.followedAt",
            },
          },
        },
      },
      {
        $group: {
          _id: "$day",
          gained: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // If this is a JSON request, return JSON data
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.json({
        success: true,
        data: {
          postsPerDay,
          followersPerDay,
        },
      });
    }

    // Otherwise render the insights view
    res.render("profile/insights", {
      targetUser,
      currentUser: req.user,
      postsPerDay: JSON.stringify(postsPerDay),
      followersPerDay: JSON.stringify(followersPerDay),
    });
  } catch (error) {
    console.error("Insights error:", error);
    if (req.headers.accept && req.headers.accept.includes("application/json")) {
      return res.status(500).json({ error: "Error fetching insights" });
    }
    res.status(500).render("error", { message: "Error loading insights" });
  }
};
