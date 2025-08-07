const mongoose = require('mongoose');

const twitterAccountSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // One Twitter account per user
  },
  twitterId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    required: true
  },
  handle: {
    type: String,
    required: true
  },
  accessToken: {
    type: String,
    required: true
  },
  accessTokenSecret: {
    type: String,
    required: true
  },
  profileImageUrl: {
    type: String
  },
  lastTweetAt: {
    type: Date,
    default: null
  },
  tweetCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  connectedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient lookups (user index is already created by unique: true above)

// Method to check if user can tweet (rate limiting)
twitterAccountSchema.methods.canTweet = function() {
  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
  
  // Allow if no recent tweet or last tweet was more than 1 minute ago
  return !this.lastTweetAt || this.lastTweetAt < oneMinuteAgo;
};

// Method to update tweet stats
twitterAccountSchema.methods.recordTweet = function() {
  this.lastTweetAt = new Date();
  this.tweetCount += 1;
  return this.save();
};

module.exports = mongoose.model('TwitterAccount', twitterAccountSchema);