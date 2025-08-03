// models/Place.js
const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  // Google Places API data
  placeId: {
    type: String,
    required: true,
    unique: true, // Ensure no duplicate places
    index: true
  },
  
  name: {
    type: String,
    required: true,
    trim: true
  },
  
  formattedAddress: {
    type: String,
    required: true
  },
  
  // Geographic coordinates
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  
  // Additional Google Places data
  types: [{
    type: String
  }],
  
  // Statistics
  postsCount: {
    type: Number,
    default: 0
  },
  
  // For generating clean URLs
  slug: {
    type: String,
    index: true
  }
  
}, { 
  timestamps: true // Adds createdAt and updatedAt
});

// Create indexes for better query performance
placeSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });
placeSchema.index({ name: 'text', formattedAddress: 'text' });

// Pre-save middleware to generate slug
placeSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    // Create URL-friendly slug from name
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .trim();
  }
  next();
});

// Static method to find or create place
placeSchema.statics.findOrCreate = async function(placeData) {
  try {
    // Try to find existing place by placeId
    let place = await this.findOne({ placeId: placeData.placeId });
    
    if (!place) {
      // Create new place if it doesn't exist
      place = new this({
        placeId: placeData.placeId,
        name: placeData.name,
        formattedAddress: placeData.formattedAddress,
        coordinates: {
          lat: placeData.lat,
          lng: placeData.lng
        },
        types: placeData.types || []
      });
      
      await place.save();
      console.log(`Created new place: ${place.name}`);
    }
    
    return place;
  } catch (error) {
    console.error('Error in findOrCreate place:', error);
    throw error;
  }
};

// Instance method to increment posts count
placeSchema.methods.incrementPostsCount = async function() {
  this.postsCount += 1;
  return await this.save();
};

// Instance method to decrement posts count
placeSchema.methods.decrementPostsCount = async function() {
  if (this.postsCount > 0) {
    this.postsCount -= 1;
    return await this.save();
  }
};

module.exports = mongoose.model('Place', placeSchema); 