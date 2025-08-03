// Comment system integrated with database - Inline comments
let commentCache = {}; // Cache for faster UI updates

// Initialize comments for each post
function initializeComments() {
  document.querySelectorAll(".posts-container").forEach((post) => {
    const postId = post.id.replace('post-', ''); // Remove 'post-' prefix to get actual MongoDB ID
    
    // Update comment count display from server data
    updateCommentCount(postId);
  });
}

// Fetch and render comments for a specific post inline
async function toggleComments(postId) {
  const post = document.getElementById(`post-${postId}`);
  if (!post) return;

  const commentsSection = post.querySelector(".comments-section");
  const viewCommentsButton = post.querySelector(".view-comments button");
  
  if (!commentsSection || !viewCommentsButton) return;

  // Check if comments are currently visible
  const isCommentsVisible = commentsSection.style.display !== 'none' && commentsSection.innerHTML.trim() !== '';
  
  if (isCommentsVisible) {
    // Hide comments
    commentsSection.style.display = "none";
    commentsSection.innerHTML = "";
    updateCommentCount(postId); // Reset button text
  } else {
    // Show loading state
    commentsSection.innerHTML =
      '<div class="text-center p-2 text-muted">Loading comments...</div>';
    commentsSection.style.display = "block";

    try {
      // Fetch post data with comments
      const response = await fetch(`/posts/${postId}/comments`);
      if (!response.ok) throw new Error("Failed to load comments");

      const data = await response.json();
      commentsSection.innerHTML = "";

      if (data.comments && data.comments.length > 0) {
        data.comments.forEach((comment) => {
          const avatarUrl =
            comment.user && comment.user._id
              ? `/api/users/avatars/user_${comment.user._id}`
              : "/avatars/default.jpg";

          const commentElement = document.createElement("div");
          commentElement.className = "comment mb-2 p-2";
          commentElement.innerHTML = `
            <div class="d-flex align-items-start">
              <img 
                src="${avatarUrl}" 
                alt="${comment.user.username}" 
                class="rounded-circle me-2" 
                style="width: 28px; height: 28px; object-fit: cover;">
              <div class="flex-grow-1">
                <div>
                  <a href="/u/${
                    comment.user.username
                  }" class="fw-bold text-decoration-none">
                    ${comment.user.username}
                  </a>
                  <span>${comment.text}</span>
                </div>
                <small class="text-muted">${new Date(
                  comment.createdAt
                ).toLocaleString()}</small>
              </div>
            </div>
          `;
          commentsSection.appendChild(commentElement);
        });

        // Update button text to "Hide comments"
        viewCommentsButton.textContent = "Hide comments";
      } else {
        commentsSection.innerHTML =
          '<div class="text-muted text-center p-3">No comments yet. Be the first to comment!</div>';
        viewCommentsButton.textContent = "Hide comments";
      }
    } catch (error) {
      console.error("Error loading comments:", error);
      commentsSection.innerHTML =
        '<div class="text-danger text-center p-2">Failed to load comments</div>';
    }
  }
  
}

// Add new comment to database
async function addComment(postId, text) {
  if (!text.trim()) return;

  try {
    const response = await fetch(`/posts/${postId}/comment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text.trim() })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add comment');
    }
    
    const data = await response.json();
    console.log('Comment added successfully:', data);
    
    // Update comment count in UI
    updateCommentCount(postId);
    
    // If comments are currently visible, refresh them
    const post = document.getElementById(`post-${postId}`);
    const commentsSection = post.querySelector(".comments-section");
    if (commentsSection && commentsSection.style.display !== 'none' && commentsSection.innerHTML.trim() !== '') {
      toggleComments(postId); // Hide first
      setTimeout(() => toggleComments(postId), 100); // Then show updated comments
    }
    
    return data.comment;
  } catch (error) {
    console.error('Error adding comment:', error);
    alert('Failed to add comment: ' + error.message);
    return null;
  }
}

// Update comment count display
function updateCommentCount(postId) {
  const post = document.getElementById(`post-${postId}`);
  if (!post) return;

  const commentCount = post.querySelector(".view-comments button");
  if (commentCount) {
    // Get current count from the post data or fetch from server
    fetch(`/posts/${postId}/comments`)
      .then(response => response.json())
      .then(data => {
        const count = data.comments ? data.comments.length : 0;
        if (count > 0) {
          commentCount.textContent = `View all ${count} comment${count !== 1 ? 's' : ''}`;
          commentCount.style.display = 'block';
        } else {
          commentCount.textContent = 'Be the first to comment';
          commentCount.style.display = 'block';
        }
      })
      .catch(error => {
        console.error('Error updating comment count:', error);
        commentCount.textContent = 'View comments';
      });
  }
}

// Initialize everything
window.addEventListener("DOMContentLoaded", () => {
  // Initialize existing comments
  initializeComments();

  // Add event listeners for comment buttons and inputs
  document.querySelectorAll(".posts-container").forEach((post) => {
    const postId = post.id.replace('post-', ''); // Remove 'post-' prefix

    // Comment icon click - toggle comments
    const commentButton = post.querySelector('.btn[aria-label="Comment on post"]');
    if (commentButton) {
      commentButton.addEventListener("click", () => {
        toggleComments(postId);
      });
    }

    // View all comments click - toggle comments
    const viewCommentsButton = post.querySelector(".view-comments button");
    if (viewCommentsButton) {
      viewCommentsButton.addEventListener("click", () => {
        toggleComments(postId);
      });
    }

    // Add comment input and Post button functionality
    const commentInput = post.querySelector(".add-comment input");
    const postCommentBtn = post.querySelector(".post-comment-btn");
    
    if (commentInput) {
      // Function to handle comment submission
      const submitComment = async () => {
        const text = commentInput.value.trim();
        if (!text) return;
        
        // Show loading state
        commentInput.disabled = true;
        if (postCommentBtn) {
          postCommentBtn.disabled = true;
          postCommentBtn.textContent = "Posting...";
        }
        commentInput.placeholder = "Adding comment...";
        
        const comment = await addComment(postId, text);
        if (comment) {
          commentInput.value = ""; // Clear input after successful submission
          
          // Hide post button
          if (postCommentBtn) {
            postCommentBtn.style.display = "none";
            postCommentBtn.textContent = "Post";
          }
        }
        
        // Reset input state
        commentInput.disabled = false;
        if (postCommentBtn) {
          postCommentBtn.disabled = false;
        }
        commentInput.placeholder = "Add a comment...";
      };

      // Enter key handler
      commentInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
          await submitComment();
        }
      });

      // Post button click handler
      if (postCommentBtn) {
        postCommentBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          await submitComment();
        });
      }

      // Show/hide post button based on input content
      commentInput.addEventListener("input", () => {
        const hasText = commentInput.value.trim().length > 0;
        
        if (postCommentBtn) {
          postCommentBtn.style.display = hasText ? "inline-block" : "none";
        }
      });
    }
  });
});