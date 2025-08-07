// Enhanced Create Post Modal - JavaScript with group posting and video support
document.addEventListener("DOMContentLoaded", function () {
  console.log("Enhanced modal script with groups and video support loading...");

  const fileInput = document.getElementById("fileInput");
  const sharePost = document.getElementById("sharePost");
  const uploadModal = document.getElementById("uploadModal");
  const uploadClose = document.getElementById("uploadClose");
  const createBtn = document.getElementById("createBtn");
  const fileSelectArea = document.getElementById("fileSelectArea");
  const cropCanvas = document.getElementById("cropCanvas");
  const previewImage = document.getElementById("previewImage");
  const changeImage = document.getElementById("changeImage");
  // Create video element for preview
  const previewVideo = document.createElement("video");
  previewVideo.id = "previewVideo";
  previewVideo.controls = true;
  previewVideo.style.maxWidth = "100%";
  previewVideo.style.maxHeight = "400px";
  previewVideo.style.display = "none";
  if (cropCanvas) cropCanvas.appendChild(previewVideo);

  let isUploading = false;
  let userGroups = [];

  loadUserGroups();

  if (createBtn) {
    createBtn.removeEventListener("click", handleCreateClick);
    createBtn.addEventListener("click", handleCreateClick);
  }

  function handleCreateClick(e) {
    e.preventDefault();
    console.log("Create button clicked - opening modal");
    uploadModal.classList.add("open");
    loadUserGroups();
  }

  async function loadUserGroups() {
    try {
      const response = await fetch("/api/group");
      if (response.ok) {
        userGroups = await response.json();
        updateGroupSelector();
      }
    } catch (error) {
      console.error("Failed to load groups:", error);
    }
  }

  function updateGroupSelector() {
    const groupSelector = document.getElementById("postGroupSelector");
    if (!groupSelector) return;

    groupSelector.innerHTML = `
      <option value="">Post to your feed</option>
      ${userGroups
        .map((group) => `<option value="${group._id}">${group.name}</option>`)
        .join("")}
    `;
  }

  if (sharePost) {
    sharePost.removeEventListener("click", handleShareClick);
    sharePost.addEventListener("click", handleShareClick);
  }

  async function handleShareClick(e) {
    e.preventDefault();
    e.stopPropagation();

    if (isUploading) {
      console.log("Upload already in progress, ignoring click");
      return;
    }

    console.log("Share button clicked");

    const captionInput = document.getElementById("postCaption");
    const locationInput = document.getElementById("postLocation");
    const groupSelector = document.getElementById("postGroupSelector");

    const caption = captionInput ? captionInput.value.trim() : "";
    const groupId = groupSelector ? groupSelector.value : "";

    if (!fileInput || !fileInput.files[0]) {
      alert("Please select an image or video");
      return;
    }

    isUploading = true;
    sharePost.disabled = true;
    sharePost.textContent = "Sharing...";

    try {
      const formData = new FormData();
      formData.append("media", fileInput.files[0]);
      formData.append("caption", caption);
      formData.append(
        "type",
        fileInput.files[0].type.startsWith("video/") ? "video" : "image"
      ); // Ensure type is sent

      if (
        locationInput &&
        locationInput.getAttribute("data-place-id") &&
        locationInput.value.trim()
      ) {
        formData.append("placeId", locationInput.getAttribute("data-place-id"));
        formData.append("placeName", locationInput.value.trim());
        formData.append("placeLat", locationInput.getAttribute("data-lat"));
        formData.append("placeLng", locationInput.getAttribute("data-lng"));
      }

      if (groupId) {
        formData.append("group", groupId);
      }

      const locationValue =
        locationInput && locationInput.getAttribute("data-place-id")
          ? locationInput.value
          : "No location";
      console.log("Sending request to /posts", {
        caption,
        place: locationValue,
        groupId: groupId || "public feed",
        type: fileInput.files[0].type.startsWith("video/") ? "video" : "image",
      });

      const response = await fetch("/posts", {
        method: "POST",
        body: formData,
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const result = await response.json();
        console.log("Post created successfully:", result);

        // Check if user wants to share to Twitter
        const shareToTwitterCheckbox = document.getElementById('shareToTwitter');
        let twitterShareSuccess = true;
        
        if (shareToTwitterCheckbox && shareToTwitterCheckbox.checked) {
          console.log('Attempting to share to Twitter...');
          try {
            // Share to Twitter using the global function from twitter_integration.js
            if (typeof window.sharePostToTwitter === 'function') {
              twitterShareSuccess = await window.sharePostToTwitter(result.post._id, caption);
            }
          } catch (twitterError) {
            console.error('Twitter sharing failed:', twitterError);
            twitterShareSuccess = false;
          }
        }

        closeModal();

        // Show appropriate success message
        const postLocation = groupId
          ? userGroups.find((g) => g._id === groupId)?.name || "group"
          : "your feed";
        
        let successMessage = `Post shared to ${postLocation} successfully!`;
        
        if (shareToTwitterCheckbox && shareToTwitterCheckbox.checked) {
          if (!twitterShareSuccess) {
            successMessage += ' Post saved, but sharing to Twitter didn\'t work this time.';
          }
        }
        
        alert(successMessage);

        window.location.href = "/home";
      } else {
        const error = await response.json();
        console.error("Server error:", error);
        alert(error.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Network error:", error);
      alert("Failed to create post");
    } finally {
      isUploading = false;
      sharePost.disabled = false;
      sharePost.textContent = "Share";
    }
  }

  function closeModal() {
    if (uploadModal) {
      uploadModal.classList.remove("open");
      resetModal();
    }
  }

  function resetModal() {
    if (fileInput) fileInput.value = "";

    const captionInput = document.getElementById("postCaption");
    const locationInput = document.getElementById("postLocation");
    const groupSelector = document.getElementById("postGroupSelector");
    const shareToTwitterCheckbox = document.getElementById("shareToTwitter");

    if (captionInput) captionInput.value = "";
    if (locationInput) {
      locationInput.value = "";
      locationInput.removeAttribute("data-place-id");
      locationInput.removeAttribute("data-lat");
      locationInput.removeAttribute("data-lng");
      if (window.locationAutocomplete) {
        window.locationAutocomplete.reset();
      }
    }
    if (groupSelector) groupSelector.value = "";
    if (shareToTwitterCheckbox) shareToTwitterCheckbox.checked = false;

    if (fileSelectArea) fileSelectArea.style.display = "block";
    if (cropCanvas) cropCanvas.style.display = "none";
    if (previewImage) {
      previewImage.style.display = "none";
      previewImage.src = "";
      previewImage.alt = ""; // Clear alt text
    }
    if (previewVideo) {
      previewVideo.style.display = "none";
      previewVideo.src = "";
    }

    isUploading = false;
  }

  if (fileInput) {
    fileInput.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (file) {
        console.log("File selected:", file.name, "Type:", file.type);
        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          alert("Please select an image or video file");
          fileInput.value = "";
          return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
          console.log("File loaded, showing preview");

          if (file.type.startsWith("image/")) {
            if (previewImage) {
              previewImage.src = e.target.result;
              previewImage.alt = "Image preview";
              previewImage.style.display = "block";
            }
            if (previewVideo) previewVideo.style.display = "none";
          } else if (file.type.startsWith("video/")) {
            if (previewVideo) {
              previewVideo.src = e.target.result;
              previewVideo.style.display = "block";
            }
            if (previewImage) {
              previewImage.style.display = "none";
              previewImage.src = "";
              previewImage.alt = "";
            }
          }

          if (fileSelectArea) fileSelectArea.style.display = "none";
          if (cropCanvas) cropCanvas.style.display = "flex";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (changeImage) {
    changeImage.addEventListener("click", function (e) {
      e.preventDefault();
      console.log("Change media clicked");
      if (fileInput) {
        fileInput.value = "";
        fileInput.click();
      }
    });
  }

  if (uploadClose) {
    uploadClose.addEventListener("click", closeModal);
  }

  if (uploadModal) {
    uploadModal.addEventListener("click", function (e) {
      if (
        e.target === uploadModal ||
        e.target.classList.contains("ig-modal__backdrop")
      ) {
        closeModal();
      }
    });
  }

  document.addEventListener("keydown", function (e) {
    if (
      e.key === "Escape" &&
      uploadModal &&
      uploadModal.classList.contains("open")
    ) {
      closeModal();
    }
  });

  const captionInput = document.getElementById("postCaption");
  const charCount = document.getElementById("captionCharCount");

  if (captionInput && charCount) {
    captionInput.addEventListener("input", function () {
      charCount.textContent = this.value.length;
    });
  }

  const dropzone = document.querySelector(".ig-dropzone");
  if (dropzone) {
    dropzone.addEventListener("dragover", function (e) {
      e.preventDefault();
      dropzone.style.background = "#f0f8ff";
    });

    dropzone.addEventListener("dragleave", function (e) {
      e.preventDefault();
      dropzone.style.background = "";
    });

    dropzone.addEventListener("drop", function (e) {
      e.preventDefault();
      dropzone.style.background = "";

      const files = e.dataTransfer.files;
      if (
        files.length > 0 &&
        (files[0].type.startsWith("image/") ||
          files[0].type.startsWith("video/"))
      ) {
        fileInput.files = files;
        const event = new Event("change", { bubbles: true });
        fileInput.dispatchEvent(event);
      } else {
        alert("Please drop an image or video file");
      }
    });
  }
});
