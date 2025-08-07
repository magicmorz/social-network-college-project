document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("global-options-menu");
  const backdrop = document.getElementById("menu-backdrop");
  const cancelBtn = document.querySelector(".cancel-btn");
  let currentPostId = null;

  // Event delegation for opening menu
  document.addEventListener("click", (e) => {
    const moreOptionsBtn = e.target.closest(".more-options-btn");
    if (moreOptionsBtn) {
      e.stopPropagation();
      currentPostId = moreOptionsBtn.getAttribute("data-post-id");

      menu.style.display = "block";
      backdrop.style.display = "block";
    }
  });

  // Close menu on cancel or backdrop click
  if (cancelBtn) {
    cancelBtn.addEventListener("click", closeMenu);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeMenu);
  }

  function closeMenu() {
    menu.style.display = "none";
    backdrop.style.display = "none";
    currentPostId = null;
  }
});
