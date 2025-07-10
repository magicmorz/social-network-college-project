// Enhanced Create Post Modal - JavaScript with duplicate prevention
document.addEventListener('DOMContentLoaded', function() {
  console.log('Enhanced modal script loading...');

  const fileInput = document.getElementById('fileInput');
  const cropNext = document.getElementById('cropNext');
  const uploadModal = document.getElementById('uploadModal');
  const uploadClose = document.getElementById('uploadClose');
  const createBtn = document.getElementById('createBtn');

  let isUploading = false; // Prevent double submission

  // Remove any existing event listeners first
  if (createBtn) {
    createBtn.removeEventListener('click', handleCreateClick);
    createBtn.addEventListener('click', handleCreateClick);
  }

  function handleCreateClick(e) {
    e.preventDefault();
    console.log('Create button clicked - opening modal');
    uploadModal.classList.add('open');
  }

  // Share button functionality with enhanced duplicate prevention
  if (cropNext) {
    // Remove existing listeners
    cropNext.removeEventListener('click', handleShareClick);
    cropNext.addEventListener('click', handleShareClick);
  }

  async function handleShareClick(e) {
    e.preventDefault();
    e.stopPropagation(); // Stop event bubbling
    
    // Prevent double submission
    if (isUploading) {
      console.log('Upload already in progress, ignoring click');
      return;
    }
    
    console.log('Share button clicked');
    
    const captionInput = document.getElementById('postCaption');
    const locationInput = document.getElementById('postLocation');
    
    const caption = captionInput ? captionInput.value.trim() : '';
    const location = locationInput ? locationInput.value.trim() : '';

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

      console.log('Sending request to /posts');
      const response = await fetch('/posts', {
        method: 'POST',
        body: formData
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Post created successfully:', result);
        
        closeModal();
        alert('Post created successfully!');
        window.location.href = '/home'; // Redirect instead of reload
        
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

  // Rest of your functions...
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
    
    if (captionInput) captionInput.value = '';
    if (locationInput) locationInput.value = '';
    
    const steps = document.querySelectorAll('.ig-step');
    steps.forEach((step, index) => {
      step.style.display = index === 0 ? 'block' : 'none';
    });
    
    const previewImage = document.getElementById('previewImage');
    if (previewImage) {
      previewImage.style.display = 'none';
      previewImage.src = '';
    }
    
    // Reset uploading state
    isUploading = false;
  }

  // File input and other handlers...
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
});