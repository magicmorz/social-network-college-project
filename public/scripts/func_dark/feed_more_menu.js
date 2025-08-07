/* feed_more_menu.js – controls the main “More” hamburger pop-up */
document.addEventListener("DOMContentLoaded", () => {
  /* ── DOM shortcuts ─────────────────────────────────────────── */
  const btn        = document.getElementById("moreBtn");     //  ☰  button
  const menu       = document.getElementById("moreMenu");    //  main pop-up
  const themeMenu  = document.getElementById("themeMenu");   //  “Switch appearance” sub-menu

  /* ── reusable helpers ─────────────────────────────────────── */
  const hideThemeMenu = () => { themeMenu.style.display = "none"; };

  const placeMenu = () => {                 //  position menu above the btn
    const { left, top } = btn.getBoundingClientRect();
    const offset  = 8;                      //  8-px little gap
    const height  = menu.offsetHeight;
    menu.style.left = `${left}px`;
    menu.style.top  = `${top - height - offset}px`;
  };

  /* ── toggle main menu ------------------------------------------------ */
  btn.addEventListener("click", () => {
    const isOpen = menu.style.display === "block";

    /* first, ALWAYS collapse the sub-menu */
    hideThemeMenu();

    if (isOpen) {
      menu.style.display = "none";
      return;
    }
    menu.style.display = "block";
    placeMenu();
  });

  /* ── click-away to close everything --------------------------------- */
  document.addEventListener("click", (e) => {
    const clickedInsideMenus =
      menu.contains(e.target)      ||
      themeMenu.contains(e.target) ||
      btn.contains(e.target);

    if (!clickedInsideMenus) {
      menu.style.display      = "none";
      hideThemeMenu();
    }
  });
});
