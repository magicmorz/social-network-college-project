const scrollToTopBtn = document.getElementById("scrollToTopBtn");
const container = document.getElementById("main-content-scrollable-container");

container.addEventListener("scroll", () => {
  if (container.scrollTop > 100) {
    scrollToTopBtn.style.display = "block";
  } else {
    scrollToTopBtn.style.display = "none";
  }
});

scrollToTopBtn.addEventListener("click", () => {
  container.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

// Hide on load
scrollToTopBtn.style.display = "none";
