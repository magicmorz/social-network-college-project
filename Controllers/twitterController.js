const TwitterAccount = require('../models/TwitterAccount');
const { hasTwitterCredentials, generateOAuthUrl, getAccessToken, getUserProfile, tweetWithImage, tweet } = require('../config/twitter');
const path = require('path');
const fs = require('fs');

// Initiate Twitter OAuth
exports.initiateOAuth = async (req, res) => {
  try {
    console.log('Twitter OAuth initiation - Session data:', {
      userId: req.session?.userId,
      hasUser: !!req.user,
      userCache: !!req.session?.userCache,
      sessionID: req.sessionID
    });
    
    if (!hasTwitterCredentials()) {
      console.error('Twitter API credentials not properly configured. Please check TWITTER_API_KEY and TWITTER_API_SECRET in .env file');
      return res.status(503).json({ 
        success: false, 
        error: 'Twitter integration is not configured. Please contact the administrator.' 
      });
    }
    
    // Ensure user is authenticated - but with better debugging
    if (!req.user || !req.user._id) {
      console.error('User not authenticated in Twitter OAuth initiation. Session data:', {
        sessionId: req.sessionID,
        userId: req.session?.userId,
        hasUser: !!req.user,
        headers: req.headers
      });
      return res.status(401).json({ 
        success: false, 
        error: 'User not authenticated. Please log in and try again.' 
      });
    }
    
    const authData = await generateOAuthUrl();
    
    // Store OAuth tokens in session for callback
    req.session.twitter_oauth_token = authData.oauth_token;
    req.session.twitter_oauth_token_secret = authData.oauth_token_secret;
    req.session.twitter_oauth_user_id = req.user._id.toString(); // Store user ID for callback
    // Also store with user ID as backup
    req.session[`twitter_oauth_${req.user._id}`] = {
      token: authData.oauth_token,
      secret: authData.oauth_token_secret,
      userId: req.user._id.toString(),
      timestamp: Date.now()
    };
    await req.session.save(); // Force session save and wait for it
    
    res.json({ 
      success: true, 
      authUrl: authData.url 
    });
  } catch (error) {
    console.error('Twitter OAuth initiation error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate Twitter authentication' 
    });
  }
};

// Handle Twitter OAuth callback
exports.handleOAuthCallback = async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.query;
    let oauth_token_secret = req.session.twitter_oauth_token_secret;
    let userId = req.session.twitter_oauth_user_id || req.user?._id?.toString();
    
    // Try to get from user-specific key if not found
    if (!oauth_token_secret || !userId) {
      // Search through session for matching OAuth token
      for (const key in req.session) {
        if (key.startsWith('twitter_oauth_') && key !== 'twitter_oauth_token' && key !== 'twitter_oauth_token_secret' && key !== 'twitter_oauth_user_id') {
          const userOAuth = req.session[key];
          if (userOAuth && userOAuth.token === oauth_token) {
            oauth_token_secret = userOAuth.secret;
            userId = userOAuth.userId;
            break;
          }
        }
      }
    }
    
    console.log('OAuth callback received:', {
      oauth_token: !!oauth_token,
      oauth_verifier: !!oauth_verifier,
      oauth_token_secret: !!oauth_token_secret,
      userId: userId,
      sessionId: req.sessionID,
      hasUser: !!req.user
    });
    
    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
      // Send error page that closes popup and notifies parent
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Twitter Connection Failed</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #fff5f5; 
            }
            .error { color: #dc3545; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Invalid OAuth Callback</h2>
            <p>Missing required parameters. Please try again.</p>
          </div>
          <script>
            // Notify parent window and close popup
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ 
                  type: 'TWITTER_AUTH_ERROR', 
                  data: { error: 'Invalid callback parameters' } 
                }, window.location.origin);
              }
            } catch (e) {
              console.log('Could not communicate with parent window');
            }
            
            // Auto-close after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `);
    }
    
    // Exchange for access tokens
    const accessData = await getAccessToken(oauth_token, oauth_token_secret, oauth_verifier);
    
    // Get user profile info
    const userProfile = await getUserProfile(accessData.accessToken, accessData.accessSecret);
    
    // Check if this Twitter account is already connected to another user
    const existingAccount = await TwitterAccount.findOne({ 
      twitterId: accessData.userId 
    });
    
    if (existingAccount && existingAccount.user.toString() !== userId) {
      // Send error page that closes popup and notifies parent
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Twitter Connection Failed</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 50px; 
              background: #fff5f5; 
            }
            .error { color: #dc3545; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="error">
            <h2>❌ Account Already Connected</h2>
            <p>This Twitter account is already connected to another user.</p>
          </div>
          <script>
            // Notify parent window and close popup
            try {
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({ 
                  type: 'TWITTER_AUTH_ERROR', 
                  data: { error: 'Account already connected to another user' } 
                }, window.location.origin);
              }
            } catch (e) {
              console.log('Could not communicate with parent window');
            }
            
            // Auto-close after 3 seconds
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body>
        </html>
      `);
    }
    
    // Remove any existing Twitter account for this user
    await TwitterAccount.findOneAndDelete({ user: userId });
    
    // Ensure we have a user ID
    if (!userId) {
      throw new Error('User ID not found in session. Please try logging in again.');
    }
    
    // Create new Twitter account connection
    const twitterAccount = new TwitterAccount({
      user: userId,
      twitterId: accessData.userId,
      username: userProfile.name,
      handle: accessData.screenName,
      accessToken: accessData.accessToken,
      accessTokenSecret: accessData.accessSecret,
      profileImageUrl: userProfile.profile_image_url
    });
    
    await twitterAccount.save();
    
    // Clean up session
    delete req.session.twitter_oauth_token;
    delete req.session.twitter_oauth_token_secret;
    delete req.session.twitter_oauth_user_id;
    if (userId) {
      delete req.session[`twitter_oauth_${userId}`];
    }
    
    // Send success page that closes popup and notifies parent
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Twitter Connected</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f0f8ff; 
          }
          .success { color: #28a745; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="success">
          <h2>✅ Twitter Account Connected!</h2>
          <p>You can close this window now.</p>
        </div>
        <script>
          // Notify parent window and close popup
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ 
                type: 'TWITTER_AUTH_SUCCESS', 
                data: { connected: true } 
              }, window.location.origin);
            }
          } catch (e) {
            console.log('Could not communicate with parent window');
          }
          
          // Auto-close after 2 seconds
          setTimeout(() => {
            window.close();
          }, 2000);
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Twitter OAuth callback error:', error);
    
    // Send error page that closes popup and notifies parent
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Twitter Connection Failed</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #fff5f5; 
          }
          .error { color: #dc3545; font-size: 18px; }
        </style>
      </head>
      <body>
        <div class="error">
          <h2>❌ Twitter Connection Failed</h2>
          <p>Please try again. You can close this window.</p>
        </div>
        <script>
          // Notify parent window and close popup
          try {
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({ 
                type: 'TWITTER_AUTH_ERROR', 
                data: { error: 'Connection failed' } 
              }, window.location.origin);
            }
          } catch (e) {
            console.log('Could not communicate with parent window');
          }
          
          // Auto-close after 3 seconds
          setTimeout(() => {
            window.close();
          }, 3000);
        </script>
      </body>
      </html>
    `);
  }
};

// Get user's Twitter connection status
exports.getConnectionStatus = async (req, res) => {
  try {
    const twitterAccount = await TwitterAccount.findOne({ 
      user: req.user._id, 
      isActive: true 
    });
    
    if (twitterAccount) {
      res.json({
        connected: true,
        handle: twitterAccount.handle,
        username: twitterAccount.username,
        profileImageUrl: twitterAccount.profileImageUrl,
        connectedAt: twitterAccount.connectedAt
      });
    } else {
      res.json({ connected: false });
    }
  } catch (error) {
    console.error('Error getting Twitter connection status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get connection status' 
    });
  }
};

// Disconnect Twitter account
exports.disconnectAccount = async (req, res) => {
  try {
    await TwitterAccount.findOneAndDelete({ user: req.user._id });
    
    res.json({ 
      success: true, 
      message: 'Twitter account disconnected successfully' 
    });
  } catch (error) {
    console.error('Error disconnecting Twitter account:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to disconnect Twitter account' 
    });
  }
};

// Share post to Twitter
exports.sharePostToTwitter = async (req, res) => {
  try {
    const { postId, caption } = req.body;
    
    // Get user's Twitter account
    const twitterAccount = await TwitterAccount.findOne({ 
      user: req.user._id, 
      isActive: true 
    });
    
    if (!twitterAccount) {
      return res.status(400).json({ 
        success: false, 
        error: 'No Twitter account connected' 
      });
    }
    
    // Check rate limiting
    if (!twitterAccount.canTweet()) {
      return res.status(429).json({ 
        success: false, 
        error: 'Please wait before sharing another post to Twitter' 
      });
    }
    
    // Get the post to find the image
    const Post = require('../models/Post');
    const post = await Post.findById(postId);
    
    if (!post || post.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ 
        success: false, 
        error: 'Post not found' 
      });
    }
    
    // Prepare tweet text (truncate to 280 characters if needed)
    let tweetText = caption || '';
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
    }
    
    // Get image path
    const imagePath = path.join(__dirname, '..', post.image);
    
    let tweetResult;
    
    // Tweet with image if it exists
    if (fs.existsSync(imagePath)) {
      tweetResult = await tweetWithImage(
        twitterAccount.accessToken,
        twitterAccount.accessTokenSecret,
        tweetText,
        imagePath
      );
    } else {
      // Tweet text only if image doesn't exist
      tweetResult = await tweet(
        twitterAccount.accessToken,
        twitterAccount.accessTokenSecret,
        tweetText
      );
    }
    
    // Update Twitter account stats
    await twitterAccount.recordTweet();
    
    res.json({ 
      success: true, 
      tweetId: tweetResult.data.id,
      message: 'Post shared to Twitter successfully' 
    });
    
  } catch (error) {
    console.error('Error sharing post to Twitter:', error);
    
    // Handle specific Twitter API errors
    if (error.code === 429) {
      res.status(429).json({ 
        success: false, 
        error: 'Twitter rate limit reached. Please try again later.' 
      });
    } else if (error.code === 401) {
      res.status(401).json({ 
        success: false, 
        error: 'Twitter authentication expired. Please reconnect your account.' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to share post to Twitter' 
      });
    }
  }
};