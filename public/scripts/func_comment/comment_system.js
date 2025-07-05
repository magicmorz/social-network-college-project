// Comment storage object (in-memory for mockup)
let commentStorage = {};

// Load comments from localStorage
function loadComments() {
  const storedComments = localStorage.getItem("commentStorage");
  if (storedComments) {
    commentStorage = JSON.parse(storedComments);
    // Convert timestamp strings back to Date objects
    Object.keys(commentStorage).forEach((postId) => {
      commentStorage[postId].forEach((comment) => {
        comment.timestamp = new Date(comment.timestamp);
      });
    });
  }
}

// Save comments to localStorage
function saveComments() {
  localStorage.setItem("commentStorage", JSON.stringify(commentStorage));
}

// Initialize comments for each post
function initializeComments() {
  document.querySelectorAll(".posts-container").forEach((post) => {
    const postId = post.id; // Use section ID (e.g., post-7)
    if (!commentStorage[postId]) {
      commentStorage[postId] = [
        { username: "user1", text: "Great post!", timestamp: new Date() },
        { username: "user2", text: "Love this!", timestamp: new Date() },
      ];
      saveComments(); // Save initial comments
    }
    // Update comment count display
    const commentCount = post.querySelector(".view-comments button");
    if (commentCount) {
      commentCount.textContent = `View all ${commentStorage[postId].length} comments`;
    }
  });
}

// Create comment modal HTML
function createCommentModal() {
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.id = "commentModal";
  modal.innerHTML = `
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Comments</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="comments-list"></div>
        </div>
        <div class="modal-footer">
          <div class="w-100">
            <input type="text" class="form-control add-comment-input" placeholder="Add a comment...">
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// Render comments for a specific post
function renderComments(postId, modal) {
  const commentsList = modal.querySelector(".comments-list");
  commentsList.innerHTML = "";

  commentStorage[postId].forEach((comment) => {
    const commentElement = document.createElement("div");
    commentElement.className = "comment mb-2";
    commentElement.innerHTML = `
      <strong>${comment.username}</strong> ${comment.text}
      <small class="text-muted d-block">${new Date(comment.timestamp).toLocaleString()}</small>
    `;
    commentsList.appendChild(commentElement);
  });
}

// Add new comment
function addComment(postId, text) {
  if (text.trim()) {
    commentStorage[postId].push({
      username: "the_miichael",
      text: text.trim(),
      timestamp: new Date(),
    });
    // Update comment count
    const post = document.getElementById(postId);
    const commentCount = post.querySelector(".view-comments button");
    if (commentCount) {
      commentCount.textContent = `View all ${commentStorage[postId].length} comments`;
    }
    saveComments(); // Save to localStorage
  }
}

// Initialize everything
window.addEventListener("DOMContentLoaded", () => {
  // Load comments from localStorage
  loadComments();

  // Initialize existing comments
  initializeComments();

  // Create modal
  createCommentModal();
  const modal = document.getElementById("commentModal");
  const bsModal = new bootstrap.Modal(modal);

  // Add event listeners for comment buttons and inputs
  document.querySelectorAll(".posts-container").forEach((post) => {
    const postId = post.id; // Use section ID (e.g., post-7)

    // Comment icon click
    const commentButton = post.querySelector(
      '.btn[aria-label="Comment on post"]'
    );
    if (commentButton) {
      commentButton.addEventListener("click", () => {
        modal.dataset.postId = postId;
        renderComments(postId, modal);
        bsModal.show();
      });
    }

    // View all comments click
    const viewCommentsButton = post.querySelector(".view-comments button");
    if (viewCommentsButton) {
      viewCommentsButton.addEventListener("click", () => {
        modal.dataset.postId = postId;
        renderComments(postId, modal);
        bsModal.show();
      });
    }

    // Add comment input handler for post's input field
    const commentInput = post.querySelector(".add-comment input");
    if (commentInput) {
      commentInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          addComment(postId, e.target.value);
          e.target.value = ""; // Clear input after submission
        }
      });
    }

    // Typing indicator for post's input field
    const typingIndicator =
      post.querySelector(".typing-indicator") || document.createElement("div");
    if (!typingIndicator.className) {
      typingIndicator.className = "typing-indicator text-muted small";
      typingIndicator.textContent = "Typing...";
      typingIndicator.style.display = "none";
      post.querySelector(".add-comment").after(typingIndicator);
    }

    let timeout;
    commentInput.addEventListener("input", () => {
      typingIndicator.style.display = "block";
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        typingIndicator.style.display = "none";
      }, 3000);
    });

    commentInput.addEventListener("blur", () => {
      typingIndicator.style.display = "none";
      clearTimeout(timeout);
    });
  });

  // Add comment input handler for modal
  modal
    .querySelector(".add-comment-input")
    .addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        const postId = modal.dataset.postId;
        const input = e.target;
        addComment(postId, input.value);
        renderComments(postId, modal);
        input.value = "";
      }
    });

  // Typing indicator for modal
  const modalCommentInput = modal.querySelector(".add-comment-input");
  let timeout;
  const modalTypingIndicator = document.createElement("div");
  modalTypingIndicator.className = "typing-indicator text-muted small";
  modalTypingIndicator.textContent = "Typing...";
  modalTypingIndicator.style.display = "none";
  modal.querySelector(".modal-footer").appendChild(modalTypingIndicator);

  modalCommentInput.addEventListener("input", () => {
    modalTypingIndicator.style.display = "block";
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      modalTypingIndicator.style.display = "none";
    }, 3000);
  });

  modalCommentInput.addEventListener("blur", () => {
    modalTypingIndicator.style.display = "none";
    clearTimeout(timeout);
  });
});
