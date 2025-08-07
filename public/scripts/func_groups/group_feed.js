/**
 * GROUP FEED FUNCTIONALITY
 * 
 * This script manages the display and interaction with group-specific content feeds.
 * It provides a specialized view for posts within specific groups, separate from
 * the main home feed that shows all posts.
 * 
 * CORE FEATURES:
 * - Group-specific post loading and display
 * - Seamless navigation between all posts and group feeds
 * - Post interaction (likes, comments, sharing)
 * - Responsive post rendering with proper formatting
 * - Error handling and loading states
 * 
 * UI/UX CONSIDERATIONS:
 * - Loading indicators during data fetching
 * - Empty state handling (no posts in group)
 * - Back navigation to main feed
 * - Consistent post styling with main feed
 * - Real-time interaction feedback
 * 
 * INTEGRATION POINTS:
 * - Works with existing post interaction systems
 * - Integrates with group navigation components
 * - Connects to backend API for group content
 * - Maintains consistency with main feed functionality
 */

// public/scripts/func_groups/group_feed.js

/**
 * MAIN INITIALIZATION
 * Set up all group feed functionality when the page loads.
 * Uses event delegation and caching for optimal performance.
 */
document.addEventListener('DOMContentLoaded', () => {
  
  // ═══════════════════════════════════════════════════════════════════
  // NAVIGATION FUNCTIONS
  // Handle switching between different feed views (all posts vs group posts)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * SHOW ALL POSTS (DEFAULT FEED)
   * Returns user to the main feed showing posts from all groups and users.
   * Provides loading feedback while navigating to prevent confusion.
   */
  function showAllPosts() {
    // Find the main posts container for loading state
    const postsContainer = document.querySelector('.d-flex.flex-column.align-items-center');
    if (postsContainer) {
      // Show loading indicator to provide immediate feedback
      postsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"></div><p>Loading posts...</p></div>';
    }
    
    // Navigate to home page (which shows all posts by default)
    // This is more reliable than trying to reload content via AJAX
    window.location.href = '/home';
  }
  

  

  // ═══════════════════════════════════════════════════════════════════
  // GROUP FEED LOADING AND DISPLAY
  // Core functionality for fetching and rendering group-specific content
  // ═══════════════════════════════════════════════════════════════════

  /**
   * LOAD AND DISPLAY GROUP POSTS
   * Fetches posts for a specific group and renders them in a dedicated feed view.
   * Handles all aspects of the group feed including loading states, errors, and empty states.
   * 
   * @param {string} groupId - The ID of the group whose posts to load
   * @param {string} groupName - The name of the group (for display purposes)
   */
  async function loadGroupPosts(groupId, groupName) {
    
    // Find the main posts container (same container used by main feed)
    const postsContainer = document.querySelector('.d-flex.flex-column.align-items-center');
    if (!postsContainer) {
      console.error('Posts container not found');
      return;
    }

    // ═══ SHOW LOADING STATE ═══
    // Provide immediate visual feedback that content is loading
    postsContainer.innerHTML = `
      <div class="text-center p-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading posts from ${groupName}...</p>
      </div>
    `;

    try {
      // ═══ FETCH GROUP POSTS FROM API ═══
      const response = await fetch(`/api/group/${groupId}/posts`);
      
      // Basic response validation
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Ensure we received JSON response (not HTML error page)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      // Parse the posts data
      const posts = await response.json();
      
      // ═══ HANDLE EMPTY GROUP STATE ═══
      if (posts.length === 0) {
        // Show encouraging empty state with call-to-action
        postsContainer.innerHTML = `
          <div class="text-center mt-5">
            <i class="bi bi-people fs-1 text-muted"></i>
            <h5 class="text-muted mt-3">No posts in ${groupName} yet</h5>
            <p class="text-muted">Be the first to share something with this group!</p>
            <button class="btn btn-primary" onclick="document.getElementById('createBtn').click()">
              Create Post
            </button>
          </div>
        `;
        return; // Exit early for empty state
      }

      // ═══ RENDER GROUP FEED HEADER ═══
      // Clear container and add group-specific header with navigation
      postsContainer.innerHTML = `
        <div class="group-header w-100 mb-4 text-center">
          <div class="d-flex align-items-center justify-content-center mb-2">
            <!-- Back to All Posts Button -->
            <button id="backToAllPosts" class="btn btn-outline-secondary btn-sm me-3">
              <i class="bi bi-arrow-left"></i> Back to All Posts
            </button>
            <!-- Group Name and Icon -->
            <h4 class="mb-0">
              <i class="bi bi-people me-2"></i>${groupName}
            </h4>
            <!-- Show Members Button -->
            <button id="showMembersBtn" class="btn btn-outline-secondary btn-sm ms-3" onclick="showGroupMembers('${groupId}')">
              Show Members
            </button>
          </div>
          <!-- Members List Container (initially hidden) -->
          <div id="membersList" class="members-list mt-3" style="display: none;"></div>
          <!-- Post Count -->
          <p class="text-muted">${posts.length} post${posts.length !== 1 ? 's' : ''}</p>
        </div>
      `;

      // ═══ ADD BACK BUTTON FUNCTIONALITY ═══
      document.getElementById('backToAllPosts').addEventListener('click', showAllPosts);

      // ═══ RENDER ALL GROUP POSTS ═══
      // Create and append each post element to the container
      posts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
      });

      // ═══ REINITIALIZE POST INTERACTIONS ═══
      // Ensure all post buttons (like, comment, etc.) work properly
      initializePostEventListeners();

    } catch (error) {
      // ═══ HANDLE LOADING ERRORS ═══
      console.error('Error loading group posts:', error);
      
      // Show user-friendly error state with retry option
      postsContainer.innerHTML = `
        <div class="text-center mt-5">
          <i class="bi bi-exclamation-triangle fs-1 text-danger"></i>
          <h5 class="text-danger mt-3">Error loading posts</h5>
          <p class="text-muted">${error.message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">
            Try Again
          </button>
        </div>
      `;
    }
  }

  /**
   * SHOW GROUP MEMBERS
   * Fetches and displays the list of group members.
   * Toggles visibility of the members list.
   * 
   * @param {string} groupId - The ID of the group whose members to load
   */
  async function showGroupMembers(groupId) {
    const membersList = document.getElementById('membersList');
    
    // Toggle visibility
    if (membersList.style.display === 'none') {
      try {
        // Fetch group members
        const response = await fetch(`/api/group/${groupId}/members`);
        if (!response.ok) throw new Error('Failed to fetch members');
        
        const members = await response.json();
        
        // Render members list
        membersList.innerHTML = `
          <div class="card p-3">
            <h6>Members (${members.length})</h6>
            <ul class="list-group list-group-flush">
              ${members.map(member => `
                <li class="list-group-item">
                  <a href="/u/${member.username}" class="text-decoration-none">
                    ${member.username}
                  </a>
                </li>
              `).join('')}
            </ul>
          </div>
        `;
        membersList.style.display = 'block';
      } catch (error) {
        console.error('Error loading members:', error);
        membersList.innerHTML = `<div class="text-danger p-3">Error loading members</div>`;
        membersList.style.display = 'block';
      }
    } else {
      membersList.style.display = 'none';
      membersList.innerHTML = ''; // Clear content when hiding
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // POST RENDERING FUNCTIONS
  // Handle the creation of individual post elements with proper structure
  // and data attributes for interaction systems.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * CREATE POST HTML ELEMENT
   * Generates a complete, interactive post element from post data.
   * Creates identical structure to main feed posts for consistency.
   * 
   * @param {Object} post - Post data object from the API
   * @returns {HTMLElement} Complete post element ready for insertion into DOM
   */
  function createPostElement(post) {
    // Create main post container with all necessary data attributes
    const postDiv = document.createElement('div');
    postDiv.className = 'instagram-post posts-container mb-4';
    postDiv.id = `post-${post._id}`;                    // Unique identifier for post
    postDiv.setAttribute('data-type', 'picture');       // Post type for interaction systems
    postDiv.setAttribute('data-group', post.group || ''); // Group association
    postDiv.setAttribute('data-owner-id', post.user._id); // Post owner for permissions
    
    // Generate human-readable time ago string
    const timeAgo = formatTimeAgo(post.createdAt);
    
    // ═══ BUILD COMPLETE POST HTML STRUCTURE ═══
    postDiv.innerHTML = `
      <!-- POST HEADER: User info, timestamp, location -->
      <div class="d-flex align-items-center justify-content-between p-3">
        <div class="d-flex align-items-center">
          <!-- User Profile Picture -->
          <div class="profile-picture-container">
            <a href="/u/${post.user.username}">
              <img
                src="${post.user.avatar || '/avatars/default.jpg'}"
                alt="${post.user.username}"
                class="profile-img"
                style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
              />
            </a>
          </div>
          <!-- User Info and Metadata -->
          <div class="ms-2">
            <div class="d-flex align-items-center">
              <!-- Username with verification badge -->
              <div class="username-top-header fw-bold">
                <a href="/u/${post.user.username}" class="username-link text-decoration-none text-dark">
                  ${post.user.username}
                </a>
                ${post.user.isVerified ? '<span class="verified-badge"></span>' : ''}
              </div>
              <span class="text-muted mx-1">•</span>
              <!-- Time since posted -->
              <div class="time-since-posted-header text-muted small">
                ${timeAgo}
              </div>
            </div>
            <!-- Location (if provided) -->
            ${post.place ? `<div class="location-top-header text-muted small">
              <a href="/places/${post.place.placeId || post.place._id}" 
                 class="text-decoration-none text-muted hover-underline">
                <i class="bi bi-geo-alt me-1"></i>
                ${post.place.name}
              </a>
            </div>` : ''}
          </div>
        </div>
        <!-- More Options Button (three dots menu) -->
        <button class="btn btn-link text-dark more-options-btn" data-post-id="${post._id}">
          <i class="bi bi-three-dots"></i>
        </button>
      </div>

      <!-- POST IMAGE: Main content -->
      <div class="post-image">
        <img
          src="${post.image}"
          alt="Post image"
          class="w-100"
          style="max-height: 600px; object-fit: cover;"
        />
      </div>

      <!-- POST ACTIONS: Like, comment, share buttons and interactions -->
      <div class="post-actions p-3">
        <!-- Action Buttons Row -->
        <div class="d-flex align-items-center mb-2">
          <!-- Like Button -->
          <button class="btn btn-link text-dark p-0 me-3 like-btn" data-post-id="${post._id}" aria-label="Like post">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <!-- Comment Button -->
          <button class="btn btn-link text-dark p-0 me-3 comment-btn" data-post-id="${post._id}" aria-label="Comment on post">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <!-- Share Button -->
          <button class="btn btn-link text-dark p-0 me-3 share-btn" data-post-id="${post._id}" aria-label="Share">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16,6 12,2 8,6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </button>
        </div>

        <!-- LIKES DISPLAY -->
        <div class="likes-simple mb-2">
          <span class="likes-count fw-bold likes-number">
            ${post.likes ? post.likes.length : 0}
          </span>
          <span class="likes-text fw-bold"> likes</span>
        </div>

        <!-- CAPTION DISPLAY -->
        ${post.caption ? `
          <div class="caption mb-2">
            <span class="caption-username fw-bold">
              <a href="/u/${post.user.username}" class="username-link text-decoration-none text-dark">
                ${post.user.username}
              </a>
            </span>
            <span class="caption-text"> ${post.caption}</span>
          </div>
        ` : ''}

        <!-- VIEW COMMENTS SECTION -->
        <div class="view-comments mb-2">
          <button class="btn btn-link text-muted p-0 view-comments-btn" data-post-id="${post._id}">
            ${post.comments && post.comments.length > 0 
              ? `View all ${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}` 
              : 'Be the first to comment'}
          </button>
        </div>

        <!-- COMMENTS CONTAINER (initially hidden) -->
        <div class="comments-section" style="display: none;"></div>

        <!-- ADD COMMENT INTERFACE -->
        <div class="add-comment d-flex align-items-center">
          <!-- Comment Input Field -->
          <input
            type="text"
            class="form-control border-0 comment-input"
            placeholder="Add a comment..."
            data-post-id="${post._id}"
            style="background: transparent;"
          />
          <!-- Emoji Button -->
          <button class="btn btn-link text-muted p-0 ms-2 emoji-btn">
            <i class="bi bi-emoji-smile"></i>
          </button>
          <!-- Submit Comment Button (hidden by default) -->
          <button class="btn btn-link fw-bold p-0 ms-2 post-comment-btn comment-submit-btn" 
                  data-post-id="${post._id}" 
                  style="display: none; color: #0095f6;">
            Post
          </button>
        </div>

        <!-- TYPING INDICATOR (for future real-time features) -->
        <div class="typing-indicator text-muted small" style="display: none;">
          Typing...
        </div>
      </div>
    `;
    
    return postDiv;
  }

  // ═══════════════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // Helper functions for data formatting and processing
  // ═══════════════════════════════════════════════════════════════════

  /**
   * FORMAT TIME AGO
   * Converts a timestamp into a human-readable "time ago" format.
   * Uses different units (seconds, minutes, hours, days, weeks) based on duration.
   * 
   * @param {string} dateString - ISO date string from the server
   * @returns {string} Human-readable time difference (e.g., "2h", "3d", "1w")
   */
  function formatTimeAgo(dateString) {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    // Handle different time ranges with appropriate units
    if (diffInSeconds < 60) return 'now';                                    // Less than 1 minute
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;   // Less than 1 hour
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`; // Less than 1 day
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`; // Less than 1 week
    if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)}w`; // Less than 1 month
    
    // For older posts, show actual date
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // POST INTERACTION SYSTEM
  // Set up event listeners for all post interactions (likes, comments, etc.)
  // Integrates with existing post interaction functionality.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * INITIALIZE POST EVENT LISTENERS
   * Attaches event handlers to all interactive elements within posts.
   * Must be called after new posts are added to the DOM.
   * Uses event delegation pattern for dynamically created content.
   */
  function initializePostEventListeners() {
    
    // ═══ LIKE BUTTON INTERACTIONS ═══
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', handleLikeClick);
    });

    // ═══ COMMENT INPUT INTERACTIONS ═══
    // Show/hide submit button based on input content
    document.querySelectorAll('.comment-input').forEach(input => {
      input.addEventListener('input', handleCommentInputChange);  // Text changes
      input.addEventListener('keypress', handleCommentKeyPress);  // Enter key
    });

    // ═══ COMMENT SUBMIT BUTTON INTERACTIONS ═══
    document.querySelectorAll('.comment-submit-btn').forEach(btn => {
      btn.addEventListener('click', handleCommentSubmit);
    });

    // ═══ VIEW COMMENTS BUTTON INTERACTIONS ═══
    document.querySelectorAll('.view-comments-btn').forEach(btn => {
      btn.addEventListener('click', handleViewComments);
    });

    // ═══ MORE OPTIONS BUTTON INTERACTIONS ═══
    document.querySelectorAll('.more-options-btn').forEach(btn => {
      btn.addEventListener('click', handleMoreOptions);
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // Individual handlers for specific user interactions with posts.
  // These integrate with existing functionality when available.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * HANDLE LIKE BUTTON CLICK
   * Processes like/unlike actions on posts.
   * Integrates with existing like functionality if available.
   */
  function handleLikeClick(e) {
    const postId = e.currentTarget.dataset.postId;
    
    // Try to use existing like functionality from main feed
    if (window.toggleLike) {
      window.toggleLike(postId);
    } else {
      console.log(`Like clicked for post: ${postId}`);
      // Fallback: Could implement basic like functionality here
    }
  }

  /**
   * HANDLE COMMENT INPUT CHANGES
   * Shows/hides the submit button based on input content.
   * Provides visual feedback about comment readiness.
   */
  function handleCommentInputChange(e) {
    const input = e.currentTarget;
    const postId = input.dataset.postId;
    const submitBtn = document.querySelector(`.comment-submit-btn[data-post-id="${postId}"]`);
    
    // Show submit button only when there's content to submit
    if (input.value.trim()) {
      submitBtn.style.display = 'block';
    } else {
      submitBtn.style.display = 'none';
    }
  }

  /**
   * HANDLE COMMENT INPUT KEY PRESS
   * Allows submitting comments by pressing Enter key.
   * Provides keyboard accessibility for comment submission.
   */
  function handleCommentKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      const postId = e.currentTarget.dataset.postId;
      submitComment(postId);
    }
  }

  /**
   * HANDLE COMMENT SUBMIT BUTTON CLICK
   * Processes comment submission when submit button is clicked.
   */
  function handleCommentSubmit(e) {
    const postId = e.currentTarget.dataset.postId;
    submitComment(postId);
  }

  /**
   * HANDLE VIEW COMMENTS BUTTON CLICK
   * Expands/collapses the comments section for a post.
   * Integrates with existing comments functionality if available.
   */
  function handleViewComments(e) {
    const postId = e.currentTarget.dataset.postId;
    
    // Try to use existing comments functionality from main feed
    if (window.toggleComments) {
      window.toggleComments(postId);
    } else {
      console.log(`View comments clicked for post: ${postId}`);
      // Fallback: Could implement basic comments view here
    }
  }

  /**
   * HANDLE MORE OPTIONS BUTTON CLICK
   * Opens the post options menu (edit, delete, report, etc.).
   * Integrates with existing post options functionality if available.
   */
  function handleMoreOptions(e) {
    const postId = e.currentTarget.dataset.postId;
    
    // Try to use existing post options functionality from main feed
    if (window.showPostOptions) {
      window.showPostOptions(postId);
    } else {
      console.log(`More options clicked for post: ${postId}`);
      // Fallback: Could implement basic options menu here
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // COMMENT SUBMISSION FUNCTIONALITY
  // Handles the complete flow of submitting a new comment to a post.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * SUBMIT COMMENT
   * Handles the complete comment submission process including API call and UI updates.
   * Provides immediate feedback and updates the interface on success.
   * 
   * @param {string} postId - ID of the post to add comment to
   */
  async function submitComment(postId) {
    // Get comment input and validate content
    const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
    const text = input.value.trim();
    
    if (!text) return; // Don't submit empty comments

    try {
      // Send comment to server
      const response = await fetch(`/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const result = await response.json();
        
        // ═══ UPDATE UI ON SUCCESS ═══
        input.value = '';  // Clear the input field
        
        // Hide submit button since input is now empty
        const submitBtn = document.querySelector(`.comment-submit-btn[data-post-id="${postId}"]`);
        submitBtn.style.display = 'none';
        
        // Update comments count in the view comments button
        const viewCommentsBtn = document.querySelector(`.view-comments-btn[data-post-id="${postId}"]`);
        if (viewCommentsBtn) {
          const commentCount = result.commentsCount;
          viewCommentsBtn.textContent = `View all ${commentCount} comment${commentCount !== 1 ? 's' : ''}`;
        }
        
      } else {
        // Handle API errors
        const error = await response.json();
        alert('Error adding comment: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC API FOR EXTERNAL INTEGRATION
  // Expose key functions for use by other scripts in the application.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * PUBLIC API FOR OTHER SCRIPTS
   * Exposes group feed functionality for external use.
   * Other scripts can use these functions to control the group feed display.
   */
  window.GroupFeed = {
    showAllPosts,                    // Navigate back to main feed
    loadGroupPosts,                  // Load posts for specific group
    createPostElement,               // Create post HTML from data
    initializePostEventListeners,     // Set up post interactions
    showGroupMembers                  // Show/hide group members list
  };

});
