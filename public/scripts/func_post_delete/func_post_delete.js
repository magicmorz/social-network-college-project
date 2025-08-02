// public/scripts/func_post_delete/func_post_delete.js
function setupPostDelete() {
  const globalOptionsMenu = document.getElementById("global-options-menu");
  const deleteButton = globalOptionsMenu.querySelector(".delete-post-btn"); // Use specific class
  let activePostId = null;

  console.log("🔍 Setup Debug:");
  console.log("- Menu found:", !!globalOptionsMenu);
  console.log("- Delete button found:", !!deleteButton);
  console.log("- Current user ID:", window.currentUserId);

  if (!deleteButton) {
    console.error("❌ Delete button not found! Make sure it has class 'delete-post-btn'");
    return;
  }

  document.querySelectorAll(".more-options-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const postId = btn.dataset.postId;
      activePostId = postId;

      // Find the post element to get owner info
      const postElement = document.getElementById(`post-${postId}`);
      const postOwnerId = postElement ? postElement.dataset.ownerId : null;
      const currentUserId = window.currentUserId;

      console.log("🖱️ More options clicked:");
      console.log("- Post ID:", postId);
      console.log("- Post owner:", postOwnerId);
      console.log("- Current user:", currentUserId);
      console.log("- Is owner?", currentUserId === postOwnerId);

      // Show/hide delete button based on ownership
      if (currentUserId === postOwnerId) {
        deleteButton.style.display = "block";
        console.log("✅ Showing delete button");
      } else {
        deleteButton.style.display = "none";
        console.log("❌ Hiding delete button");
      }

      globalOptionsMenu.style.display = "block";
    });
  });

  document.querySelector(".cancel-btn").addEventListener("click", () => {
    globalOptionsMenu.style.display = "none";
  });

  deleteButton.addEventListener("click", async () => {
    if (!activePostId) return;

    console.log("🗑️ Delete button clicked for post:", activePostId);

    try {
      const response = await fetch(`/posts/${activePostId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const postEl = document.getElementById(`post-${activePostId}`);
        if (postEl) postEl.remove();
        globalOptionsMenu.style.display = "none";
        console.log("✅ Post deleted successfully");
      } else {
        const data = await response.json();
        alert("Error: " + (data.error || data.message || 'Failed to delete post'));
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      alert("Failed to delete post: " + err.message);
    }
  });
}

document.addEventListener("DOMContentLoaded", setupPostDelete);