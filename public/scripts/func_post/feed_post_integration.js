
document.addEventListener('DOMContentLoaded', function() {
  initializePostEventListeners();
});

// Initialize post event listeners
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
          
          if (likesCount) {
            likesCount.textContent = data.likesCount;
          }
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
      if (submitBtn) {
        submitBtn.disabled = e.target.value.trim().length === 0;
      }
    });
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const submitBtn = e.target.nextElementSibling;
        if (submitBtn && !submitBtn.disabled) {
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

// Function to refresh the feed
async function refreshFeed() {
  try {
    const response = await fetch('/posts/json');
    if (response.ok) {
      const data = await response.json();
      // You can implement this to update the feed without page reload
      console.log('Feed data:', data);
    }
  } catch (error) {
    console.error('Error refreshing feed:', error);
  }
}

// Export functions
window.initializePostEventListeners = initializePostEventListeners;
window.refreshFeed = refreshFeed;