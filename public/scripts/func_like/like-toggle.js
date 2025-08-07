document.addEventListener("DOMContentLoaded", () => {
  const FULL_HEART = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="24" height="24" fill="rgb(255,48,64)" role="img">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5
               0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
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

    // Save original icon if not already saved
    if (!btn.__outline) btn.__outline = btn.innerHTML;

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

      // Update heart icon
      btn.innerHTML = liked ? FULL_HEART : btn.__outline;

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
      if (btn && !btn.__liked) btn.classList.add("bounce");
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
