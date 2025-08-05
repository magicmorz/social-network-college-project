// Wait until the entire HTML document has been fully loaded and parsed
document.addEventListener("DOMContentLoaded", () => {
  // Define the SVG markup for a fully filled heart icon (used when post is liked)
  const FULL_HEART = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="24" height="24" fill="rgb(255,48,64)" role="img">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5
               0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`.trim();

  // Define the SVG markup for an outlined heart icon (used when post is not liked)
  const OUTLINE_HEART = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5
               0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
               1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`.trim();

  // Helper function to format numbers with commas for thousands, etc.
  // Example: 1234 => "1,234"
  const fmt = (n) => n.toLocaleString("en-US");

  // Listen for any click events on the entire document body
  // This uses event delegation to catch clicks on dynamically loaded content too
  document.body.addEventListener("click", async (e) => {
    // Check if the clicked element or one of its ancestors is a "Like" button
    // Specifically, a button with aria-label='Like post'
    const btn = e.target.closest("button[aria-label='Like post']");
    if (!btn) return; // If no such button found, ignore the click

    // Find the closest post container for this button
    // Assumes post elements have class 'instagram-post'
    const post = btn.closest(".instagram-post");

    // Inside the post, find the element displaying the like count
    // Assumes it has classes 'likes-simple' and 'likes-count'
    const counter = post?.querySelector(".likes-simple .likes-count");

    // Extract the post ID from a data attribute on the post container
    // This is needed to tell the server which post to like/unlike
    const postId = post?.dataset.postId;

    // If no postId found, log an error and abort
    if (!postId) {
      console.error("Missing post ID");
      return;
    }

    try {
      // Send a POST request to the server endpoint to toggle like status
      // Endpoint format: /posts/{postId}/like
      const response = await fetch(`/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies/auth info for session
      });

      // If server responded with error status, log and abort
      if (!response.ok) {
        console.error("Failed to toggle like");
        return;
      }

      // Parse the JSON response from server, expected shape:
      // { liked: boolean, likesCount: number }
      const data = await response.json();
      const { liked, likesCount } = data;

      // Update the button's inner HTML to show full or outline heart
      btn.innerHTML = liked ? FULL_HEART : OUTLINE_HEART;

      // Update the button's data-liked attribute to reflect current like state
      btn.dataset.liked = liked;

      // If the like count element exists, update its text with formatted number
      if (counter) {
        counter.textContent = fmt(likesCount);
      }

      // Add a CSS class 'pop' to trigger a small bounce animation on the button
      btn.classList.add("pop");

      // Remove the 'pop' class after 350ms to allow re-triggering animation later
      setTimeout(() => btn.classList.remove("pop"), 350);
    } catch (err) {
      // Catch and log any network or unexpected errors
      console.error("Error toggling like:", err);
    }
  });

  // Listen for mouseenter events on the body, capturing phase enabled
  // This will trigger when mouse enters any like button
  document.body.addEventListener(
    "mouseenter",
    (e) => {
      // Find closest like button from event target
      const btn = e.target.closest("button[aria-label='Like post']");
      // Only add bounce effect if the post is NOT liked currently
      if (btn && btn.dataset.liked !== "true") btn.classList.add("bounce");
    },
    true // Use capturing to get event before it bubbles
  );

  // Listen for mouseleave events on the body, capturing phase enabled
  // This triggers when mouse leaves any like button
  document.body.addEventListener(
    "mouseleave",
    (e) => {
      // Find closest like button from event target
      const btn = e.target.closest("button[aria-label='Like post']");
      // Remove the bounce animation class regardless of liked state
      if (btn) btn.classList.remove("bounce");
    },
    true
  );
});
