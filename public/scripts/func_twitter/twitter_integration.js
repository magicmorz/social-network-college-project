// Twitter Integration JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('Twitter integration script loading...');
  
  const connectXBtn = document.getElementById('connectXBtn');
  const connectXLabel = document.getElementById('connectXLabel');
  const shareToTwitterSection = document.getElementById('shareToTwitterSection');
  const shareToTwitterCheckbox = document.getElementById('shareToTwitter');
  
  // Settings menu elements
  const twitterSettingsBtn = document.getElementById('twitterSettingsBtn');
  const twitterSettingsMenu = document.getElementById('twitterSettingsMenu');
  const twitterBackBtn = document.getElementById('twitterBackBtn');
  const moreMenu = document.getElementById('moreMenu');
  const connectTwitterFromSettings = document.getElementById('connectTwitterFromSettings');
  const disconnectTwitterBtn = document.getElementById('disconnectTwitterBtn');
  const twitterConnectionInfo = document.getElementById('twitterConnectionInfo');
  const twitterNotConnected = document.getElementById('twitterNotConnected');
  
  let twitterConnectionStatus = null;
  let lastPostShareTime = null;
  
  // Load Twitter connection status on page load
  loadTwitterConnectionStatus();
  
  // Connect/Disconnect button click handler
  if (connectXBtn) {
    connectXBtn.addEventListener('click', handleConnectXClick);
  }
  
  // Settings menu event listeners
  if (twitterSettingsBtn) {
    twitterSettingsBtn.addEventListener('click', showTwitterSettings);
  }
  
  if (twitterBackBtn) {
    twitterBackBtn.addEventListener('click', hideTwitterSettings);
  }
  
  if (connectTwitterFromSettings) {
    connectTwitterFromSettings.addEventListener('click', connectToTwitter);
  }
  
  if (disconnectTwitterBtn) {
    disconnectTwitterBtn.addEventListener('click', handleDisconnectFromSettings);
  }
  
  // Load Twitter connection status
  async function loadTwitterConnectionStatus() {
    try {
      const response = await fetch('/twitter/status', {
        credentials: 'same-origin'
      });
      const data = await response.json();
      
      twitterConnectionStatus = data;
      updateConnectButton(data);
      updatePostFormTwitterOption(data);
      updateTwitterSettingsMenu(data);
      
    } catch (error) {
      console.error('Failed to load Twitter connection status:', error);
    }
  }
  
  // Update Connect to X button based on connection status
  function updateConnectButton(status) {
    if (!connectXBtn || !connectXLabel) return;
    
    if (status.connected) {
      connectXLabel.textContent = `@${status.handle}`;
      connectXBtn.title = `Connected as @${status.handle}. Click to disconnect.`;
      connectXBtn.classList.add('twitter-connected');
    } else {
      connectXLabel.textContent = 'Connect to X';
      connectXBtn.title = 'Connect your X (Twitter) account';
      connectXBtn.classList.remove('twitter-connected');
    }
  }
  
  // Update post form Twitter sharing option
  function updatePostFormTwitterOption(status) {
    if (!shareToTwitterSection) return;
    
    if (status.connected) {
      shareToTwitterSection.style.display = 'block';
    } else {
      shareToTwitterSection.style.display = 'none';
      if (shareToTwitterCheckbox) {
        shareToTwitterCheckbox.checked = false;
      }
    }
  }
  
  // Update Twitter settings menu
  function updateTwitterSettingsMenu(status) {
    if (!twitterConnectionInfo || !twitterNotConnected) return;
    
    if (status.connected) {
      // Show connected state
      twitterConnectionInfo.style.display = 'block';
      twitterNotConnected.style.display = 'none';
      
      // Update profile info
      const twitterUsername = document.getElementById('twitterUsername');
      const twitterHandle = document.getElementById('twitterHandle');
      const twitterProfileImage = document.getElementById('twitterProfileImage');
      
      if (twitterUsername) twitterUsername.textContent = status.username;
      if (twitterHandle) twitterHandle.textContent = `@${status.handle}`;
      if (twitterProfileImage && status.profileImageUrl) {
        twitterProfileImage.src = status.profileImageUrl;
      }
    } else {
      // Show not connected state
      twitterConnectionInfo.style.display = 'none';
      twitterNotConnected.style.display = 'block';
    }
  }
  
  // Show Twitter settings menu
  function showTwitterSettings(e) {
    e.preventDefault();
    if (moreMenu && twitterSettingsMenu) {
      moreMenu.style.display = 'none';
      twitterSettingsMenu.style.display = 'block';
      updateTwitterSettingsMenu(twitterConnectionStatus || { connected: false });
    }
  }
  
  // Hide Twitter settings menu
  function hideTwitterSettings(e) {
    e.preventDefault();
    if (moreMenu && twitterSettingsMenu) {
      twitterSettingsMenu.style.display = 'none';
      moreMenu.style.display = 'block';
    }
  }
  
  // Handle disconnect from settings
  async function handleDisconnectFromSettings(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to disconnect your Twitter account?')) {
      await disconnectTwitter();
      updateTwitterSettingsMenu({ connected: false });
    }
  }
  
  // Handle Connect to X button click
  async function handleConnectXClick(e) {
    e.preventDefault();
    
    if (twitterConnectionStatus && twitterConnectionStatus.connected) {
      // Show disconnect confirmation
      if (confirm(`Disconnect @${twitterConnectionStatus.handle} from your account?`)) {
        await disconnectTwitter();
      }
    } else {
      // Initiate connection
      await connectToTwitter();
    }
  }
  
  // Connect to Twitter
  async function connectToTwitter() {
    try {
      connectXBtn.disabled = true;
      connectXLabel.textContent = 'Connecting...';
      
      const response = await fetch('/twitter/auth', {
        credentials: 'same-origin' // Include cookies with the request
      });
      const data = await response.json();
      
      if (data.success) {
        // Open Twitter OAuth in popup
        const popup = window.open(
          data.authUrl,
          'twitterAuth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        // Listen for messages from the popup
        const messageHandler = (event) => {
          // Ensure the message is from our domain
          if (event.origin !== window.location.origin) {
            return;
          }
          
          if (event.data.type === 'TWITTER_AUTH_SUCCESS') {
            // Success! Update the UI
            window.removeEventListener('message', messageHandler);
            loadTwitterConnectionStatus();
            showToast('Twitter account connected successfully!', 'success');
          } else if (event.data.type === 'TWITTER_AUTH_ERROR') {
            // Error occurred
            window.removeEventListener('message', messageHandler);
            showToast('Failed to connect Twitter account. Please try again.', 'error');
          }
        };
        
        window.addEventListener('message', messageHandler);
        
        // Fallback: Poll for popup closure (in case message doesn't work)
        const pollTimer = setInterval(() => {
          if (popup.closed) {
            clearInterval(pollTimer);
            window.removeEventListener('message', messageHandler);
            // Reload connection status after popup closes (fallback)
            setTimeout(() => {
              loadTwitterConnectionStatus();
            }, 1000);
          }
        }, 1000);
        
      } else {
        // Handle specific error cases
        if (response.status === 503) {
          showToast('Twitter integration is not configured. Please contact the administrator.', 'error');
        } else {
          showToast(data.error || 'Failed to initiate Twitter connection', 'error');
        }
        throw new Error(data.error || 'Failed to initiate Twitter connection');
      }
      
    } catch (error) {
      console.error('Twitter connection error:', error);
      showToast('Failed to connect to Twitter. Please try again.', 'error');
    } finally {
      connectXBtn.disabled = false;
    }
  }
  
  // Disconnect Twitter
  async function disconnectTwitter() {
    try {
      connectXBtn.disabled = true;
      connectXLabel.textContent = 'Disconnecting...';
      
      const response = await fetch('/twitter/disconnect', {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      
      const data = await response.json();
      
      if (data.success) {
        twitterConnectionStatus = { connected: false };
        updateConnectButton(twitterConnectionStatus);
        updatePostFormTwitterOption(twitterConnectionStatus);
        updateTwitterSettingsMenu(twitterConnectionStatus);
        showToast('Twitter account disconnected successfully', 'success');
      } else {
        throw new Error(data.error || 'Failed to disconnect Twitter account');
      }
      
    } catch (error) {
      console.error('Twitter disconnection error:', error);
      showToast('Failed to disconnect Twitter account', 'error');
    } finally {
      connectXBtn.disabled = false;
    }
  }
  

  
  // Share post to Twitter function (called from enhanced_modal.js)
  window.sharePostToTwitter = async function(postId, caption) {
    try {
      // Check rate limiting (1 post per minute)
      const now = Date.now();
      if (lastPostShareTime && (now - lastPostShareTime) < 60000) {
        showToast('Please wait before sharing another post to Twitter', 'warning');
        return false;
      }
      
      const response = await fetch('/twitter/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          postId: postId,
          caption: caption
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        lastPostShareTime = now;
        showToast('Post shared to Twitter successfully!', 'success');
        return true;
      } else {
        if (response.status === 429) {
          showToast('Twitter rate limit reached. Please try again later.', 'warning');
        } else if (response.status === 401) {
          showToast('Twitter authentication expired. Please reconnect your account.', 'error');
          twitterConnectionStatus = { connected: false };
          updateConnectButton(twitterConnectionStatus);
          updatePostFormTwitterOption(twitterConnectionStatus);
        } else {
          showToast(data.error || 'Failed to share post to Twitter', 'error');
        }
        return false;
      }
      
    } catch (error) {
      console.error('Error sharing post to Twitter:', error);
      showToast('Failed to share post to Twitter', 'error');
      return false;
    }
  };
  
  // Show toast notification
  function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `twitter-toast twitter-toast-${type}`;
    toast.textContent = message;
    
    // Add to page
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }
  

});