const { TwitterApi } = require('twitter-api-v2');

// Twitter API configuration
const twitterConfig = {
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  callbackUrl: process.env.TWITTER_CALLBACK_URL || 'http://localhost:3000/twitter/callback'
};

// Check if Twitter credentials are available
const hasTwitterCredentials = () => {
  return !!(twitterConfig.appKey && twitterConfig.appSecret && 
           twitterConfig.appKey !== 'your-api-key-here' && 
           twitterConfig.appSecret !== 'your-api-secret-here');
};

// Create Twitter client for app-only auth (for OAuth flow initiation)
let twitterClient = null;
if (hasTwitterCredentials()) {
  twitterClient = new TwitterApi({
    appKey: twitterConfig.appKey,
    appSecret: twitterConfig.appSecret,
  });
}

// Create user-specific Twitter client
function createUserTwitterClient(accessToken, accessTokenSecret) {
  if (!hasTwitterCredentials()) {
    throw new Error('Twitter API credentials not configured');
  }
  
  return new TwitterApi({
    appKey: twitterConfig.appKey,
    appSecret: twitterConfig.appSecret,
    accessToken: accessToken,
    accessSecret: accessTokenSecret,
  });
}

// Generate OAuth URL for user authentication
async function generateOAuthUrl() {
  try {
    if (!hasTwitterCredentials()) {
      throw new Error('Twitter API credentials not configured');
    }
    
    if (!twitterClient) {
      throw new Error('Twitter client not initialized');
    }
    
    const authLink = await twitterClient.generateAuthLink(twitterConfig.callbackUrl);
    return {
      url: authLink.url,
      oauth_token: authLink.oauth_token,
      oauth_token_secret: authLink.oauth_token_secret
    };
  } catch (error) {
    console.error('Error generating Twitter OAuth URL:', error);
    throw error;
  }
}

// Exchange OAuth tokens for access tokens
async function getAccessToken(oauth_token, oauth_token_secret, oauth_verifier) {
  try {
    if (!hasTwitterCredentials()) {
      throw new Error('Twitter API credentials not configured');
    }
    
    const tempClient = new TwitterApi({
      appKey: twitterConfig.appKey,
      appSecret: twitterConfig.appSecret,
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    });
    
    const { accessToken, accessSecret, screenName, userId } = await tempClient.login(oauth_verifier);
    
    return {
      accessToken,
      accessSecret,
      screenName,
      userId
    };
  } catch (error) {
    console.error('Error getting Twitter access token:', error);
    throw error;
  }
}

// Tweet with image
async function tweetWithImage(accessToken, accessTokenSecret, text, imagePath) {
  try {
    const userClient = createUserTwitterClient(accessToken, accessTokenSecret);
    
    // Upload image first
    const mediaId = await userClient.v1.uploadMedia(imagePath);
    
    // Tweet with the uploaded image
    const tweet = await userClient.v2.tweet({
      text: text,
      media: { media_ids: [mediaId] }
    });
    
    return tweet;
  } catch (error) {
    console.error('Error tweeting with image:', error);
    throw error;
  }
}

// Tweet text only
async function tweet(accessToken, accessTokenSecret, text) {
  try {
    const userClient = createUserTwitterClient(accessToken, accessTokenSecret);
    const tweetResponse = await userClient.v2.tweet({ text });
    return tweetResponse;
  } catch (error) {
    console.error('Error tweeting:', error);
    throw error;
  }
}

// Get user profile info
async function getUserProfile(accessToken, accessTokenSecret) {
  try {
    const userClient = createUserTwitterClient(accessToken, accessTokenSecret);
    const user = await userClient.v2.me({
      'user.fields': ['profile_image_url', 'public_metrics']
    });
    return user.data;
  } catch (error) {
    console.error('Error getting Twitter user profile:', error);
    throw error;
  }
}

module.exports = {
  twitterConfig,
  hasTwitterCredentials,
  generateOAuthUrl,
  getAccessToken,
  tweetWithImage,
  tweet,
  getUserProfile,
  createUserTwitterClient
};