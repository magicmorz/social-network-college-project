/* ================================================================
   search_panel.js  –  Enhanced search with tabs and infinite scroll
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------
     DOM references
     --------------------------------------------------------------- */
  const panel = document.getElementById('searchPanel');
  const btnOpen = document.getElementById('openSearchBtn');
  const btnClose = document.getElementById('searchCloseBtn');
  const sidebar = document.querySelector('.sidebar');

  // Tab elements
  const searchTabs = document.querySelectorAll('.search-tab');
  const usersTab = document.getElementById('usersTab');
  const postsTab = document.getElementById('postsTab');

  // User search elements
  const userSearchField = document.getElementById('userSearchField');
  const userAdvancedBtn = document.getElementById('userAdvancedBtn');
  const userAdvancedForm = document.getElementById('userAdvancedForm');
  const userResults = document.getElementById('userResults');
  const userLoading = document.getElementById('userLoading');

  // Post search elements
  const postSearchField = document.getElementById('postSearchField');
  const postAdvancedBtn = document.getElementById('postAdvancedBtn');
  const postAdvancedForm = document.getElementById('postAdvancedForm');
  const postResults = document.getElementById('postResults');
  const postLoading = document.getElementById('postLoading');

  // Current active tab and search state
  let currentTab = 'users';
  let userSearchState = { page: 1, hasMore: true, loading: false, lastQuery: '' };
  let postSearchState = { page: 1, hasMore: true, loading: false, lastQuery: '' };

  /* ---------------------------------------------------------------
     1 • guarantee a clean state on every page load
     --------------------------------------------------------------- */
  panel.classList.remove('open');
  sidebar.classList.remove('collapsed');

  /* ---------------------------------------------------------------
     2 • helper – open / close drawer + collapse sidebar
     --------------------------------------------------------------- */
  function togglePanel(force) {
    const willOpen = (force !== undefined) ? force : !panel.classList.contains('open');

    panel.classList.toggle('open', willOpen);
    sidebar.classList.toggle('collapsed', willOpen);

    if (willOpen) {
      const activeSearchField = currentTab === 'users' ? userSearchField : postSearchField;
      activeSearchField.focus();
    }
  }

  /* ---------------------------------------------------------------
     3 • Tab switching functionality
     --------------------------------------------------------------- */
  function switchTab(tabName) {
    // Update tab buttons
    searchTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    usersTab.classList.toggle('active', tabName === 'users');
    postsTab.classList.toggle('active', tabName === 'posts');

    currentTab = tabName;

    // Focus the search field of the active tab
    const activeSearchField = tabName === 'users' ? userSearchField : postSearchField;
    activeSearchField.focus();

    // Clear results when switching tabs
    if (tabName === 'users') {
      userResults.innerHTML = '';
      userSearchState = { page: 1, hasMore: true, loading: false, lastQuery: '' };
    } else {
      postResults.innerHTML = '';
      postSearchState = { page: 1, hasMore: true, loading: false, lastQuery: '' };
    }
  }

  /* ---------------------------------------------------------------
     4 • Search functionality
     --------------------------------------------------------------- */
  let searchTimeout;

  function debounce(func, delay) {
    return function(...args) {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // User search
  async function searchUsers(isAdvanced = false, loadMore = false) {
    const query = userSearchField.value.trim();
    
    if (!loadMore && !query && !isAdvanced) {
      userResults.innerHTML = '';
      userSearchState = { page: 1, hasMore: true, loading: false, lastQuery: '' };
      return;
    }

    // Prevent multiple simultaneous requests
    if (userSearchState.loading) return;
    
    // Reset if it's a new search
    if (!loadMore || userSearchState.lastQuery !== query) {
      userSearchState = { page: 1, hasMore: true, loading: false, lastQuery: query };
      if (!loadMore) userResults.innerHTML = '';
    }

    if (!userSearchState.hasMore && loadMore) return;

    userSearchState.loading = true;
    userLoading.style.display = 'block';

    try {
      const params = new URLSearchParams({
        username: query,
        page: userSearchState.page.toString(),
        limit: '20'
      });

      if (isAdvanced) {
        const joinedAfter = document.getElementById('userJoinedAfter')?.value;
        const isVerified = document.getElementById('userIsVerified')?.checked;
        const group = document.getElementById('userGroup')?.value;

        if (joinedAfter) params.append('joinedAfter', joinedAfter);
        if (isVerified) params.append('isVerified', 'true');
        if (group) params.append('group', group);
      }

      const response = await fetch(`/search/users?${params}`);
      const data = await response.json();

      if (data.users && data.users.length > 0) {
        if (loadMore) {
          appendUserResults(data.users);
        } else {
          renderUserResults(data.users);
        }
        userSearchState.page++;
        userSearchState.hasMore = data.users.length === 20; // Assume no more if less than limit
      } else {
        if (!loadMore) {
          userResults.innerHTML = '<div class="text-center text-muted mt-3">No users found</div>';
        }
        userSearchState.hasMore = false;
      }
    } catch (error) {
      console.error('Error searching users:', error);
      if (!loadMore) {
        userResults.innerHTML = '<div class="text-center text-danger mt-3">Error searching users</div>';
      }
    } finally {
      userSearchState.loading = false;
      userLoading.style.display = 'none';
    }
  }

  // Post search
  async function searchPosts(isAdvanced = false, loadMore = false) {
    const query = postSearchField.value.trim();
    
    if (!loadMore && !query && !isAdvanced) {
      postResults.innerHTML = '';
      postSearchState = { page: 1, hasMore: true, loading: false, lastQuery: '' };
      return;
    }

    // Prevent multiple simultaneous requests
    if (postSearchState.loading) return;
    
    // Reset if it's a new search
    if (!loadMore || postSearchState.lastQuery !== query) {
      postSearchState = { page: 1, hasMore: true, loading: false, lastQuery: query };
      if (!loadMore) postResults.innerHTML = '';
    }

    if (!postSearchState.hasMore && loadMore) return;

    postSearchState.loading = true;
    postLoading.style.display = 'block';

    try {
      const params = new URLSearchParams({
        caption: query,
        page: postSearchState.page.toString(),
        limit: '20'
      });

      if (isAdvanced) {
        const type = document.getElementById('postType')?.value;
        const dateFrom = document.getElementById('postDateFrom')?.value;
        const dateTo = document.getElementById('postDateTo')?.value;
        const tags = document.getElementById('postTags')?.value;

        if (type) params.append('type', type);
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (tags) params.append('tags', tags);
      }

      const response = await fetch(`/search/posts?${params}`);
      const data = await response.json();

      if (data.posts && data.posts.length > 0) {
        if (loadMore) {
          appendPostResults(data.posts);
        } else {
          renderPostResults(data.posts);
        }
        postSearchState.page++;
        postSearchState.hasMore = data.posts.length === 20; // Assume no more if less than limit
      } else {
        if (!loadMore) {
          postResults.innerHTML = '<div class="text-center text-muted mt-3">No posts found</div>';
        }
        postSearchState.hasMore = false;
      }
    } catch (error) {
      console.error('Error searching posts:', error);
      if (!loadMore) {
        postResults.innerHTML = '<div class="text-center text-danger mt-3">Error searching posts</div>';
      }
    } finally {
      postSearchState.loading = false;
      postLoading.style.display = 'none';
    }
  }

  /* ---------------------------------------------------------------
     5 • Render search results
     --------------------------------------------------------------- */
  function renderUserResults(users) {
    const html = users.map(user => `
      <div class="search-result-item">
        <div class="search-result-user">
          <a href="/u/${user.username}" class="avatar-link">
            <img src="${user.avatar || '/avatars/default.jpg'}" alt="${user.username}" class="user-avatar">
          </a>
          <div class="user-info">
            <div class="username">
              <a href="/u/${user.username}" class="username-link">${user.username}</a>
              ${user.isVerified ? '<span class="verified-badge"></span>' : ''}
            </div>
            <div class="user-details">
              ${user.email} • Joined ${new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    userResults.innerHTML = html;
  }

  function appendUserResults(users) {
    const html = users.map(user => `
      <div class="search-result-item">
        <div class="search-result-user">
          <a href="/u/${user.username}" class="avatar-link">
            <img src="${user.avatar || '/avatars/default.jpg'}" alt="${user.username}" class="user-avatar">
          </a>
          <div class="user-info">
            <div class="username">
              <a href="/u/${user.username}" class="username-link">${user.username}</a>
              ${user.isVerified ? '<span class="verified-badge"></span>' : ''}
            </div>
            <div class="user-details">
              ${user.email} • Joined ${new Date(user.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    userResults.insertAdjacentHTML('beforeend', html);
  }

  function renderPostResults(posts) {
    const html = posts.map(post => `
      <div class="search-result-item">
        <div class="search-result-post">
          <img src="${post.image}" alt="Post" class="post-image">
          <div class="post-info">
            <div class="post-caption">${post.caption || 'No caption'}</div>
            <div class="post-meta">
              By ${post.user.username}${post.user.isVerified ? ' <span class="verified-badge"></span>' : ''} • 
              ${new Date(post.createdAt).toLocaleDateString()} • 
              ${post.type}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    postResults.innerHTML = html;
  }

  function appendPostResults(posts) {
    const html = posts.map(post => `
      <div class="search-result-item">
        <div class="search-result-post">
          <img src="${post.image}" alt="Post" class="post-image">
          <div class="post-info">
            <div class="post-caption">${post.caption || 'No caption'}</div>
            <div class="post-meta">
              By ${post.user.username}${post.user.isVerified ? ' <span class="verified-badge"></span>' : ''} • 
              ${new Date(post.createdAt).toLocaleDateString()} • 
              ${post.type}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    postResults.insertAdjacentHTML('beforeend', html);
  }

  /* ---------------------------------------------------------------
     6 • Infinite scroll functionality
     --------------------------------------------------------------- */
  function setupInfiniteScroll() {
    userResults.addEventListener('scroll', () => {
      if (userResults.scrollTop + userResults.clientHeight >= userResults.scrollHeight - 10) {
        if (currentTab === 'users' && userSearchState.hasMore && !userSearchState.loading) {
          searchUsers(userAdvancedForm.style.display !== 'none', true);
        }
      }
    });

    postResults.addEventListener('scroll', () => {
      if (postResults.scrollTop + postResults.clientHeight >= postResults.scrollHeight - 10) {
        if (currentTab === 'posts' && postSearchState.hasMore && !postSearchState.loading) {
          searchPosts(postAdvancedForm.style.display !== 'none', true);
        }
      }
    });
  }

  /* ---------------------------------------------------------------
     7 • Event listeners
     --------------------------------------------------------------- */

  // Tab switching
  searchTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // Panel toggle
  btnOpen.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.contains('open') ? togglePanel(false) : togglePanel(true);
  });

  btnClose.addEventListener('click', () => togglePanel(false));

  // Advanced search toggles
  userAdvancedBtn.addEventListener('click', () => {
    const isVisible = userAdvancedForm.style.display !== 'none';
    userAdvancedForm.style.display = isVisible ? 'none' : 'block';
    userAdvancedBtn.textContent = isVisible ? 'Advanced Search' : 'Hide Advanced';
  });

  postAdvancedBtn.addEventListener('click', () => {
    const isVisible = postAdvancedForm.style.display !== 'none';
    postAdvancedForm.style.display = isVisible ? 'none' : 'block';
    postAdvancedBtn.textContent = isVisible ? 'Advanced Search' : 'Hide Advanced';
  });

  // Search input listeners
  userSearchField.addEventListener('input', debounce(() => {
    searchUsers();
  }, 300));

  postSearchField.addEventListener('input', debounce(() => {
    searchPosts();
  }, 300));

  // Advanced search form submissions
  userAdvancedForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchUsers(true);
  });

  postAdvancedForm.addEventListener('submit', (e) => {
    e.preventDefault();
    searchPosts(true);
  });

  // Advanced search field changes
  userAdvancedForm.addEventListener('change', () => {
    searchUsers(true);
  });

  postAdvancedForm.addEventListener('change', () => {
    searchPosts(true);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      togglePanel(false);
    }
  });

  // Outside click handler
  document.addEventListener('click', (e) => {
    if (!panel.classList.contains('open')) return;

    const clickedInsidePanel = panel.contains(e.target);
    const clickedMagnifier = btnOpen.contains(e.target);

    if (clickedInsidePanel || clickedMagnifier) return;

    const activeSearchField = currentTab === 'users' ? userSearchField : postSearchField;
    
    if (document.activeElement === activeSearchField) {
      activeSearchField.blur();
      return;
    }

    togglePanel(false);
  });

  // Window resize handler
  window.addEventListener('resize', () => {
    if (panel.classList.contains('open')) {
      togglePanel(false);
    }
  });

  // Initialize infinite scroll
  setupInfiniteScroll();
});
