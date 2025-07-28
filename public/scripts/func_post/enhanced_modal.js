// Enhanced Create Post Modal - JavaScript with group posting functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Enhanced modal script with groups loading...');

  const fileInput = document.getElementById('fileInput');
  const cropNext = document.getElementById('cropNext');
  const uploadModal = document.getElementById('uploadModal');
  const uploadClose = document.getElementById('uploadClose');
  const createBtn = document.getElementById('createBtn');

  let isUploading = false; // Prevent double submission
  let userGroups = []; // Store user's groups

  // Add CSS for proper image sizing in modal
  addModalImageCSS();
  
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
  if (cropNext) {
    cropNext.removeEventListener('click', handleShareClick);
    cropNext.addEventListener('click', handleShareClick);
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
    cropNext.disabled = true;
    cropNext.textContent = 'Sharing...';

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
      cropNext.disabled = false;
      cropNext.textContent = 'Share';
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
    if (locationInput) {
      locationInput.value = '';
      // Reset location autocomplete if available
      if (window.locationAutocomplete) {
        window.locationAutocomplete.reset();
      }
    }
    if (groupSelector) groupSelector.value = '';
    
    const steps = document.querySelectorAll('.ig-step');
    steps.forEach((step, index) => {
      step.style.display = index === 0 ? 'block' : 'none';
    });
    
    const previewImage = document.getElementById('previewImage');
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
        const reader = new FileReader();
        reader.onload = function(e) {
          const previewImage = document.getElementById('previewImage');
          if (previewImage) {
            previewImage.src = e.target.result;
            previewImage.style.display = 'block';
            
            // Apply proper sizing constraints to preview image
            previewImage.style.width = '100%';
            previewImage.style.height = 'auto';
            previewImage.style.maxWidth = '500px';
            previewImage.style.maxHeight = '500px';
            previewImage.style.objectFit = 'cover';
            previewImage.style.borderRadius = '8px';
          }
          
          const steps = document.querySelectorAll('.ig-step');
          if (steps.length > 1) {
            steps[0].style.display = 'none';
            steps[1].style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
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

  // Back button
  const cropBack = document.getElementById('cropBack');
  if (cropBack) {
    cropBack.addEventListener('click', function() {
      const steps = document.querySelectorAll('.ig-step');
      if (steps.length > 1) {
        steps[1].style.display = 'none';
        steps[0].style.display = 'block';
      }
    });
  }

  // Function to add CSS for proper modal image sizing
  function addModalImageCSS() {
    const style = document.createElement('style');
    style.textContent = `
      /* Modal Image Sizing Fixes */
      #uploadModal {
        z-index: 9999;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow-y: auto;
      }
      
      #uploadModal .ig-modal__content {
        max-width: 90vw;
        max-height: 90vh;
        margin: 2rem auto;
        overflow: hidden;
      }
      
      #previewImage {
        width: 100% !important;
        height: auto !important;
        max-width: 500px !important;
        max-height: 500px !important;
        object-fit: cover !important;
        display: block !important;
        margin: 0 auto !important;
        border-radius: 8px;
      }
      
      /* Group selector styling */
      #postGroupSelector {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        margin-bottom: 1rem;
        font-size: 0.9rem;
      }
      
      /* Image preview container */
      .image-preview-container {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        max-width: 100%;
        overflow: hidden;
      }
      
      /* Modal step containers */
      .ig-step {
        max-width: 100%;
        overflow: hidden;
      }
      
      /* Responsive adjustments for modal */
      @media (max-width: 768px) {
        #uploadModal .ig-modal__content {
          max-width: 95vw;
          margin: 1rem auto;
        }
        
        #previewImage {
          max-width: 100% !important;
          max-height: 400px !important;
        }
      }
      
      @media (max-width: 480px) {
        #previewImage {
          max-height: 300px !important;
        }
      }
      
      /* Ensure modal doesn't overflow */
      .ig-modal__backdrop {
        overflow-y: auto;
      }
      
      /* Fix for any existing post images in feed */
      .instagram-post img,
      .post img,
      .feed-post img {
        width: 100%;
        height: auto;
        max-width: 600px;
        max-height: 600px;
        object-fit: cover;
        display: block;
      }
    `;
    
    if (!document.querySelector('#modal-image-styles')) {
      style.id = 'modal-image-styles';
      document.head.appendChild(style);
    }
  }
});