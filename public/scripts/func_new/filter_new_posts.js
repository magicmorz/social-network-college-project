(() => {
  const VIEW_NEW_BTN_ID = "viewNewBtn";
  const HIDDEN_CLASS = "is-hidden";
  const POST_SELECTOR = ".instagram-post";
  const TIME_SELECTOR = ".time-since-posted";

  // Create the "View New Posts" button and insert it into the DOM
  const newBtn = document.createElement("button");
  newBtn.id = VIEW_NEW_BTN_ID;
  newBtn.textContent = "View New Posts";
  newBtn.className = "btn btn-warning btn-sm mt-3 d-none"; // hidden initially
  newBtn.style.display = "block"; // ensures it's a block-level element

  // Insert after the filter buttons
  const filterContainer = document.querySelector(".content-filter-buttons");
  if (filterContainer && filterContainer.parentNode) {
    filterContainer.parentNode.insertBefore(
      newBtn,
      filterContainer.nextSibling
    );
  }

  // Detect new posts (with "Now") and show the button if any are found
  function detectNewPosts() {
    const posts = [...document.querySelectorAll(POST_SELECTOR)];
    const hasNew = posts.some((post) => {
      const time = post.querySelector(TIME_SELECTOR);
      return time && time.textContent.trim().toLowerCase() === "now";
    });

    newBtn.classList.toggle("d-none", !hasNew);
  }

  // Filter to show only new posts
  newBtn.addEventListener("click", () => {
    const posts = [...document.querySelectorAll(POST_SELECTOR)];
    posts.forEach((post) => {
      const time = post.querySelector(TIME_SELECTOR);
      const isNew = time && time.textContent.trim().toLowerCase() === "now";
      post.classList.toggle(HIDDEN_CLASS, !isNew);
    });
  });

  // Periodically check every 3 seconds for new posts
  setInterval(detectNewPosts, 3000);
})();
