document.addEventListener("DOMContentLoaded", () => {
  const shareModal = document.getElementById("sharePostModal");
  const backdrop = document.getElementById("menu-backdrop");
  const closeModalBtn = document.getElementById("sharePostcloseModal");

  function openShareModal() {
    shareModal.classList.remove("hidden");
    backdrop.classList.remove("hidden");
  }

  function closeShareModal() {
    shareModal.classList.add("hidden");
    backdrop.classList.add("hidden");
  }

  // Use event delegation for dynamically added Share buttons
  document.addEventListener("click", (event) => {
    const shareButton = event.target.closest('button[aria-label="Share"]');
    if (shareButton) {
      event.stopPropagation();
      openShareModal();
    }
  });

  // Close modal on close button click
  closeModalBtn.addEventListener("click", closeShareModal);

  // Close if user clicks outside the modal content
  document.addEventListener("click", (event) => {
    const isModalOpen = !shareModal.classList.contains("hidden");
    const clickedInsideModal = shareModal.contains(event.target);
    const clickedShareButton = event.target.closest(
      'button[aria-label="Share"]'
    );

    if (isModalOpen && !clickedInsideModal && !clickedShareButton) {
      closeShareModal();
    }
  });
});
