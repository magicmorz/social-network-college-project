// Enhanced Create Post Modal - JavaScript with group posting functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Enhanced modal script with groups loading...');

  const fileInput = document.getElementById('fileInput');
  const sharePost = document.getElementById('sharePost'); // Updated to match your HTML
  const uploadModal = document.getElementById('uploadModal');
  const uploadClose = document.getElementById('uploadClose');
  const createBtn = document.getElementById('createBtn');
  const fileSelectArea = document.getElementById('fileSelectArea');
  const cropCanvas = document.getElementById('cropCanvas');
  const previewImage = document.getElementById('previewImage');
  const changeImage = document.getElementById('changeImage');

  let isUploading = false; // Prevent double submission
  let userGroups = []; // Store user's groups
  
  // Load user's groups when modal loads
  loadUserGroups();

  // Remove any existing event listeners first
  if (createBtn) {
    createBtn.removeEventListener('click', handleCreateClick);
    createBtn.addEventListener('click', handleCreateClick);
  }

  function handleCreateClick(e) {
    e.preventDefault();
    console.log('Create button clicked - opening modal');
    uploadModal.classList.add('open');
    loadUserGroups(); // Refresh groups when opening modal
  }

  // Load user's groups for posting
  async function loadUserGroups() {
    try {
      const response = await fetch('/api/group');
      if (response.ok) {
        userGroups = await response.json();
        updateGroupSelector();
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  }

  // Update the group selector dropdown
  function updateGroupSelector() {
    const groupSelector = document.getElementById('postGroupSelector');
    if (!groupSelector) return;

    groupSelector.innerHTML = `
      <option value="">Post to your feed</option>
      ${userGroups.map(group => 
        `<option value="${group._id}">${group.name}</option>`
      ).join('')}
    `;
  }

  // Share button functionality with group support
  if (sharePost) {
    sharePost.removeEventListener('click', handleShareClick);
    sharePost.addEventListener('click', handleShareClick);
  }

  async function handleShareClick(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (isUploading) {
      console.log('Upload already in progress, ignoring click');
      return;
    }
    
    console.log('Share button clicked');
    
    const captionInput = document.getElementById('postCaption');
    const locationInput = document.getElementById('postLocation');
    const groupSelector = document.getElementById('postGroupSelector');
    
    const caption = captionInput ? captionInput.value.trim() : '';
    const location = locationInput ? locationInput.value.trim() : '';
    const groupId = groupSelector ? groupSelector.value : '';

    if (!fileInput || !fileInput.files[0]) {
      alert('Please select an image');
      return;
    }

    // Set uploading state immediately
    isUploading = true;
    sharePost.disabled = true;
    sharePost.textContent = 'Sharing...';

    try {
      const formData = new FormData();
      formData.append('image', fileInput.files[0]);
      formData.append('caption', caption);
      formData.append('location', location);
      
      // Add group ID if posting to a group
      if (groupId) {
        formData.append('group', groupId);
      }

      console.log('Sending request to /posts', {
        caption,
        location,
        groupId: groupId || 'public feed'
      });

      const response = await fetch('/posts', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Post created successfully:', result);
        
        closeModal();
        
        // Show appropriate success message
        const postLocation = groupId ? 
          userGroups.find(g => g._id === groupId)?.name || 'group' : 
          'your feed';
        alert(`Post shared to ${postLocation} successfully!`);
        
        window.location.href = '/home';
        
      } else {
        const error = await response.json();
        console.error('Server error:', error);
        alert(error.error || 'Failed to create post');
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Failed to create post');
    } finally {
      // Reset uploading state
      isUploading = false;
      sharePost.disabled = false;
      sharePost.textContent = 'Share';
    }
  }

  function closeModal() {
    if (uploadModal) {
      uploadModal.classList.remove('open');
      resetModal();
    }
  }

  function resetModal() {
    if (fileInput) fileInput.value = '';
    
    const captionInput = document.getElementById('postCaption');
    const locationInput = document.getElementById('postLocation');
    const groupSelector = document.getElementById('postGroupSelector');
    
    if (captionInput) captionInput.value = '';
    if (locationInput) locationInput.value = '';
    if (groupSelector) groupSelector.value = '';
    
    // Reset to file selection view
    if (fileSelectArea) fileSelectArea.style.display = 'block';
    if (cropCanvas) cropCanvas.style.display = 'none';
    if (previewImage) {
      previewImage.style.display = 'none';
      previewImage.src = '';
    }
    
    isUploading = false;
  }

  // File input handler with proper image sizing
  if (fileInput) {
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        console.log('File selected:', file.name);
        const reader = new FileReader();
        reader.onload = function(e) {
          console.log('File loaded, showing preview');
          
          if (previewImage) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
          }
          
          // Switch to preview mode
          if (fileSelectArea) fileSelectArea.style.display = 'none';
          if (cropCanvas) cropCanvas.style.display = 'flex';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Change image button handler
  if (changeImage) {
    changeImage.addEventListener('click', function(e) {
      e.preventDefault();
      console.log('Change image clicked');
      
      // Reset file input and switch back to file selection
      if (fileInput) {
        fileInput.value = '';
        fileInput.click(); // Trigger file picker
      }
    });
  }

  // Close modal handlers
  if (uploadClose) {
    uploadClose.addEventListener('click', closeModal);
  }

  if (uploadModal) {
    uploadModal.addEventListener('click', function(e) {
      if (e.target === uploadModal || e.target.classList.contains('ig-modal__backdrop')) {
        closeModal();
      }
    });
  }

  // Keyboard handler for ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && uploadModal && uploadModal.classList.contains('open')) {
      closeModal();
    }
  });

  // Character count for caption
  const captionInput = document.getElementById('postCaption');
  const charCount = document.getElementById('captionCharCount');
  
  if (captionInput && charCount) {
    captionInput.addEventListener('input', function() {
      charCount.textContent = this.value.length;
    });
  }

  // Drag and drop functionality
  const dropzone = document.querySelector('.ig-dropzone');
  if (dropzone) {
    dropzone.addEventListener('dragover', function(e) {
      e.preventDefault();
      dropzone.style.background = '#f0f8ff';
    });

    dropzone.addEventListener('dragleave', function(e) {
      e.preventDefault();
      dropzone.style.background = '';
    });

    dropzone.addEventListener('drop', function(e) {
      e.preventDefault();
      dropzone.style.background = '';
      
      const files = e.dataTransfer.files;
      if (files.length > 0 && files[0].type.startsWith('image/')) {
        fileInput.files = files;
        // Trigger the change event manually
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });
  }
});