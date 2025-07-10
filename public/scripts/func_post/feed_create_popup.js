// Add this to your existing feed_create_popup.js or create a new file: feed_post_integration.js

// Function to create post HTML from post data
function createPostHTML(post) {
  const timeAgo = formatTimeAgo(post.createdAt);
  const isLiked = post.likes.includes(currentUserId); // You'll need to pass currentUserId to the frontend
  
  return `
    <div class="post mb-4" data-post-id="${post._id}">
      <div class="post-header d-flex align-items-center p-3">
        <img src="${post.user.profilePicture || './user/default_profile.jpg'}" 
             alt="${post.user.username}" 
             class="rounded-circle me-3" 
             style="width: 40px; height: 40px; object-fit: cover;">
        <div class="flex-grow-1">
          <div class="fw-bold">${post.user.username}</div>
          ${post.location ? `<div class="text-muted small">${post.location}</div>` : ''}
        </div>
        <button class="btn btn-link text-dark post-options-btn" data-post-id="${post._id}">
          <i class="bi bi-three-dots"></i>
        </button>
      </div>
      
      <div class="post-image-container">
        <img src="${post.image}" 
             alt="Post image" 
             class="w-100" 
             style="max-height: 600px; object-fit: cover;">
      </div>
      
      <div class="post-actions p-3">
        <div class="d-flex align-items-center mb-2">
          <button class="btn btn-link text-dark me-3 like-btn ${isLiked ? 'liked' : ''}" 
                  data-post-id="${post._id}">
            <i class="bi ${isLiked ? 'bi-heart-fill text-danger' : 'bi-heart'}" style="font-size: 1.5rem;"></i>
          </button>
          <button class="btn btn-link text-dark me-3 comment-toggle-btn" data-post-id="${post._id}">
            <i class="bi bi-chat" style="font-size: 1.5rem;"></i>
          </button>
          <button class="btn btn-link text-dark me-3 share-btn" data-post-id="${post._id}">
            <i class="bi bi-send" style="font-size: 1.5rem;"></i>
          </button>
        </div>
        
        <div class="likes-count fw-bold mb-1">
          <span class="likes-number">${post.likes.length}</span> likes
        </div>
        
        ${post.caption ? `
          <div class="caption mb-2">
            <span class="fw-bold">${post.user.username}</span> 
            ${post.caption}
          </div>
        ` : ''}
        
        <div class="post-time text-muted small mb-2">${timeAgo}</div>
        
        <div class="comments-section">
          ${post.comments.slice(0, 2).map(comment => `
            <div class="comment mb-1">
              <span class="fw-bold">${comment.user.username}</span>
              <span>${comment.text}</span>
            </div>
          `).join('')}
          
          ${post.comments.length > 2 ? `
            <button class="btn btn-link text-muted p-0 view-more-comments" data-post-id="${post._id}">
              View all ${post.comments.length} comments
            </button>
          ` : ''}
        </div>
        
        <div class="comment-form border-top pt-3 mt-3">
          <div class="d-flex align-items-center">
            <input type="text" 
                   class="form-control border-0 comment-input" 
                   placeholder="Add a comment..." 
                   data-post-id="${post._id}">
            <button class="btn btn-link text-primary comment-submit-btn" 
                    data-post-id="${post._id}" 
                    disabled>
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Function to format time ago
function formatTimeAgo(dateString) {
  const now = new Date();
  const postDate = new Date(dateString);
  const diffInSeconds = Math.floor((now - postDate) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
  
  return postDate.toLocaleDateString();
}

// Function to handle post creation via your existing modal
function enhanceCreatePostModal() {
  const uploadModal = document.getElementById('uploadModal');
  const cropNext = document.getElementById('cropNext');
  
  if (cropNext) {
    cropNext.addEventListener('click', async () => {
      const fileInput = document.getElementById('fileInput');
      const captionInput = document.getElementById('postCaption'); // You'll need to add this to your modal
      const locationInput = document.getElementById('postLocation'); // You'll need to add this to your modal
      
      if (!fileInput.files[0]) {
        alert('Please select an image');
        return;
      }
      
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      formData.append('caption', captionInput?.value || '');
      formData.append('location', locationInput?.value || '');
      
      try {
        const response = await fetch('/posts', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          
          // Close modal
          uploadModal.style.display = 'none';
          
          // Add new post to feed
          await refreshFeed();
          
          // Reset form
          fileInput.value = '';
          if (captionInput) captionInput.value = '';
          if (locationInput) locationInput.value = '';
          
          // Show success message
          showNotification('Post created successfully!');
        } else {
          const error = await response.json();
          alert(error.error || 'Failed to create post');
        }
      } catch (error) {
        console.error('Error creating post:', error);
        alert('Failed to create post');
      }
    });
  }
}

// Function to refresh the feed
async function refreshFeed() {
  try {
    const response = await fetch('/posts/json');
    if (response.ok) {
      const data = await response.json();
      renderPosts(data.posts);
    }
  } catch (error) {
    console.error('Error refreshing feed:', error);
  }
}

// Function to render posts in the feed
function renderPosts(posts) {
  const postsContainer = document.querySelector('.w-100.text-center.position-relative > div');
  if (!postsContainer) return;
  
  // Clear existing posts (except the return to top button)
  const returnToTopBtn = postsContainer.querySelector('#scrollToTopBtn');
  postsContainer.innerHTML = '';
  
  // Add posts
  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.innerHTML = createPostHTML(post);
    postsContainer.appendChild(postElement.firstElementChild);
  });
  
  // Re-add return to top button
  if (returnToTopBtn) {
    postsContainer.appendChild(returnToTopBtn);
  }
  
  // Reinitialize event listeners
  initializePostEventListeners();
}

// Function to initialize post event listeners
function initializePostEventListeners() {
  // Like button handlers
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const postId = btn.dataset.postId;
      
      try {
        const response = await fetch(`/posts/${postId}/like`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const icon = btn.querySelector('i');
          const likesCount = btn.closest('.post').querySelector('.likes-number');
          
          if (data.liked) {
            btn.classList.add('liked');
            icon.className = 'bi bi-heart-fill text-danger';
          } else {
            btn.classList.remove('liked');
            icon.className = 'bi bi-heart';
          }
          
          likesCount.textContent = data.likesCount;
        }
      } catch (error) {
        console.error('Error toggling like:', error);
      }
    });
  });
  
  // Comment input handlers
  document.querySelectorAll('.comment-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const submitBtn = e.target.nextElementSibling;
      submitBtn.disabled = e.target.value.trim().length === 0;
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const submitBtn = e.target.nextElementSibling;
        if (!submitBtn.disabled) {
          submitBtn.click();
        }
      }
    });
  });
  
  // Comment submit handlers
  document.querySelectorAll('.comment-submit-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const postId = btn.dataset.postId;
      const input = btn.previousElementSibling;
      const text = input.value.trim();
      
      if (!text) return;
      
      try {
        const response = await fetch(`/posts/${postId}/comment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ text })
        });
        
        if (response.ok) {
          const data = await response.json();
          const commentsSection = btn.closest('.post').querySelector('.comments-section');
          
          const commentElement = document.createElement('div');
          commentElement.className = 'comment mb-1';
          commentElement.innerHTML = `
            <span class="fw-bold">${data.comment.user.username}</span>
            <span>${data.comment.text}</span>
          `;
          
          commentsSection.appendChild(commentElement);
          input.value = '';
          btn.disabled = true;
        }
      } catch (error) {
        console.error('Error adding comment:', error);
      }
    });
  });
}

// Function to show notification
function showNotification(message) {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.className = 'alert alert-success position-fixed';
  notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  // Set current user ID for like functionality
  window.currentUserId = '<%= user._id %>'; // This needs to be set in your EJS template
  
  // Enhance the existing create post modal
  enhanceCreatePostModal();
  
  // Initialize event listeners for existing posts
  initializePostEventListeners();
});

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    createPostHTML,
    refreshFeed,
    renderPosts,
    initializePostEventListeners
  };
}