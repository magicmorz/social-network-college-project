// public/scripts/func_groups/group_feed.js
document.addEventListener('DOMContentLoaded', () => {
  
  // === Show all posts (default feed) ===
  function showAllPosts() {
    console.log('Showing all posts');
    
    // Add loading indicator
    const postsContainer = document.querySelector('.d-flex.flex-column.align-items-center');
    if (postsContainer) {
      postsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"></div><p>Loading posts...</p></div>';
    }
    
    // Reload the page to show all posts
    window.location.href = '/home';
  }

  // === Load and display group posts ===
  async function loadGroupPosts(groupId, groupName) {
    console.log('Loading posts for group:', groupName);
    
    const postsContainer = document.querySelector('.d-flex.flex-column.align-items-center');
    if (!postsContainer) {
      console.error('Posts container not found');
      return;
    }

    // Show loading state
    postsContainer.innerHTML = `
      <div class="text-center p-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading posts from ${groupName}...</p>
      </div>
    `;

    try {
      const response = await fetch(`/api/group/${groupId}/posts`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const posts = await response.json();
      
      console.log(`Found ${posts.length} posts in group ${groupName}`);
      
      if (posts.length === 0) {
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
        return;
      }

      // Clear container and add group header
      postsContainer.innerHTML = `
        <div class="group-header w-100 mb-4 text-center">
          <div class="d-flex align-items-center justify-content-center mb-2">
            <button id="backToAllPosts" class="btn btn-outline-secondary btn-sm me-3">
              <i class="bi bi-arrow-left"></i> Back to All Posts
            </button>
            <h4 class="mb-0">
              <i class="bi bi-people me-2"></i>${groupName}
            </h4>
          </div>
          <p class="text-muted">${posts.length} post${posts.length !== 1 ? 's' : ''}</p>
        </div>
      `;

      // Add back button functionality
      document.getElementById('backToAllPosts').addEventListener('click', showAllPosts);

      // Add posts to the container
      posts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
      });

      // Reinitialize post event listeners if they exist
      initializePostEventListeners();

    } catch (error) {
      console.error('Error loading group posts:', error);
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

  // === Create post HTML element ===
  function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'instagram-post posts-container mb-4';
    postDiv.id = `post-${post._id}`;
    postDiv.setAttribute('data-type', 'picture');
    postDiv.setAttribute('data-group', post.group || '');
    postDiv.setAttribute('data-owner-id', post.user._id);
    
    const timeAgo = formatTimeAgo(post.createdAt);
    
    postDiv.innerHTML = `
      <!-- Post Header -->
      <div class="d-flex align-items-center justify-content-between p-3">
        <div class="d-flex align-items-center">
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
          <div class="ms-2">
            <div class="d-flex align-items-center">
              <div class="username-top-header fw-bold">
                <a href="/u/${post.user.username}" class="username-link text-decoration-none text-dark">
                  ${post.user.username}
                </a>
                ${post.user.isVerified ? '<span class="verified-badge"></span>' : ''}
              </div>
              <span class="text-muted mx-1">•</span>
              <div class="time-since-posted-header text-muted small">
                ${timeAgo}
              </div>
            </div>
            ${post.location ? `<div class="location-top-header text-muted small">${post.location}</div>` : ''}
          </div>
        </div>
        <button class="btn btn-link text-dark more-options-btn" data-post-id="${post._id}">
          <i class="bi bi-three-dots"></i>
        </button>
      </div>

      <!-- Post Image -->
      <div class="post-image">
        <img
          src="${post.image}"
          alt="Post image"
          class="w-100"
          style="max-height: 600px; object-fit: cover;"
        />
      </div>

      <!-- Post Actions -->
      <div class="post-actions p-3">
        <div class="d-flex align-items-center mb-2">
          <button class="btn btn-link text-dark p-0 me-3 like-btn" data-post-id="${post._id}" aria-label="Like post">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="btn btn-link text-dark p-0 me-3 comment-btn" data-post-id="${post._id}" aria-label="Comment on post">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button class="btn btn-link text-dark p-0 me-3 share-btn" data-post-id="${post._id}" aria-label="Share">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16,6 12,2 8,6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </button>
        </div>

        <!-- Likes -->
        <div class="likes-simple mb-2">
          <span class="likes-count fw-bold likes-number">
            ${post.likes ? post.likes.length : 0}
          </span>
          <span class="likes-text fw-bold"> likes</span>
        </div>

        <!-- Caption -->
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

        <!-- View Comments Button -->
        <div class="view-comments mb-2">
          <button class="btn btn-link text-muted p-0 view-comments-btn" data-post-id="${post._id}">
            ${post.comments && post.comments.length > 0 
              ? `View all ${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}` 
              : 'Be the first to comment'}
          </button>
        </div>

        <!-- Comments Section -->
        <div class="comments-section" style="display: none;"></div>

        <!-- Add Comment -->
        <div class="add-comment d-flex align-items-center">
          <input
            type="text"
            class="form-control border-0 comment-input"
            placeholder="Add a comment..."
            data-post-id="${post._id}"
            style="background: transparent;"
          />
          <button class="btn btn-link text-muted p-0 ms-2 emoji-btn">
            <i class="bi bi-emoji-smile"></i>
          </button>
          <button class="btn btn-link fw-bold p-0 ms-2 post-comment-btn comment-submit-btn" 
                  data-post-id="${post._id}" 
                  style="display: none; color: #0095f6;">
            Post
          </button>
        </div>

        <!-- Typing indicator -->
        <div class="typing-indicator text-muted small" style="display: none;">
          Typing...
        </div>
      </div>
    `;
    
    return postDiv;
  }

  // === Format time ago ===
  function formatTimeAgo(dateString) {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)}w`;
    
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // === Initialize post event listeners (like, comment, etc.) ===
  function initializePostEventListeners() {
    console.log('Initializing post event listeners...');

    // Like buttons
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', handleLikeClick);
    });

    // Comment input showing/hiding post button
    document.querySelectorAll('.comment-input').forEach(input => {
      input.addEventListener('input', handleCommentInputChange);
      input.addEventListener('keypress', handleCommentKeyPress);
    });

    // Comment submit buttons
    document.querySelectorAll('.comment-submit-btn').forEach(btn => {
      btn.addEventListener('click', handleCommentSubmit);
    });

    // View comments buttons
    document.querySelectorAll('.view-comments-btn').forEach(btn => {
      btn.addEventListener('click', handleViewComments);
    });

    // More options buttons (for post delete/options)
    document.querySelectorAll('.more-options-btn').forEach(btn => {
      btn.addEventListener('click', handleMoreOptions);
    });
  }

  // === Event handlers (you can expand these based on your existing functionality) ===
  function handleLikeClick(e) {
    const postId = e.currentTarget.dataset.postId;
    // Call your existing like functionality
    if (window.toggleLike) {
      window.toggleLike(postId);
    }
  }

  function handleCommentInputChange(e) {
    const input = e.currentTarget;
    const postId = input.dataset.postId;
    const submitBtn = document.querySelector(`.comment-submit-btn[data-post-id="${postId}"]`);
    
    if (input.value.trim()) {
      submitBtn.style.display = 'block';
    } else {
      submitBtn.style.display = 'none';
    }
  }

  function handleCommentKeyPress(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const postId = e.currentTarget.dataset.postId;
      submitComment(postId);
    }
  }

  function handleCommentSubmit(e) {
    const postId = e.currentTarget.dataset.postId;
    submitComment(postId);
  }

  function handleViewComments(e) {
    const postId = e.currentTarget.dataset.postId;
    // Call your existing view comments functionality
    if (window.toggleComments) {
      window.toggleComments(postId);
    }
  }

  function handleMoreOptions(e) {
    const postId = e.currentTarget.dataset.postId;
    // Call your existing more options functionality
    if (window.showPostOptions) {
      window.showPostOptions(postId);
    }
  }

  // === Submit comment function ===
  async function submitComment(postId) {
    const input = document.querySelector(`.comment-input[data-post-id="${postId}"]`);
    const text = input.value.trim();
    
    if (!text) return;

    try {
      const response = await fetch(`/posts/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text })
      });

      if (response.ok) {
        const result = await response.json();
        input.value = '';
        
        // Hide submit button
        const submitBtn = document.querySelector(`.comment-submit-btn[data-post-id="${postId}"]`);
        submitBtn.style.display = 'none';
        
        // Update comments count if visible
        const viewCommentsBtn = document.querySelector(`.view-comments-btn[data-post-id="${postId}"]`);
        if (viewCommentsBtn) {
          viewCommentsBtn.textContent = `View all ${result.commentsCount} comment${result.commentsCount !== 1 ? 's' : ''}`;
        }
        
        console.log('Comment added successfully');
      } else {
        const error = await response.json();
        alert('Error adding comment: ' + (error.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
    }
  }

  // === Public API for other scripts ===
  window.GroupFeed = {
    showAllPosts,
    loadGroupPosts,
    createPostElement,
    initializePostEventListeners
  };

  console.log('Group Feed initialized');
});