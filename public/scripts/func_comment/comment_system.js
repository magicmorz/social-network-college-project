// Comment system integrated with database - Inline comments
let commentCache = {}; // Cache for faster UI updates

// Initialize comments for each post
function initializeComments() {
  document.querySelectorAll(".posts-container").forEach((post) => {
    const postId = post.id.replace("post-", ""); // Remove 'post-' prefix to get actual MongoDB ID

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
  const isCommentsVisible =
    commentsSection.style.display !== "none" &&
    commentsSection.innerHTML.trim() !== "";

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
      // Fixed: Use singular 'post' instead of 'posts'
      const response = await fetch(`/post/${postId}/comments`);
      if (!response.ok) throw new Error("Failed to load comments");

      const data = await response.json();
      commentsSection.innerHTML = "";

      if (data.comments && data.comments.length > 0) {
        data.comments.forEach((comment) => {
          const avatarUrl =
            comment.user && comment.user._id
              ? `/api/users/avatars/user_${comment.user._id}`
              : "/avatars/default.jpg";

          const isOwner = comment.user._id === currentUserId; // Add this check

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
                <div class="d-flex justify-content-between">
                  <div>
                    <a href="/u/${
                      comment.user.username
                    }" class="fw-bold text-decoration-none">
                      ${comment.user.username}
                    </a>
                    ${
                      comment.text
                        ? `<span class="ms-1">${comment.text}</span>`
                        : ""
                    }
                  </div>
                  ${
                    isOwner
                      ? `
                   <button 
                      class="btn btn-sm btn-link text-danger delete-comment-btn" 
                      data-comment-id="${comment._id}" 
                      data-post-id="${postId}">
                      <i class="bi bi-trash"></i>
                    </button>

                  `
                      : ""
                  }
                </div>
                <small class="text-muted">${new Date(
                  comment.createdAt
                ).toLocaleString()}</small>
              </div>
            </div>
          `;
          commentsSection.appendChild(commentElement);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll(".delete-comment-btn").forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            const commentId = btn.getAttribute("data-comment-id");
            if (confirm("Are you sure you want to delete this comment?")) {
              try {
                // Fixed: Use singular 'post' instead of 'posts'
                const res = await fetch(
                  `/post/${postId}/comments/${commentId}`,
                  {
                    method: "DELETE",
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );
                if (!res.ok) throw new Error("Failed to delete comment");
                btn.closest(".comment").remove(); // Remove comment from DOM
              } catch (err) {
                alert("Error deleting comment.");
                console.error(err);
              }
            }
          });
        });

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
    console.log(data.comments[0]); 
  }
}

// Add new comment to database
async function addComment(postId, text) {
  if (!text.trim()) return;

  try {
    console.log("Posting comment:", { postId, text, gifUrl });
    const response = await fetch(`/post/${postId}/comment`, {

      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text.trim() }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to add comment");
    }

    const data = await response.json();
    console.log("Comment added successfully:", data);

    // Update comment count in UI
    updateCommentCount(postId);

    // If comments are currently visible, refresh them
    const post = document.getElementById(`post-${postId}`);
    const commentsSection = post.querySelector(".comments-section");
    if (
      commentsSection &&
      commentsSection.style.display !== "none" &&
      commentsSection.innerHTML.trim() !== ""
    ) {
      toggleComments(postId); // Hide first
      setTimeout(() => toggleComments(postId), 100); // Then show updated comments
    }

    return data.comment;
  } catch (error) {
    console.error("Error adding comment:", error);
    alert("Failed to add comment: " + error.message);
    return null;
  }
}

// Update comment count display
function updateCommentCount(postId) {
  const post = document.getElementById(`post-${postId}`);
  if (!post) return;

  const commentCount = post.querySelector(".view-comments button");
  if (commentCount) {
    fetch(`/post/${postId}/comments`)
      .then((response) => response.json())
      .then((data) => {
        const count = data.comments ? data.comments.length : 0;
        if (count > 0) {
          commentCount.textContent = `View all ${count} comment${
            count !== 1 ? "s" : ""
          }`;
          commentCount.style.display = "block";
        } else {
          commentCount.textContent = "Be the first to comment";
          commentCount.style.display = "block";
        }
      })
      .catch((error) => {
        console.error("Error updating comment count:", error);
        commentCount.textContent = "View comments";
      });
  }
}

// Initialize GIPHY picker
function initializeGiphyPicker(postId) {
  const post = document.getElementById(`post-${postId}`);
  const gifButton = post.querySelector(".gif-btn");
  const gifPicker = post.querySelector(".gif-picker");

  if (!gifButton || !gifPicker) return;

  gifButton.addEventListener("click", () => {
    gifPicker.style.display =
      gifPicker.style.display === "none" ? "block" : "none";
  });

  const searchInput = post.querySelector(".gif-search-input");
  const gifContainer = post.querySelector(".gif-container");

  searchInput.addEventListener(
    "input",
    debounce(async () => {
      const query = searchInput.value.trim();
      if (!query) {
        gifContainer.innerHTML = "";
        return;
      }

      try {
        // This route might also need to be checked - ensure it matches your backend routes
        const response = await fetch(
          `/api/gifs/search?query=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to load GIFs");
        }

        const data = await response.json();
        gifContainer.innerHTML = "";

        if (data.data && data.data.length > 0) {
          data.data.forEach((gif) => {
            const img = document.createElement("img");
            img.src = gif.images.fixed_height.url;
            img.alt = gif.title;
            img.className = "gif-option m-1";
            img.style.cursor = "pointer";
            img.style.maxWidth = "100px";
            img.style.maxHeight = "100px";
            img.addEventListener("click", async () => {
              const commentInput = post.querySelector(".add-comment input");
              commentInput.disabled = true;
              const postCommentBtn = post.querySelector(".post-comment-btn");
              if (postCommentBtn) {
                postCommentBtn.disabled = true;
                postCommentBtn.textContent = "Posting...";
              }

              await addComment(postId, "", gif.images.fixed_height.url);
              gifPicker.style.display = "none";
              searchInput.value = "";
              gifContainer.innerHTML = "";
              commentInput.disabled = false;
              if (postCommentBtn) {
                postCommentBtn.disabled = false;
                postCommentBtn.textContent = "Post";
                postCommentBtn.style.display = "none";
              }
              commentInput.placeholder = "Add a comment...";
            });
            gifContainer.appendChild(img);
          });
        } else {
          gifContainer.innerHTML =
            '<div class="text-muted p-2">No GIFs found</div>';
        }
      } catch (error) {
        console.error("Error fetching GIFs:", error.message);
        gifContainer.innerHTML = `<div class="text-danger p-2">Failed to load GIFs: ${error.message}</div>`;
      }
    }, 300)
  );
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize everything
window.addEventListener("DOMContentLoaded", () => {
  // Initialize existing comments
  initializeComments();

  // Add event listeners for comment buttons and inputs
  document.querySelectorAll(".posts-container").forEach((post) => {
    const postId = post.id.replace("post-", ""); // Remove 'post-' prefix

    // Comment icon click - toggle comments
    const commentButton = post.querySelector(
      '.btn[aria-label="Comment on post"]'
    );
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
