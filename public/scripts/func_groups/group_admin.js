/**
 * GROUP ADMIN FUNCTIONALITY
 * 
 * This script provides comprehensive group administration capabilities for users
 * with appropriate permissions. It handles the complex UI and API interactions
 * needed for group management including:
 * 
 * CORE FEATURES:
 * - Group deletion (creator only)
 * - Admin management (promote/demote members)
 * - Member management (remove members from group)
 * - Group settings modification (name, description, privacy)
 * - Permission-based UI visibility (dynamic menu options)
 * 
 * SECURITY MODEL:
 * - Creators have full permissions (delete group, manage all admins/members)
 * - Admins can manage members and settings but cannot delete group
 * - Non-admins see no administrative options
 * - All actions are validated both client-side and server-side
 * 
 * UI ARCHITECTURE:
 * - Main admin menu (triggered by three-dots button)
 * - Modal-based interfaces for detailed management
 * - Dynamic content loading and real-time updates
 * - Responsive design with proper accessibility
 */

// public/scripts/func_groups/group_admin.js

/**
 * MAIN SETUP FUNCTION
 * Initializes all group admin functionality and sets up event listeners.
 * This function is the entry point that configures the entire admin system.
 */
function setupGroupAdmin() {
  console.log("🔧 Setting up group admin functionality...");

  // ═══════════════════════════════════════════════════════════════════
  // GLOBAL STATE MANAGEMENT
  // These variables track the current group context and user permissions
  // ═══════════════════════════════════════════════════════════════════

  let currentGroupId = null;        // ID of the group currently being managed
  let currentGroupData = null;      // Complete group data object from server
  let isCurrentUserAdmin = false;   // Whether current user has admin privileges
  let isCurrentUserCreator = false; // Whether current user created this group

  // ═══════════════════════════════════════════════════════════════════
  // DOM ELEMENT REFERENCES
  // Cache critical DOM elements to avoid repeated queries
  // ═══════════════════════════════════════════════════════════════════

  const groupAdminMenu = document.getElementById("group-admin-menu");
  const menuBackdrop = document.getElementById("menu-backdrop");

  // Validate that required DOM elements exist
  if (!groupAdminMenu) {
    console.log("⚠️ Group admin menu not found in DOM");
    return; // Exit early if essential elements are missing
  }

  // ═══════════════════════════════════════════════════════════════════
  // PRIMARY EVENT LISTENER SETUP
  // Handle clicks on group options buttons (three dots menu)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * MAIN MENU TRIGGER HANDLER
   * Listens for clicks on group options buttons throughout the page.
   * Uses event delegation to handle dynamically created buttons.
   * Fetches group data and shows admin menu with appropriate permissions.
   */
  document.addEventListener('click', async (e) => {
    // Check if click target is a group options button (or child of one)
    if (e.target.closest('.group-options-btn')) {
      const btn = e.target.closest('.group-options-btn');
      const groupId = btn.dataset.groupId;
      
      console.log("🔍 Group options clicked for:", groupId);
      
      // Validate that button has required data attribute
      if (!groupId) {
        console.error("❌ No group ID found");
        return;
      }

      // Store the group ID for subsequent operations
      currentGroupId = groupId;
      
      // Fetch group details to determine user permissions
      try {
        const response = await fetch(`/groups/${groupId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch group details');
        }
        
        // Parse group data and extract permission information
        currentGroupData = await response.json();
        isCurrentUserAdmin = currentGroupData.isCurrentUserAdmin;
        isCurrentUserCreator = currentGroupData.isCurrentUserCreator;
        
        console.log("👤 Admin status:", { isCurrentUserAdmin, isCurrentUserCreator });
        
        // Configure menu visibility based on user permissions
        updateAdminMenuVisibility();
        
        // Display the admin menu with backdrop
        groupAdminMenu.style.display = "block";
        menuBackdrop.style.display = "block";
        
      } catch (error) {
        console.error("❌ Error fetching group details:", error);
        alert("Failed to load group details");
      }
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // PERMISSION-BASED UI VISIBILITY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════

  /**
   * UPDATE ADMIN MENU VISIBILITY
   * Dynamically shows/hides menu options based on user permissions.
   * This ensures users only see actions they're authorized to perform.
   * 
   * PERMISSION HIERARCHY:
   * - Creator: Can delete group, manage all admins/members, edit settings
   * - Admin: Can manage members, edit settings, but cannot delete group
   * - Member: No admin options visible
   */
  function updateAdminMenuVisibility() {
    // Get references to all admin action buttons
    const deleteGroupBtn = groupAdminMenu.querySelector('.delete-group-btn');
    const manageAdminsBtn = groupAdminMenu.querySelector('.manage-admins-btn');
    const manageMembersBtn = groupAdminMenu.querySelector('.manage-members-btn');
    const editGroupBtn = groupAdminMenu.querySelector('.edit-group-btn');

    // Configure visibility based on user permissions
    if (isCurrentUserAdmin || isCurrentUserCreator) {
      // Show admin functions with appropriate restrictions
      if (deleteGroupBtn) deleteGroupBtn.style.display = isCurrentUserCreator ? "block" : "none";
      if (manageAdminsBtn) manageAdminsBtn.style.display = "block";
      if (manageMembersBtn) manageMembersBtn.style.display = "block";
      if (editGroupBtn) editGroupBtn.style.display = "block";
    } else {
      // Hide all admin functions for regular members
      if (deleteGroupBtn) deleteGroupBtn.style.display = "none";
      if (manageAdminsBtn) manageAdminsBtn.style.display = "none";
      if (manageMembersBtn) manageMembersBtn.style.display = "none";
      if (editGroupBtn) editGroupBtn.style.display = "none";
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // MENU VISIBILITY CONTROL
  // ═══════════════════════════════════════════════════════════════════

  /**
   * CLOSE ADMIN MENU
   * Hides the admin menu and clears current group context.
   * Resets state variables to prevent stale data issues.
   */
  function closeAdminMenu() {
    groupAdminMenu.style.display = "none";
    menuBackdrop.style.display = "none";
    
    // Clear current group context to prevent confusion
    currentGroupId = null;
    currentGroupData = null;
  }

  /**
   * MENU CLOSE EVENT HANDLERS
   * Handle various ways users can close the admin menu.
   * Provides intuitive UX with multiple exit options.
   */
  document.addEventListener('click', (e) => {
    // Close menu when clicking cancel button or backdrop
    if (e.target.classList.contains('cancel-group-btn') || e.target.id === 'menu-backdrop') {
      closeAdminMenu();
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // ADMIN ACTION HANDLERS
  // These functions handle the main administrative actions users can perform.
  // Each includes proper permission validation and error handling.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * DELETE GROUP HANDLER
   * Handles complete group deletion - the most destructive admin action.
   * Only group creators can perform this action.
   * Includes confirmation dialog and proper cleanup.
   */
  document.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-group-btn')) {
      // Double-check permissions (client-side validation)
      if (!currentGroupId || !isCurrentUserCreator) {
        alert("Only the group creator can delete the group");
        return;
      }

      // Show detailed confirmation dialog with consequences
      const confirmed = confirm(`Are you sure you want to delete "${currentGroupData.name}"? This action cannot be undone and will delete all posts in the group.`);
      
      if (!confirmed) return; // User cancelled - abort operation

      try {
        console.log("🗑️ Deleting group:", currentGroupId);
        
        // Send delete request to server
        const response = await fetch(`/api/group/${currentGroupId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        // Log response details for debugging
        console.log("📡 Delete response status:", response.status);
        console.log("📡 Delete response headers:", [...response.headers.entries()]);

        // Get response as text first to handle non-JSON responses
        const responseText = await response.text();
        console.log("📡 Raw response:", responseText.substring(0, 200));

        if (response.ok) {
          // Handle successful deletion
          let result;
          try {
            result = JSON.parse(responseText);
          } catch (parseError) {
            // Some servers return non-JSON success responses
            console.log("⚠️ Response is not JSON, but status is OK");
            result = { success: true };
          }
          
          console.log("✅ Group deleted successfully:", result);
          
          // Remove group from UI immediately for responsive feel
          const groupElement = document.querySelector(`[data-group-id="${currentGroupId}"]`);
          if (groupElement) {
            groupElement.remove();
            console.log("🗑️ Removed group element from UI");
          }
          
          // Clean up and provide user feedback
          closeAdminMenu();
          alert("Group deleted successfully");
          
          // Redirect to home page since group no longer exists
          console.log("🔄 Redirecting to home...");
          window.location.href = '/home';
          
        } else {
          // Handle deletion failure
          console.error("❌ Delete failed with status:", response.status);
          console.error("❌ Error response:", responseText);
          
          // Parse error message from response
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

  /**
   * MANAGE ADMINS HANDLER
   * Opens the admin management interface.
   * Allows promoting members to admin and demoting existing admins.
   */
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('manage-admins-btn')) {
      // Validate user has admin permissions
      if (!isCurrentUserAdmin && !isCurrentUserCreator) {
        alert("Only admins can manage other admins");
        return;
      }
      
      console.log("👥 Opening admin management for group:", currentGroupId);
      openAdminManagementModal();
    }
  });

  /**
   * MANAGE MEMBERS HANDLER
   * Opens the member management interface.
   * Allows removing members from the group entirely.
   */
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('manage-members-btn')) {
      // Validate user has admin permissions
      if (!isCurrentUserAdmin && !isCurrentUserCreator) {
        alert("Only admins can manage members");
        return;
      }
      
      console.log("👥 Opening member management for group:", currentGroupId);
      openMemberManagementModal();
    }
  });

  /**
   * EDIT GROUP HANDLER
   * Opens the group settings editor.
   * Allows modifying group name, description, and privacy settings.
   */
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-group-btn')) {
      // Validate user has admin permissions
      if (!isCurrentUserAdmin && !isCurrentUserCreator) {
        alert("Only admins can edit group settings");
        return;
      }
      
      console.log("✏️ Opening group edit for group:", currentGroupId);
      openEditGroupModal();
    }
  });

  // ═══════════════════════════════════════════════════════════════════
  // MODAL ORCHESTRATION FUNCTIONS
  // These functions manage the creation and display of management modals.
  // Each modal handles a specific aspect of group administration.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * OPEN ADMIN MANAGEMENT MODAL
   * Creates or displays the admin management interface.
   * Handles both promotion of members and demotion of existing admins.
   */
  function openAdminManagementModal() {
    // Check if modal already exists, create if needed
    let modal = document.getElementById('admin-management-modal');
    if (!modal) {
      modal = createAdminManagementModal();
      document.body.appendChild(modal);
    }
    
    // Load current admin data and display modal
    loadAdminList();
    modal.style.display = 'block';
    closeAdminMenu(); // Close the main menu to avoid overlapping
  }

  /**
   * OPEN MEMBER MANAGEMENT MODAL
   * Creates or displays the member management interface.
   * Shows all group members with options to remove them.
   */
  function openMemberManagementModal() {
    // Check if modal already exists, create if needed
    let modal = document.getElementById('member-management-modal');
    if (!modal) {
      modal = createMemberManagementModal();
      document.body.appendChild(modal);
    }
    
    // Load current member data and display modal
    loadMemberList();
    modal.style.display = 'block';
    closeAdminMenu(); // Close the main menu
  }

  /**
   * OPEN EDIT GROUP MODAL
   * Creates or displays the group settings editor.
   * Pre-populates form with current group settings.
   */
  function openEditGroupModal() {
    // Check if modal already exists, create if needed
    let modal = document.getElementById('edit-group-modal');
    if (!modal) {
      modal = createEditGroupModal();
      document.body.appendChild(modal);
    }
    
    // Populate form with current group data and display modal
    populateEditForm();
    modal.style.display = 'block';
    closeAdminMenu(); // Close the main menu
  }

  // ═══════════════════════════════════════════════════════════════════
  // MODAL CREATION FUNCTIONS
  // These functions generate the HTML structure for each management modal.
  // They create complete, interactive interfaces with proper event handlers.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * CREATE ADMIN MANAGEMENT MODAL
   * Generates the HTML structure for admin management interface.
   * Creates two sections: current admins and members to promote.
   * 
   * @returns {HTMLElement} Complete modal element ready for display
   */
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
          <!-- Current Admins Section -->
          <div id="admin-list-container">
            <h4>Current Admins</h4>
            <div id="current-admins-list" class="user-list"></div>
          </div>
          <!-- Promotion Section -->
          <div id="promote-member-container">
            <h4>Promote Members to Admin</h4>
            <div id="members-to-promote-list" class="user-list"></div>
          </div>
        </div>
      </div>
    `;

    // Add close button functionality
    modal.querySelector('.close-admin-modal').onclick = () => {
      modal.style.display = 'none';
    };

    return modal;
  }

  /**
   * CREATE MEMBER MANAGEMENT MODAL
   * Generates the HTML structure for member management interface.
   * Shows all group members with removal options.
   * 
   * @returns {HTMLElement} Complete modal element ready for display
   */
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
          <!-- Members List Section -->
          <div id="member-list-container">
            <h4>Group Members</h4>
            <div id="current-members-list" class="user-list"></div>
          </div>
        </div>
      </div>
    `;

    // Add close button functionality
    modal.querySelector('.close-member-modal').onclick = () => {
      modal.style.display = 'none';
    };

    return modal;
  }

  /**
   * CREATE EDIT GROUP MODAL
   * Generates the HTML structure for group settings editor.
   * Includes form fields for all editable group properties.
   * 
   * @returns {HTMLElement} Complete modal element ready for display
   */
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
          <!-- Group Settings Form -->
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
            <!-- Form Actions -->
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Save Changes</button>
              <button type="button" class="btn btn-secondary close-edit-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Add event listeners for close buttons and form submission
    modal.querySelectorAll('.close-edit-modal').forEach(btn => {
      btn.onclick = () => modal.style.display = 'none';
    });

    modal.querySelector('#edit-group-form').onsubmit = handleEditGroupSubmit;

    return modal;
  }

  // ═══════════════════════════════════════════════════════════════════
  // DATA LOADING FUNCTIONS
  // These functions populate modals with current group data and create
  // interactive user lists with appropriate action buttons.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * LOAD ADMIN LIST
   * Populates the admin management modal with current admins and promotable members.
   * Creates interactive lists with promote/demote buttons based on permissions.
   */
  async function loadAdminList() {
    // Ensure we have current group data
    if (!currentGroupData) return;

    const currentAdminsList = document.getElementById('current-admins-list');
    const membersToPromoteList = document.getElementById('members-to-promote-list');

    // ═══ DISPLAY CURRENT ADMINS ═══
    currentAdminsList.innerHTML = currentGroupData.admins.map(admin => `
      <div class="user-item">
        <img src="${admin.avatar || '/avatars/default.jpg'}" alt="${admin.username}" class="user-avatar">
        <span class="username">${admin.username}</span>
        ${isCurrentUserCreator && admin._id !== currentGroupData.createdBy._id ? 
          `<button class="btn btn-sm btn-danger remove-admin-btn" data-user-id="${admin._id}">Remove Admin</button>` : 
          ''}
      </div>
    `).join('');

    // ═══ DISPLAY PROMOTABLE MEMBERS ═══
    // Filter out users who are already admins
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

    // ═══ ADD EVENT LISTENERS FOR ADMIN ACTIONS ═══
    document.querySelectorAll('.remove-admin-btn').forEach(btn => {
      btn.onclick = () => removeAdmin(btn.dataset.userId);
    });

    document.querySelectorAll('.add-admin-btn').forEach(btn => {
      btn.onclick = () => addAdmin(btn.dataset.userId);
    });
  }

  /**
   * LOAD MEMBER LIST
   * Populates the member management modal with all group members.
   * Shows member roles and provides removal options where appropriate.
   */
  async function loadMemberList() {
    if (!currentGroupData) return;

    const currentMembersList = document.getElementById('current-members-list');

    // Generate member list with role indicators and removal buttons
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

  /**
   * POPULATE EDIT FORM
   * Pre-fills the group editing form with current group settings.
   * Ensures users see existing values when making modifications.
   */
  function populateEditForm() {
    if (!currentGroupData) return;

    // Set form fields to current group values
    document.getElementById('edit-group-name').value = currentGroupData.name || '';
    document.getElementById('edit-group-description').value = currentGroupData.description || '';
    document.getElementById('edit-group-public').checked = currentGroupData.isPublic || false;
  }

  // ═══════════════════════════════════════════════════════════════════
  // API INTERACTION FUNCTIONS
  // These functions handle communication with the server for all admin actions.
  // Each includes proper error handling and UI updates.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * ADD ADMIN
   * Promotes a regular member to admin status.
   * Sends request to server and updates UI on success.
   * 
   * @param {string} userId - ID of the user to promote to admin
   */
  async function addAdmin(userId) {
    try {
      console.log("➕ Adding admin:", userId);
      
      // Send promotion request to server
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
        
        // Update local group data with new admin list
        currentGroupData.admins = result.admins;
        
        // Refresh the admin management interface
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

  /**
   * REMOVE ADMIN
   * Demotes an admin back to regular member status.
   * Includes confirmation dialog and permission validation.
   * 
   * @param {string} userId - ID of the admin to demote
   */
  async function removeAdmin(userId) {
    try {
      console.log("➖ Removing admin:", userId);
      
      // Confirm the action with user
      const confirmed = confirm("Are you sure you want to remove this admin?");
      if (!confirmed) return;

      // Send demotion request to server
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
        
        // Update local group data with updated admin list
        currentGroupData.admins = result.admins;
        
        // Refresh the admin management interface
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

  /**
   * REMOVE MEMBER
   * Completely removes a user from the group (both membership and admin status).
   * This is more severe than just removing admin privileges.
   * 
   * @param {string} userId - ID of the member to remove from group
   */
  async function removeMember(userId) {
    try {
      console.log("➖ Removing member:", userId);
      
      // Confirm the action with user (more serious than admin removal)
      const confirmed = confirm("Are you sure you want to remove this member from the group?");
      if (!confirmed) return;

      // Send removal request to server
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
        
        // Update local group data with updated member and admin lists
        currentGroupData.members = result.members;
        currentGroupData.admins = result.admins;
        
        // Refresh the member management interface
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

  /**
   * HANDLE EDIT GROUP SUBMIT
   * Processes the group settings form submission.
   * Updates group name, description, and privacy settings.
   * 
   * @param {Event} e - Form submission event
   */
  async function handleEditGroupSubmit(e) {
    e.preventDefault(); // Prevent default form submission
    
    try {
      console.log("💾 Updating group settings");
      
      // Collect form data
      const formData = {
        name: document.getElementById('edit-group-name').value,
        description: document.getElementById('edit-group-description').value,
        isPublic: document.getElementById('edit-group-public').checked
      };

      // Send update request to server
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
        
        // Update local group data with new settings
        currentGroupData = { ...currentGroupData, ...result.group };
        
        // Close the edit modal
        document.getElementById('edit-group-modal').style.display = 'none';
        
        alert("Group updated successfully");
        
        // Refresh the page to show updated information
        // Alternative: Update specific DOM elements without full reload
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

  // ═══════════════════════════════════════════════════════════════════
  // PUBLIC API AND INTEGRATION FUNCTIONS
  // These functions provide external interfaces for other scripts to
  // interact with the group admin system.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * OPEN GROUP ADMIN MENU (PUBLIC)
   * External interface for opening the admin menu for a specific group.
   * Used by other scripts like group popup or group feed.
   * 
   * @param {string} groupId - ID of the group to administer
   * @param {string} groupName - Name of the group (for logging/display)
   */
  function openGroupAdminMenu(groupId, groupName) {
    console.log(`🔧 Opening admin menu for group: ${groupName} (${groupId})`);
    
    // Set current group context
    currentGroupId = groupId;
    
    // Fetch group details and display admin menu
    fetchGroupDetailsAndShowMenu(groupId);
  }

  /**
   * FETCH GROUP DETAILS AND SHOW ADMIN MENU
   * Helper function that loads group data and displays the admin menu.
   * Handles the complete flow from data loading to menu display.
   * 
   * @param {string} groupId - ID of the group to load and display menu for
   */
  async function fetchGroupDetailsAndShowMenu(groupId) {
    try {
      // Fetch detailed group information including permissions
      const response = await fetch(`/api/group/${groupId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }
      
      // Parse group data and extract user permissions
      currentGroupData = await response.json();
      isCurrentUserAdmin = currentGroupData.isCurrentUserAdmin;
      isCurrentUserCreator = currentGroupData.isCurrentUserCreator;
      
      console.log("👤 Admin status:", { isCurrentUserAdmin, isCurrentUserCreator });
      
      // Configure menu options based on user permissions
      updateAdminMenuVisibility();
      
      // Display the admin menu with backdrop
      groupAdminMenu.style.display = "block";
      menuBackdrop.style.display = "block";
      
    } catch (error) {
      console.error("❌ Error fetching group details:", error);
      alert("Failed to load group details");
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // GLOBAL API EXPOSURE
  // Expose functions for use by other scripts in the application.
  // This creates a clean interface for external integration.
  // ═══════════════════════════════════════════════════════════════════

  /**
   * PUBLIC API FOR OTHER SCRIPTS
   * Exposes key functions for external use while keeping internal functions private.
   * Other scripts can use this interface to trigger admin functionality.
   */
  window.GroupAdmin = {
    openAdminMenu: openGroupAdminMenu,  // Main entry point for external scripts
    setCurrentGroup: (groupId, groupName) => {
      // Utility function for setting group context without opening menu
      currentGroupId = groupId;
      console.log(`Set current group: ${groupName} (${groupId})`);
    }
  };

  console.log("✅ Group admin functionality ready");
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// Set up the group admin system when the page loads.
// ═══════════════════════════════════════════════════════════════════

/**
 * INITIALIZE GROUP ADMIN SYSTEM
 * Wait for DOM to be ready, then set up all group admin functionality.
 * This ensures all required DOM elements are available before setup.
 */
document.addEventListener("DOMContentLoaded", setupGroupAdmin);