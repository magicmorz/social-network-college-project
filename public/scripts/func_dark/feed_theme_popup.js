/* feed_theme_popup.js  –  */
document.addEventListener("DOMContentLoaded", () => {

  /*   DOM */
  const moreBtn   = document.getElementById("moreBtn");   // hamburger ☰
  const moreMenu  = document.getElementById("moreMenu");  // Main More Menu
  const themeBtn  = document.getElementById("themeSwitch"); //  “Switch appearance”

  /* New */
  const themeMenu = document.getElementById("themeMenu");   // Second popup menu
  const backBtn   = document.getElementById("backBtn");
  const toggle    = document.getElementById("themeToggle");
  const sunMoonIcon = themeMenu.querySelector(".bi-brightness-high, .bi-moon");

  /* toggle Moon/Sun Icon*/ 
    toggle.addEventListener("change", () => {
        const dark = toggle.checked;
        document.documentElement.setAttribute("data-theme", dark ? "dark" : "Light");
        localStorage.setItem("theme", dark ? "dark" : "Light");

        sunMoonIcon.classList.toggle("bi-brightness-high", !dark);
        sunMoonIcon.classList.toggle("bi-moon",           dark);
});


  /* Keep the right porportion */
  function place(popup){
    popup.style.display = "block";
    const r = moreBtn.getBoundingClientRect();
    const h = popup.offsetHeight;
    popup.style.left = `${r.left}px`;
    popup.style.top  = `${r.top - h - 8}px`; /* 8-px offset     */
    
  }
  function hideAll(){
    moreMenu.style.display  = "none";
    themeMenu.style.display = "none";
  }

  /* Loading white menu */
  themeBtn.addEventListener("click", () => {
    hideAll();
    place(themeMenu);
  });

  /* Back arrow */
  backBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    hideAll();
    place(moreMenu);
  });

  /* Exit out of popups */
  document.addEventListener("click", e=>{
    if(
      !moreMenu.contains(e.target)  &&
      !themeMenu.contains(e.target) &&
      !moreBtn.contains(e.target)   &&
      e.target.id!=="themeSwitch"   /* Won't close twice */
    ){
      hideAll();
    }
  });

  /* Dark / Light  –  loading and saving */
  const saved = localStorage.getItem("theme") || "Light";
  document.documentElement.setAttribute("data-theme", saved);
  toggle.checked = saved === "dark";

  toggle.addEventListener("change", () => {
    const newTheme = toggle.checked ? "dark" : "Light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
  });

  toggle.addEventListener("change", () => {
     const newTheme = toggle.checked ? "dark" : "Light";
     document.documentElement.setAttribute("data-theme", newTheme);
     localStorage.setItem("theme", newTheme);
   });
});

