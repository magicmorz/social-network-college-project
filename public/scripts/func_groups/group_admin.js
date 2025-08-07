// public/scripts/func_groups/group_admin.js
function setupGroupAdmin() {
  console.log("🔧 Setting up group admin functionality...");

  // Global variables for group admin
  let currentGroupId = null;
  let currentGroupData = null;
  let isCurrentUserAdmin = false;
  let isCurrentUserCreator = false;

  // Get menu elements
  const groupAdminMenu = document.getElementById("group-admin-menu");
  const menuBackdrop = document.getElementById("menu-backdrop");

  if (!groupAdminMenu) {
    console.log("⚠️ Group admin menu not found in DOM");
    return;
  }

  // Setup group options buttons (three dots menu)
  document.addEventListener('click', async (e) => {
    if (e.target.closest('.group-options-btn')) {
      const btn = e.target.closest('.group-options-btn');
      const groupId = btn.dataset.groupId;
      
      console.log("🔍 Group options clicked for:", groupId);
      
      if (!groupId) {
        console.error("❌ No group ID found");
        return;
      }

      currentGroupId = groupId;
      
      // Fetch group details to check admin status
      try {
        const response = await fetch(`/groups/${groupId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch group details');
        }
        
        currentGroupData = await response.json();
        isCurrentUserAdmin = currentGroupData.isCurrentUserAdmin;
        isCurrentUserCreator = currentGroupData.isCurrentUserCreator;
        
        console.log("👤 Admin status:", { isCurrentUserAdmin, isCurrentUserCreator });
        
        // Show/hide admin options based on permissions
        updateAdminMenuVisibility();
        
        // Show the menu
        groupAdminMenu.style.display = "block";
        menuBackdrop.style.display = "block";
        
      } catch (error) {
        console.error("❌ Error fetching group details:", error);
        alert("Failed to load group details");
      }
    }
  });

  // Function to update menu visibility based on permissions
  function updateAdminMenuVisibility() {
    const deleteGroupBtn = groupAdminMenu.querySelector('.delete-group-btn');
    const manageAdminsBtn = groupAdminMenu.querySelector('.manage-admins-btn');
    const manageMembersBtn = groupAdminMenu.querySelector('.manage-members-btn');
    const editGroupBtn = groupAdminMenu.querySelector('.edit-group-btn');

    // Only show admin options if user is admin
    if (isCurrentUserAdmin || isCurrentUserCreator) {
      if (deleteGroupBtn) deleteGroupBtn.style.display = isCurrentUserCreator ? "block" : "none";
      if (manageAdminsBtn) manageAdminsBtn.style.display = "block";
      if (manageMembersBtn) manageMembersBtn.style.display = "block";
      if (editGroupBtn) editGroupBtn.style.display = "block";
    } else {
      if (deleteGroupBtn) deleteGroupBtn.style.display = "none";
      if (manageAdminsBtn) manageAdminsBtn.style.display = "none";
      if (manageMembersBtn) manageMembersBtn.style.display = "none";
      if (editGroupBtn) editGroupBtn.style.display = "none";
    }
  }

  // Close menu handlers
  function closeAdminMenu() {
    groupAdminMenu.style.display = "none";
    menuBackdrop.style.display = "none";
    currentGroupId = null;
    currentGroupData = null;
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cancel-group-btn') || e.target.id === 'menu-backdrop') {
      closeAdminMenu();
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN ACTION HANDLERS
  // ═══════════════════════════════════════════════════════════════════

  // Delete Group
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-group-btn')) {
      if (!currentGroupId || !isCurrentUserCreator) {
        alert("Only the group creator can delete the group");
        return;
      }

      const confirmed = confirm(`Are you sure you want to delete "${currentGroupData.name}"? This action cannot be undone and will delete all posts in the group.`);
      
      if (!confirmed) return;

      try {
        console.log("🗑️ Deleting group:", currentGroupId);
        
        const response = await fetch(`/api/group/${currentGroupId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log("📡 Delete response status:", response.status);
        console.log("📡 Delete response headers:", [...response.headers.entries()]);

        // Get response as text first
        const responseText = await response.text();
        console.log("📡 Raw response:", responseText.substring(0, 200));

        if (response.ok) {
          // Try to parse as JSON, but handle non-JSON responses
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            console.log("⚠️ Response is not JSON, but status is OK");
            result = { success: true };
          }
          
          console.log("✅ Group deleted successfully:", result);
          
          // Remove group from UI
          const groupElement = document.querySelector(`[data-group-id="${currentGroupId}"]`);
          if (groupElement) {
            groupElement.remove();
            console.log("🗑️ Removed group element from UI");
          }
          
          closeAdminMenu();
          alert("Group deleted successfully");
          
          // Redirect to home
          console.log("🔄 Redirecting to home...");
          window.location.href = '/home';
          
        } else {
          console.error("❌ Delete failed with status:", response.status);
          console.error("❌ Error response:", responseText);
          
          // Try to parse error as JSON, fallback to text
          let errorMessage;
          try {
            const error = JSON.parse(responseText);
            errorMessage = error.error || error.message || 'Failed to delete group';
          } catch {
            errorMessage = `HTTP ${response.status}: ${responseText || response.statusText}`;
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error("❌ Error deleting group:", error);
        alert("Error: " + error.message);
      }
    }
  });

  // Manage Admins
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('manage-admins-btn')) {
      if (!isCurrentUserAdmin && !isCurrentUserCreator) {
        alert("Only admins can manage other admins");
        return;
      }
      
      console.log("👥 Opening admin management for group:", currentGroupId);
      openAdminManagementModal();
    }
  });

  // Manage Members
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('manage-members-btn')) {
      if (!isCurrentUserAdmin && !isCurrentUserCreator) {
        alert("Only admins can manage members");
        return;
      }
      
      console.log("👥 Opening member management for group:", currentGroupId);
      openMemberManagementModal();
    }
  });

  // Edit Group
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-group-btn')) {
      if (!isCurrentUserAdmin && !isCurrentUserCreator) {
        alert("Only admins can edit group settings");
        return;
      }
      
      console.log("✏️ Opening group edit for group:", currentGroupId);
      openEditGroupModal();
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // MODAL FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════

  function openAdminManagementModal() {
    // Create or show admin management modal
    let modal = document.getElementById('admin-management-modal');
    if (!modal) {
      modal = createAdminManagementModal();
      document.body.appendChild(modal);
    }
    
    loadAdminList();
    modal.style.display = 'block';
    closeAdminMenu();
  }

  function openMemberManagementModal() {
    // Create or show member management modal
    let modal = document.getElementById('member-management-modal');
    if (!modal) {
      modal = createMemberManagementModal();
      document.body.appendChild(modal);
    }
    
    loadMemberList();
    modal.style.display = 'block';
    closeAdminMenu();
  }

  function openEditGroupModal() {
    // Create or show edit group modal
    let modal = document.getElementById('edit-group-modal');
    if (!modal) {
      modal = createEditGroupModal();
      document.body.appendChild(modal);
    }
    
    populateEditForm();
    modal.style.display = 'block';
    closeAdminMenu();
  }

  // ═══════════════════════════════════════════════════════════════════
  // MODAL CREATION FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════

  function createAdminManagementModal() {
    const modal = document.createElement('div');
    modal.id = 'admin-management-modal';
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Manage Admins</h3>
          <button class="close-admin-modal">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div id="admin-list-container">
            <h4>Current Admins</h4>
            <div id="current-admins-list" class="user-list"></div>
          </div>
          <div id="promote-member-container">
            <h4>Promote Members to Admin</h4>
            <div id="members-to-promote-list" class="user-list"></div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    modal.querySelector('.close-admin-modal').onclick = () => {
      modal.style.display = 'none';
    };

    return modal;
  }

  function createMemberManagementModal() {
    const modal = document.createElement('div');
    modal.id = 'member-management-modal';
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Manage Members</h3>
          <button class="close-member-modal">&times;</button>
        </div>
        <div class="admin-modal-body">
          <div id="member-list-container">
            <h4>Group Members</h4>
            <div id="current-members-list" class="user-list"></div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    modal.querySelector('.close-member-modal').onclick = () => {
      modal.style.display = 'none';
    };

    return modal;
  }

  function createEditGroupModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-group-modal';
    modal.className = 'admin-modal';
    modal.innerHTML = `
      <div class="admin-modal-content">
        <div class="admin-modal-header">
          <h3>Edit Group</h3>
          <button class="close-edit-modal">&times;</button>
        </div>
        <div class="admin-modal-body">
          <form id="edit-group-form">
            <div class="form-group">
              <label for="edit-group-name">Group Name</label>
              <input type="text" id="edit-group-name" class="form-control" required>
            </div>
            <div class="form-group">
              <label for="edit-group-description">Description</label>
              <textarea id="edit-group-description" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="edit-group-public"> Public Group
              </label>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Save Changes</button>
              <button type="button" class="btn btn-secondary close-edit-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add event listeners
    modal.querySelectorAll('.close-edit-modal').forEach(btn => {
      btn.onclick = () => modal.style.display = 'none';
    });

    modal.querySelector('#edit-group-form').onsubmit = handleEditGroupSubmit;

    return modal;
  }

  // ═══════════════════════════════════════════════════════════════════
  // DATA LOADING FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════

  async function loadAdminList() {
    // This would load the current admins and available members
    if (!currentGroupData) return;

    const currentAdminsList = document.getElementById('current-admins-list');
    const membersToPromoteList = document.getElementById('members-to-promote-list');

    // Display current admins
    currentAdminsList.innerHTML = currentGroupData.admins.map(admin => `
      <div class="user-item">
        <img src="${admin.avatar || '/avatars/default.jpg'}" alt="${admin.username}" class="user-avatar">
        <span class="username">${admin.username}</span>
        ${isCurrentUserCreator && admin._id !== currentGroupData.createdBy._id ? 
          `<button class="btn btn-sm btn-danger remove-admin-btn" data-user-id="${admin._id}">Remove Admin</button>` : 
          ''}
      </div>
    `).join('');

    // Display members who can be promoted
    const nonAdminMembers = currentGroupData.members.filter(member => 
      !currentGroupData.admins.some(admin => admin._id === member._id)
    );

    membersToPromoteList.innerHTML = nonAdminMembers.map(member => `
      <div class="user-item">
        <img src="${member.avatar || '/avatars/default.jpg'}" alt="${member.username}" class="user-avatar">
        <span class="username">${member.username}</span>
        <button class="btn btn-sm btn-primary add-admin-btn" data-user-id="${member._id}">Make Admin</button>
      </div>
    `).join('');

    // Add event listeners for admin actions
    document.querySelectorAll('.remove-admin-btn').forEach(btn => {
      btn.onclick = () => removeAdmin(btn.dataset.userId);
    });

    document.querySelectorAll('.add-admin-btn').forEach(btn => {
      btn.onclick = () => addAdmin(btn.dataset.userId);
    });
  }

  async function loadMemberList() {
    if (!currentGroupData) return;

    const currentMembersList = document.getElementById('current-members-list');

    currentMembersList.innerHTML = currentGroupData.members.map(member => `
      <div class="user-item">
        <img src="${member.avatar || '/avatars/default.jpg'}" alt="${member.username}" class="user-avatar">
        <span class="username">${member.username}</span>
        <span class="user-role">${currentGroupData.admins.some(admin => admin._id === member._id) ? 'Admin' : 'Member'}</span>
        ${member._id !== currentGroupData.createdBy._id ? 
          `<button class="btn btn-sm btn-danger remove-member-btn" data-user-id="${member._id}">Remove</button>` : 
          '<span class="creator-badge">Creator</span>'}
      </div>
    `).join('');

    // Add event listeners for member removal
    document.querySelectorAll('.remove-member-btn').forEach(btn => {
      btn.onclick = () => removeMember(btn.dataset.userId);
    });
  }

  function populateEditForm() {
    if (!currentGroupData) return;

    document.getElementById('edit-group-name').value = currentGroupData.name || '';
    document.getElementById('edit-group-description').value = currentGroupData.description || '';
    document.getElementById('edit-group-public').checked = currentGroupData.isPublic || false;
  }

  // ═══════════════════════════════════════════════════════════════════
  // API FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════

  async function addAdmin(userId) {
    try {
      console.log("➕ Adding admin:", userId);
      
      const response = await fetch(`/groups/${currentGroupId}/admin/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Admin added successfully");
        
        // Update currentGroupData
        currentGroupData.admins = result.admins;
        
        // Reload the admin list
        loadAdminList();
        
        alert("Admin added successfully");
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add admin');
      }
    } catch (error) {
      console.error("❌ Error adding admin:", error);
      alert("Error: " + error.message);
    }
  }

  async function removeAdmin(userId) {
    try {
      console.log("➖ Removing admin:", userId);
      
      const confirmed = confirm("Are you sure you want to remove this admin?");
      if (!confirmed) return;

      const response = await fetch(`/groups/${currentGroupId}/admin/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Admin removed successfully");
        
        // Update currentGroupData
        currentGroupData.admins = result.admins;
        
        // Reload the admin list
        loadAdminList();
        
        alert("Admin removed successfully");
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove admin');
      }
    } catch (error) {
      console.error("❌ Error removing admin:", error);
      alert("Error: " + error.message);
    }
  }

  async function removeMember(userId) {
    try {
      console.log("➖ Removing member:", userId);
      
      const confirmed = confirm("Are you sure you want to remove this member from the group?");
      if (!confirmed) return;

      const response = await fetch(`/groups/${currentGroupId}/member/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Member removed successfully");
        
        // Update currentGroupData
        currentGroupData.members = result.members;
        currentGroupData.admins = result.admins;
        
        // Reload the member list
        loadMemberList();
        
        alert("Member removed successfully");
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove member');
      }
    } catch (error) {
      console.error("❌ Error removing member:", error);
      alert("Error: " + error.message);
    }
  }

  async function handleEditGroupSubmit(e) {
    e.preventDefault();
    
    try {
      console.log("💾 Updating group settings");
      
      const formData = {
        name: document.getElementById('edit-group-name').value,
        description: document.getElementById('edit-group-description').value,
        isPublic: document.getElementById('edit-group-public').checked
      };

      const response = await fetch(`/groups/${currentGroupId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Group updated successfully");
        
        // Update currentGroupData
        currentGroupData = { ...currentGroupData, ...result.group };
        
        // Close modal
        document.getElementById('edit-group-modal').style.display = 'none';
        
        alert("Group updated successfully");
        
        // Optionally refresh the page or update UI
        location.reload();
        
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update group');
      }
    } catch (error) {
      console.error("❌ Error updating group:", error);
      alert("Error: " + error.message);
    }
  }

  // === Open group admin menu ===
  function openGroupAdminMenu(groupId, groupName) {
    console.log(`🔧 Opening admin menu for group: ${groupName} (${groupId})`);
    
    currentGroupId = groupId;
    
    // Fetch group details and show menu
    fetchGroupDetailsAndShowMenu(groupId);
  }

  // === Fetch group details and show admin menu ===
  async function fetchGroupDetailsAndShowMenu(groupId) {
    try {
      const response = await fetch(`/api/group/${groupId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }
      
      currentGroupData = await response.json();
      isCurrentUserAdmin = currentGroupData.isCurrentUserAdmin;
      isCurrentUserCreator = currentGroupData.isCurrentUserCreator;
      
      console.log("👤 Admin status:", { isCurrentUserAdmin, isCurrentUserCreator });
      
      // Show/hide admin options based on permissions
      updateAdminMenuVisibility();
      
      // Show the menu
      groupAdminMenu.style.display = "block";
      menuBackdrop.style.display = "block";
      
    } catch (error) {
      console.error("❌ Error fetching group details:", error);
      alert("Failed to load group details");
    }
  }

  // === Public API for other scripts ===
  window.GroupAdmin = {
    openAdminMenu: openGroupAdminMenu,
    setCurrentGroup: (groupId, groupName) => {
      currentGroupId = groupId;
      console.log(`Set current group: ${groupName} (${groupId})`);
    }
  };

  console.log("✅ Group admin functionality ready");
}

// Initialize when page loads
document.addEventListener("DOMContentLoaded", setupGroupAdmin);