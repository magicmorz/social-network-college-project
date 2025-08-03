// Controllers/placeController.js
const mongoose = require('mongoose');
const Place = require('../models/Place');
const Post = require('../models/Post');

// Show place page with map and posts
exports.getPlacePage = async (req, res) => {
  try {
    const { placeId } = req.params;
    
    // Find the place by placeId, slug, or MongoDB ObjectId
    const place = await Place.findOne({ 
      $or: [
        { placeId: placeId },
        { slug: placeId },
        { _id: mongoose.Types.ObjectId.isValid(placeId) ? placeId : null }
      ]
    });
    
    if (!place) {
      return res.status(404).render('error', { 
        message: 'Place not found',
        currentUser: req.user 
      });
    }
    
    // Get posts from this place
    const posts = await Post.find({ place: place._id })
      .populate('user', 'username avatar isVerified')
      .populate('place')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.render('place/place', {
      place,
      posts,
      currentUser: req.user,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
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
    console.error('Place page error:', error);
    res.status(500).render('error', { 
      message: 'Error loading place page',
      currentUser: req.user 
    });
  }
};

// Get place data as JSON for API requests
exports.getPlaceJson = async (req, res) => {
  try {
    const { placeId } = req.params;
    
    const place = await Place.findOne({
      $or: [
        { placeId: placeId },
        { slug: placeId },
        { _id: mongoose.Types.ObjectId.isValid(placeId) ? placeId : null }
      ]
    });
    
    if (!place) {
      return res.status(404).json({ error: 'Place not found' });
    }
    
    res.json({ place });
    
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ error: 'Failed to fetch place' });
  }
};

// Search places (for autocomplete or search functionality)
exports.searchPlaces = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json({ places: [] });
    }
    
    const places = await Place.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { formattedAddress: { $regex: query, $options: 'i' } }
      ]
    })
    .sort({ postsCount: -1 }) // Sort by popularity
    .limit(10);
    
    res.json({ places });
    
  } catch (error) {
    console.error('Error searching places:', error);
    res.status(500).json({ error: 'Failed to search places' });
  }
}; 