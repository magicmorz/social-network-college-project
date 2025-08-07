// public/scripts/func_groups/group_popup.js
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
            // Use your existing route pattern
            window.location.href = '/home';
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

      // Load groups with admin status
      for (const group of groups) {
        await addGroupListItem(group._id, group.name, group);
      }
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

  // === Check if user is admin of a group ===
  async function checkAdminStatus(groupId) {
    try {
      const response = await fetch(`/api/group/${groupId}`);
      if (response.ok) {
        const groupData = await response.json();
        return {
          isAdmin: groupData.isCurrentUserAdmin || false,
          isCreator: groupData.isCurrentUserCreator || false
        };
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    return { isAdmin: false, isCreator: false };
  }

  // === Add one <li> for a group with admin button if applicable ===
  async function addGroupListItem(id, name, groupData = null) {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center justify-content-between';
    li.dataset.groupId = id;

    // Left side - group info (clickable)
    const groupInfo = document.createElement('div');
    groupInfo.className = 'd-flex align-items-center group-info-clickable';
    groupInfo.style.cursor = 'pointer';
    groupInfo.innerHTML = `
      <div class="avatar bg-light rounded-circle d-flex 
                  align-items-center justify-content-center me-3">
        <i class="bi bi-people fs-5 text-secondary"></i>
      </div>
      <div>
        <span class="group-name">${name}</span>
        <div class="group-badges"></div>
      </div>
    `;

    // Right side - admin button (if applicable)
    const adminSection = document.createElement('div');
    adminSection.className = 'd-flex align-items-center';

    // Check admin status
    let adminStatus = { isAdmin: false, isCreator: false };
    
    if (groupData) {
      // Use existing group data if available
      adminStatus.isAdmin = groupData.admins && groupData.admins.some(admin => 
        admin._id === window.currentUserId || admin.toString() === window.currentUserId
      );
      adminStatus.isCreator = groupData.createdBy && 
        (groupData.createdBy._id === window.currentUserId || groupData.createdBy.toString() === window.currentUserId);
    } else {
      // Fetch admin status
      adminStatus = await checkAdminStatus(id);
    }

    // Add badges
    const badgesContainer = groupInfo.querySelector('.group-badges');
    if (adminStatus.isCreator) {
      badgesContainer.innerHTML += '<small class="badge bg-warning text-dark me-1">Creator</small>';
    } else if (adminStatus.isAdmin) {
      badgesContainer.innerHTML += '<small class="badge bg-primary me-1">Admin</small>';
    }

    // Add admin button if user is admin or creator
    if (adminStatus.isAdmin || adminStatus.isCreator) {
      const adminBtn = document.createElement('button');
      adminBtn.className = 'btn btn-sm btn-outline-secondary group-admin-btn';
      adminBtn.innerHTML = '<i class="bi bi-gear"></i>';
      adminBtn.title = 'Group Settings';
      adminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openGroupAdminMenu(id, name);
      });
      adminSection.appendChild(adminBtn);
    }

    // Click handler for group info (navigate to group)
    groupInfo.addEventListener('click', () => {
      toggleMainPopup(false);
      window.location.href = `/home?group=${id}`;
    });

    li.appendChild(groupInfo);
    li.appendChild(adminSection);
    listEl.appendChild(li);
  }

  // === Open group admin menu ===
  function openGroupAdminMenu(groupId, groupName) {
    toggleMainPopup(false);
    
    // Trigger the group admin functionality
    if (window.GroupAdmin) {
      window.GroupAdmin.openAdminMenu(groupId, groupName);
    } else {
      // Fallback - simulate clicking the group options button
      console.log(`Opening admin menu for group: ${groupName} (${groupId})`);
      
      // Create a temporary button click event for the group admin system
      const tempBtn = document.createElement('button');
      tempBtn.className = 'group-options-btn';
      tempBtn.dataset.groupId = groupId;
      tempBtn.click();
      
      // Or redirect to group page where admin menu is available
      window.location.href = `/home?group=${groupId}`;
    }
  }

  // === Event Handlers ===
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

      await addGroupListItem(group._id, group.name, group);
      toggleCreateModal(false);
      alert('Group created successfully!');
    } catch (err) {
      console.error('Error creating group:', err);
      alert(err.message || 'Failed to create group');
    }
  });

  // === Public API for other scripts ===
  window.GroupPopup = {
    loadGroups,
    addGroupListItem,
    toggleMainPopup,
    openGroupAdminMenu
  };

  // === Initial load ===
  loadUsers();
  loadGroups();
});