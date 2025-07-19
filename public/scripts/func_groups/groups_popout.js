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
      </li>`;
    listEl.querySelector('#createGroupBtn')
          .addEventListener('click', onCreateClicked);

    try {
      // FIXED: Changed from /api/groups to /api/group
      const res = await fetch('/api/group');
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const groups = await res.json();
      
      // Your backend returns an array directly, not { success, groups }
      if (!Array.isArray(groups)) {
        throw new Error('Expected array of groups');
      }

      groups.forEach(g => addGroupListItem(g._id, g.name));
    } catch (err) {
      console.error('Error loading groups:', err);
      // Show error in UI
      listEl.innerHTML += `<li class="list-group-item text-danger">Error loading groups: ${err.message}</li>`;
    }
  }

  // === Fetch & render user checkboxes ===
  async function loadUsers() {
    memberListDiv.innerHTML = `<p class="text-center small">Loading users…</p>`;
    try {
      const res = await fetch('/api/users');
      
      // Check if response is JSON
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

  // === Add one <li> for a group and wire its click to filter posts ===
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
      document.querySelectorAll('.instagram-post').forEach(postEl => {
        // assumes your EJS prints `<div … data-group-id="<%= post.group %>">`
        postEl.style.display = postEl.dataset.groupId === id
          ? '' : 'none';
      });
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
    // uncheck all once we re‑show it
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
      // FIXED: Changed from /api/groups to /api/group
      const res = await fetch('/api/group', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, members: memberIds })
      });
      
      // Check if response is JSON
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

      // Your backend returns the group directly, not { success: true, group }
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