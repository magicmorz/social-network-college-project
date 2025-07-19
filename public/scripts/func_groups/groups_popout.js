// public/scripts/func_groups/groups_popout.js
document.addEventListener('DOMContentLoaded', () => {
  const btn               = document.getElementById('groupsBtn');
  const overlay           = document.getElementById('popupOverlay');
  const popup             = document.getElementById('groupsPopup');
  const closeBtn          = document.getElementById('closeGroupsPopup');
  const listEl            = document.getElementById('groupsList');
  const createBtn         = document.getElementById('createGroupBtn');
  const createModal       = document.getElementById('createGroupModal');
  const cancelCreateBtn   = document.getElementById('cancelCreateGroup');
  const submitCreateBtn   = document.getElementById('submitCreateGroup');
  const newGroupNameInput = document.getElementById('newGroupName');
  const memberListDiv     = document.getElementById('memberList');

  // === Helpers to show/hide the two popups ===
  function toggleMainPopup(open) {
    overlay.classList.toggle('active', open);
    popup.classList.toggle('active', open);
  }
  function toggleCreateModal(open) {
    overlay.classList.toggle('active', open);
    createModal.classList.toggle('active', open);
  }

  // === Fetch & render current groups ===
  async function loadGroups() {
    listEl.innerHTML = `
      <li id="createGroupBtn" class="list-group-item create-group d-flex align-items-center">
        <i class="bi bi-plus-lg text-primary fs-5 me-3"></i>
        <span class="text-primary">Create Group</span>
      </li>
      <li id="showAllPostsBtn" class="list-group-item d-flex align-items-center">
        <div class="avatar bg-light rounded-circle d-flex 
                    align-items-center justify-content-center me-3">
          <i class="bi bi-house fs-5 text-secondary"></i>
        </div>
        <span>All Posts</span>
      </li>`;
    
    // Add event listeners for the buttons
    listEl.querySelector('#createGroupBtn')
          .addEventListener('click', onCreateClicked);
    listEl.querySelector('#showAllPostsBtn')
          .addEventListener('click', () => {
            toggleMainPopup(false);
            showAllPosts();
          });

    try {
      const res = await fetch('/api/group');
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const groups = await res.json();
      
      if (!Array.isArray(groups)) {
        throw new Error('Expected array of groups');
      }

      groups.forEach(g => addGroupListItem(g._id, g.name));
    } catch (err) {
      console.error('Error loading groups:', err);
      listEl.innerHTML += `<li class="list-group-item text-danger">Error loading groups: ${err.message}</li>`;
    }
  }

  // === Fetch & render user checkboxes ===
  async function loadUsers() {
    memberListDiv.innerHTML = `<p class="text-center small">Loading users…</p>`;
    try {
      const res = await fetch('/api/users');
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const users = await res.json();
      if (!Array.isArray(users)) {
        throw new Error('Expected array of users');
      }

      memberListDiv.innerHTML = '';
      users.forEach(u => {
        const wrapper = document.createElement('div');
        wrapper.className = 'form-check';
        wrapper.innerHTML = `
          <input class="form-check-input" type="checkbox" 
                 value="${u._id}" id="user-${u._id}">
          <label class="form-check-label" for="user-${u._id}">
            ${u.username}
          </label>`;
        memberListDiv.appendChild(wrapper);
      });
    } catch (err) {
      console.error('Failed to load users:', err);
      memberListDiv.innerHTML = `<p class="text-danger small">Failed to load users: ${err.message}</p>`;
    }
  }

  // === Show all posts (default feed) ===
  function showAllPosts() {
    console.log('Showing all posts');
    
    // Add loading indicator
    const postsContainer = document.querySelector('.d-flex.flex-column.align-items-center');
    if (postsContainer) {
      postsContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"></div><p>Loading posts...</p></div>';
    }
    
    // Reload the page to show all posts
    window.location.href = '/home';
  }

  // === Load and display group posts ===
  async function loadGroupPosts(groupId, groupName) {
    console.log('Loading posts for group:', groupName);
    
    const postsContainer = document.querySelector('.d-flex.flex-column.align-items-center');
    if (!postsContainer) {
      console.error('Posts container not found');
      return;
    }

    // Show loading state
    postsContainer.innerHTML = `
      <div class="text-center p-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading posts from ${groupName}...</p>
      </div>
    `;

    try {
      const response = await fetch(`/api/group/${groupId}/posts`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }
      
      const posts = await response.json();
      
      console.log(`Found ${posts.length} posts in group ${groupName}`);
      
      if (posts.length === 0) {
        postsContainer.innerHTML = `
          <div class="text-center mt-5">
            <i class="bi bi-people fs-1 text-muted"></i>
            <h5 class="text-muted mt-3">No posts in ${groupName} yet</h5>
            <p class="text-muted">Be the first to share something with this group!</p>
            <button class="btn btn-primary" onclick="document.getElementById('createBtn').click()">
              Create Post
            </button>
          </div>
        `;
        return;
      }

      // Clear container and add group header
      postsContainer.innerHTML = `
        <div class="group-header w-100 mb-4 text-center">
          <div class="d-flex align-items-center justify-content-center mb-2">
            <button id="backToAllPosts" class="btn btn-outline-secondary btn-sm me-3">
              <i class="bi bi-arrow-left"></i> Back to All Posts
            </button>
            <h4 class="mb-0">
              <i class="bi bi-people me-2"></i>${groupName}
            </h4>
          </div>
          <p class="text-muted">${posts.length} post${posts.length !== 1 ? 's' : ''}</p>
        </div>
      `;

      // Add back button functionality
      document.getElementById('backToAllPosts').addEventListener('click', showAllPosts);

      // Add posts to the container
      posts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
      });

      // Reinitialize post event listeners if they exist
      if (window.initializePostEventListeners) {
        window.initializePostEventListeners();
      }

    } catch (error) {
      console.error('Error loading group posts:', error);
      postsContainer.innerHTML = `
        <div class="text-center mt-5">
          <i class="bi bi-exclamation-triangle fs-1 text-danger"></i>
          <h5 class="text-danger mt-3">Error loading posts</h5>
          <p class="text-muted">${error.message}</p>
          <button class="btn btn-primary" onclick="window.location.reload()">
            Try Again
          </button>
        </div>
      `;
    }
  }

  // === Create post HTML element ===
  function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'instagram-post posts-container mb-4';
    postDiv.setAttribute('data-post-id', post._id);
    postDiv.setAttribute('data-group', post.group || '');
    
    const timeAgo = formatTimeAgo(post.createdAt);
    
    postDiv.innerHTML = `
      <!-- Post Header -->
      <div class="d-flex align-items-center justify-content-between p-3">
        <div class="d-flex align-items-center">
          <div class="profile-picture-container">
            <a href="/u/${post.user.username}">
              <img
                src="${post.user.avatar || '/avatars/default.jpg'}"
                alt="${post.user.username}"
                class="profile-img"
                style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
              />
            </a>
          </div>
          <div class="ms-2">
            <div class="d-flex align-items-center">
              <div class="username-top-header fw-bold">
                <a href="/u/${post.user.username}" class="username-link text-decoration-none text-dark">
                  ${post.user.username}
                </a>
                ${post.user.isVerified ? '<span class="verified-badge"></span>' : ''}
              </div>
              <span class="text-muted mx-1">•</span>
              <div class="time-since-posted-header text-muted small">
                ${timeAgo}
              </div>
            </div>
            ${post.location ? `<div class="location-top-header text-muted small">${post.location}</div>` : ''}
          </div>
        </div>
        <button class="btn btn-link text-dark more-options-btn" data-post-id="${post._id}">
          <i class="bi bi-three-dots"></i>
        </button>
      </div>

      <!-- Post Image -->
      <div class="post-image">
        <img
          src="${post.image}"
          alt="Post image"
          class="w-100"
          style="max-height: 600px; object-fit: cover;"
        />
      </div>

      <!-- Post Actions -->
      <div class="post-actions p-3">
        <div class="d-flex align-items-center mb-2">
          <button class="btn btn-link text-dark p-0 me-3 like-btn" data-post-id="${post._id}" aria-label="Like post">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
          <button class="btn btn-link text-dark p-0 me-3" aria-label="Comment on post">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </button>
          <button class="btn btn-link text-dark p-0 me-3" aria-label="Share">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
              <polyline points="16,6 12,2 8,6"></polyline>
              <line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
          </button>
        </div>

        <!-- Likes -->
        <div class="likes-simple mb-2">
          <span class="likes-count fw-bold likes-number">
            ${post.likes ? post.likes.length : 0}
          </span>
          <span class="likes-text fw-bold"> likes</span>
        </div>

        <!-- Caption -->
        ${post.caption ? `
          <div class="caption mb-2">
            <span class="caption-username fw-bold">
              <a href="/u/${post.user.username}" class="username-link text-decoration-none text-dark">
                ${post.user.username}
              </a>
            </span>
            <span class="caption-text"> ${post.caption}</span>
          </div>
        ` : ''}

        <!-- View Comments Button -->
        <div class="view-comments mb-2">
          <button class="btn btn-link text-muted p-0">
            ${post.comments && post.comments.length > 0 
              ? `View all ${post.comments.length} comment${post.comments.length !== 1 ? 's' : ''}` 
              : 'Be the first to comment'}
          </button>
        </div>

        <!-- Comments Section -->
        <div class="comments-section" style="display: none;"></div>

        <!-- Add Comment -->
        <div class="add-comment d-flex align-items-center">
          <input
            type="text"
            class="form-control border-0 comment-input"
            placeholder="Add a comment..."
            data-post-id="${post._id}"
            style="background: transparent;"
          />
          <button class="btn btn-link text-muted p-0 ms-2 emoji-btn">
            <i class="bi bi-emoji-smile"></i>
          </button>
          <button class="btn btn-link fw-bold p-0 ms-2 post-comment-btn comment-submit-btn" 
                  data-post-id="${post._id}" 
                  style="display: none; color: #0095f6;">
            Post
          </button>
        </div>
      </div>
    `;
    
    return postDiv;
  }

  // === Format time ago ===
  function formatTimeAgo(dateString) {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInSeconds = Math.floor((now - postDate) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    if (diffInSeconds < 2419200) return `${Math.floor(diffInSeconds / 604800)}w`;
    
    return postDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }

  // === Add one <li> for a group and wire its click to load group posts ===
  function addGroupListItem(id, name) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center';
    li.dataset.groupId = id;
    li.innerHTML = `
      <div class="avatar bg-light rounded-circle d-flex 
                  align-items-center justify-content-center me-3">
        <i class="bi bi-people fs-5 text-secondary"></i>
      </div>
      <span>${name}</span>
    `;
    li.addEventListener('click', () => {
      toggleMainPopup(false);
      loadGroupPosts(id, name); // Load actual group posts from server
    });
    listEl.appendChild(li);
  }

  // === Handlers ===
  btn.addEventListener('click', e => {
    e.preventDefault();
    toggleMainPopup(!popup.classList.contains('active'));
  });
  closeBtn.addEventListener('click', () => toggleMainPopup(false));
  overlay.addEventListener('click', () => {
    if (createModal.classList.contains('active')) {
      toggleCreateModal(false);
    } else {
      toggleMainPopup(false);
    }
  });

  function onCreateClicked() {
    toggleMainPopup(false);
    newGroupNameInput.value = '';
    memberListDiv.querySelectorAll('input').forEach(cb => cb.checked = false);
    toggleCreateModal(true);
  }

  cancelCreateBtn.addEventListener('click', () => toggleCreateModal(false));

  submitCreateBtn.addEventListener('click', async () => {
    const name = newGroupNameInput.value.trim();
    if (!name) return alert('Please enter a group name.');

    const memberIds = Array.from(
      memberListDiv.querySelectorAll('input:checked')
    ).map(cb => cb.value);

    try {
      const res = await fetch('/api/group', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, members: memberIds })
      });
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const group = await res.json();
      
      if (!res.ok) {
        throw new Error(group.error || res.statusText);
      }

      addGroupListItem(group._id, group.name);
      toggleCreateModal(false);
      alert('Group created successfully!');
    } catch (err) {
      console.error('Error creating group:', err);
      alert(err.message || 'Failed to create group');
    }
  });

  // === initial load ===
  loadUsers();
  loadGroups();
});