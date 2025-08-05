document.addEventListener("DOMContentLoaded", () => {
  const FULL_HEART = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="24" height="24" fill="rgb(255,48,64)" role="img">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5
               0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`.trim();

  const OUTLINE_HEART = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5
               0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78
               1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>`.trim();

  const fmt = (n) => n.toLocaleString("en-US");

  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[aria-label='Like post']");
    if (!btn) return;

    const post = btn.closest(".instagram-post");
    const counter = post?.querySelector(".likes-simple .likes-count");
    const postId = post?.dataset.postId;

    if (!postId) {
      console.error("Missing post ID");
      return;
    }

    try {
      const response = await fetch(`/posts/${postId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to toggle like");
        return;
      }

      const data = await response.json();
      const { liked, likesCount } = data;

      // Update heart icon and data-liked attribute
      btn.innerHTML = liked ? FULL_HEART : OUTLINE_HEART;
      btn.dataset.liked = liked; // Update data-liked attribute

      // Update like count
      if (counter) {
        counter.textContent = fmt(likesCount);
      }

      // Small bounce animation
      btn.classList.add("pop");
      setTimeout(() => btn.classList.remove("pop"), 350);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  });

  document.body.addEventListener(
    "mouseenter",
    (e) => {
      const btn = e.target.closest("button[aria-label='Like post']");
      if (btn && btn.dataset.liked !== "true") btn.classList.add("bounce");
    },
    true
  );

  document.body.addEventListener(
    "mouseleave",
    (e) => {
      const btn = e.target.closest("button[aria-label='Like post']");
      if (btn) btn.classList.remove("bounce");
    },
    true
  );
});
