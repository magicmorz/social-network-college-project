// public/scripts/func_groups/group_popup.js
/**
 * GROUP POPUP FUNCTIONALITY
 * 
 * This script handles the groups popup interface that allows users to:
 * - View all their groups
 * - Create new groups
 * - Navigate to specific groups
 * - Leave or delete groups
 * - Access group admin settings (if they have permissions)
 * 
 * The popup is triggered by clicking the groups button and provides a
 * centralized interface for all group-related actions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // === DOM ELEMENT REFERENCES ===
  // Cache all DOM elements we'll be working with to avoid repeated queries
  const btn               = document.getElementById('groupsBtn');           // Main trigger button
  const overlay           = document.getElementById('popupOverlay');        // Background overlay for modals
  const popup             = document.getElementById('groupsPopup');         // Main groups popup container
  const closeBtn          = document.getElementById('closeGroupsPopup');    // Close button for main popup
  const listEl            = document.getElementById('groupsList');          // Container for groups list
  const createBtn         = document.getElementById('createGroupBtn');      // Create group button (dynamically added)
  const createModal       = document.getElementById('createGroupModal');    // Modal for creating new groups
  const cancelCreateBtn   = document.getElementById('cancelCreateGroup');   // Cancel button in create modal
  const submitCreateBtn   = document.getElementById('submitCreateGroup');   // Submit button in create modal
  const newGroupNameInput = document.getElementById('newGroupName');        // Input field for new group name
  const memberListDiv     = document.getElementById('memberList');          // Container for member checkboxes

  // === POPUP VISIBILITY HELPERS ===
  /**
   * Controls the visibility of the main groups popup
   * Uses CSS classes to show/hide with animations
   * @param {boolean} open - Whether to show (true) or hide (false) the popup
   */
  function toggleMainPopup(open) {
    overlay.classList.toggle('active', open);    // Show/hide background overlay
    popup.classList.toggle('active', open);      // Show/hide the popup itself
  }
  
  /**
   * Controls the visibility of the create group modal
   * This is a separate modal that appears over the main popup
   * @param {boolean} open - Whether to show (true) or hide (false) the modal
   */
  function toggleCreateModal(open) {
    overlay.classList.toggle('active', open);    // Show/hide background overlay
    createModal.classList.toggle('active', open); // Show/hide the create modal
  }

  // === GROUPS LIST MANAGEMENT ===
  /**
   * Fetches all user's groups from the server and populates the groups list
   * This function is called on initial load and when groups need to be refreshed
   * It handles both the static UI elements (Create Group, All Posts) and dynamic group items
   */
  async function loadGroups() {
    // Start with static UI elements that are always present
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
    
    // Attach event listeners to the static elements we just created
    // Note: We need to re-attach these every time we rebuild the list
    listEl.querySelector('#createGroupBtn')
          .addEventListener('click', onCreateClicked);
    listEl.querySelector('#showAllPostsBtn')
          .addEventListener('click', () => {
            toggleMainPopup(false);              // Close the popup first
            window.location.href = '/home';      // Navigate to home (all posts view)
          });

    try {
      // Fetch groups data from the server
      const res = await fetch('/api/group');
      
      // Validate that we received a JSON response
      // This prevents errors if the server returns HTML error pages or other content types
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      // Parse the JSON response
      const groups = await res.json();
      
      // Validate that we received an array of groups
      if (!Array.isArray(groups)) {
        throw new Error('Expected array of groups');
      }

      // Add each group to the list with all necessary UI elements and permissions
      // We iterate through groups sequentially to maintain order and handle async operations
      for (const group of groups) {
        await addGroupListItem(group._id, group.name, group);
      }
    } catch (err) {
      // Handle any errors in fetching or processing groups
      console.error('Error loading groups:', err);
      // Show user-friendly error message in the UI
      listEl.innerHTML += `<li class="list-group-item text-danger">Error loading groups: ${err.message}</li>`;
    }
  }

  // === USER LIST MANAGEMENT FOR GROUP CREATION ===
  /**
   * Fetches all users from the server and creates checkboxes for group member selection
   * This is used in the create group modal to allow selecting which users to add to the new group
   * Users can select multiple members when creating a group
   */
  async function loadUsers() {
    // Show loading state while fetching users
    memberListDiv.innerHTML = `<p class="text-center small">Loading users…</p>`;
    
    try {
      // Fetch all users from the server
      const res = await fetch('/api/users');
      
      // Validate JSON response (same pattern as loadGroups)
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      // Parse and validate the users array
      const users = await res.json();
      if (!Array.isArray(users)) {
        throw new Error('Expected array of users');
      }

      // Clear the loading message
      memberListDiv.innerHTML = '';
      
      // Create a checkbox for each user
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
      // Handle errors in loading users
      console.error('Failed to load users:', err);
      // Show error message to user
      memberListDiv.innerHTML = `<p class="text-danger small">Failed to load users: ${err.message}</p>`;
    }
  }

  // === USER PERMISSIONS AND GROUP STATUS CHECKING ===
  /**
   * Checks if the current user has admin privileges for a specific group
   * This information is used to determine which buttons and options to show
   * Also returns member count which is needed for leave/delete functionality
   * 
   * @param {string} groupId - The ID of the group to check
   * @returns {Promise<Object>} Object containing isAdmin, isCreator, and memberCount properties
   */
  async function checkAdminStatus(groupId) {
    try {
      // Fetch detailed group information including permissions
      const response = await fetch(`/api/group/${groupId}`);
      if (response.ok) {
        const groupData = await response.json();
        return {
          isAdmin: groupData.isCurrentUserAdmin || false,      // Can manage group settings
          isCreator: groupData.isCurrentUserCreator || false,  // Created the group (highest permissions)
          memberCount: groupData.members ? groupData.members.length : 1 // Include member count for leave functionality
        };
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
    // Default fallback values if API call fails
    // Assume user is not admin and group has at least 1 member
    return { isAdmin: false, isCreator: false, memberCount: 1 };
  }

  // === LEAVE/DELETE GROUP FUNCTIONALITY ===
  /**
   * Handles leaving a group or deleting it if user is the only member
   * This function provides different behavior based on group membership:
   * - If user is the only member: deletes the entire group
   * - If there are other members: removes only the current user
   * 
   * @param {string} groupId - The ID of the group to leave
   * @param {string} groupName - The name of the group (for display purposes)
   * @param {number} memberCount - Number of members in the group
   */
  async function leaveGroup(groupId, groupName, memberCount) {
    // Determine if user is the only member (which means group will be deleted)
    const isOnlyMember = memberCount === 1;
    const actionText = isOnlyMember ? 'delete this group (you are the only member)' : 'leave this group';
    
    // Show confirmation dialog with appropriate message
    // Different wording helps users understand the consequences
    if (!confirm(`Are you sure you want to ${actionText}?`)) {
      return; // User cancelled the action
    }

    try {
      // Make API call to leave group endpoint
      // The backend will handle whether to delete or just remove the user
      const response = await fetch(`/api/group/${groupId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      // Check if response is valid JSON (error handling pattern)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }

      const result = await response.json();

      // Handle API errors
      if (!response.ok) {
        throw new Error(result.error || 'Failed to leave group');
      }

      // Remove the group from the UI list immediately for responsive feel
      // We don't wait for a full reload - just remove the specific item
      const groupListItem = document.querySelector(`li[data-group-id="${groupId}"]`);
      if (groupListItem) {
        groupListItem.remove();
      }

      // Show success message based on whether group was deleted or just left
      // Backend tells us via the 'deleted' flag what actually happened
      const successMessage = result.deleted ? 
        'Group deleted successfully (you were the only member)' : 
        'Left group successfully';
      
      alert(successMessage);

      // If user is currently viewing this group, redirect them to home page
      // This prevents them from being stuck on a group page they no longer have access to
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('group') === groupId) {
        window.location.href = '/home';
      }

    } catch (error) {
      // Handle any errors in the leave/delete process
      console.error('Error leaving group:', error);
      alert(error.message || 'Failed to leave group');
    }
  }

  // === GROUP LIST ITEM CREATION ===
  /**
   * Creates and adds a list item for a group with appropriate buttons and badges
   * This function builds the complete UI for each group including:
   * - Group name and icon
   * - Permission badges (Creator/Admin)
   * - Action buttons (Settings, Leave/Delete)
   * - Click handlers for navigation
   * 
   * @param {string} id - Group ID
   * @param {string} name - Group name to display
   * @param {Object|null} groupData - Optional group data to avoid extra API calls
   */
  async function addGroupListItem(id, name, groupData = null) {
    // Create the main list item container
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex align-items-center justify-content-between';
    li.dataset.groupId = id; // Store group ID for easy reference in DOM queries

    // === LEFT SIDE: GROUP INFO (CLICKABLE FOR NAVIGATION) ===
    const groupInfo = document.createElement('div');
    groupInfo.className = 'd-flex align-items-center group-info-clickable';
    groupInfo.style.cursor = 'pointer'; // Visual indication that this area is clickable
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

    // === RIGHT SIDE: ACTION BUTTONS ===
    const actionSection = document.createElement('div');
    actionSection.className = 'd-flex align-items-center gap-1'; // Small gap between buttons

    // === DETERMINE USER PERMISSIONS AND MEMBER COUNT ===
    // This determines which buttons to show and what actions are available
    let adminStatus = { isAdmin: false, isCreator: false, memberCount: 1 };
    
    if (groupData) {
      // Use existing group data if available to avoid additional API calls
      // This is more efficient when loading multiple groups at once
      adminStatus.isAdmin = groupData.admins && groupData.admins.some(admin => 
        admin._id === window.currentUserId || admin.toString() === window.currentUserId
      );
      adminStatus.isCreator = groupData.createdBy && 
        (groupData.createdBy._id === window.currentUserId || groupData.createdBy.toString() === window.currentUserId);
      adminStatus.memberCount = groupData.members ? groupData.members.length : 1;
    } else {
      // Fetch admin status from API if not provided
      // This happens when groups are added individually after initial load
      adminStatus = await checkAdminStatus(id);
    }

    // === ADD PERMISSION BADGES ===
    // Visual indicators of the user's role in the group
    const badgesContainer = groupInfo.querySelector('.group-badges');
    if (adminStatus.isCreator) {
      // Creator badge - highest level of permissions
      badgesContainer.innerHTML += '<small class="badge bg-warning text-dark me-1">Creator</small>';
    } else if (adminStatus.isAdmin) {
      // Admin badge - elevated permissions but not creator
      badgesContainer.innerHTML += '<small class="badge bg-primary me-1">Admin</small>';
    }
    // Note: Regular members get no badge (clean look)

    // === ADD ADMIN/SETTINGS BUTTON ===
    // Only show this button if user has administrative privileges
    if (adminStatus.isAdmin || adminStatus.isCreator) {
      const adminBtn = document.createElement('button');
      adminBtn.className = 'btn btn-sm btn-outline-secondary';
      adminBtn.innerHTML = '<i class="bi bi-gear"></i>'; // Gear icon for settings
      adminBtn.title = 'Group Settings'; // Tooltip for accessibility
      
      // Prevent event bubbling to avoid triggering group navigation
      // This ensures clicking the settings button doesn't navigate to the group
      adminBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        openGroupAdminMenu(id, name);
      });
      actionSection.appendChild(adminBtn);
    }

    // === ADD LEAVE/DELETE BUTTON ===
    // This button appears for ALL groups - everyone can leave a group
    const leaveBtn = document.createElement('button');
    leaveBtn.className = 'btn btn-sm btn-outline-danger'; // Red outline for destructive action
    
    // Show different icons based on member count
    // Trash icon indicates deletion (only member), arrow indicates leaving (multiple members)
    leaveBtn.innerHTML = adminStatus.memberCount === 1 ? 
      '<i class="bi bi-trash"></i>' : '<i class="bi bi-box-arrow-right"></i>';
    leaveBtn.title = adminStatus.memberCount === 1 ? 'Delete Group' : 'Leave Group';
    
    // Prevent event bubbling (same as admin button)
    leaveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      leaveGroup(id, name, adminStatus.memberCount);
    });
    actionSection.appendChild(leaveBtn);

    // === GROUP NAVIGATION CLICK HANDLER ===
    // Clicking anywhere on the group info (left side) navigates to that group
    groupInfo.addEventListener('click', () => {
      toggleMainPopup(false);              // Close the popup first
      window.location.href = `/home?group=${id}`; // Navigate with group parameter
    });

    // === ASSEMBLE THE COMPLETE LIST ITEM ===
    li.appendChild(groupInfo);    // Left side: name, badges, clickable area
    li.appendChild(actionSection); // Right side: buttons
    listEl.appendChild(li);       // Add to the main groups list
  }

  // === GROUP ADMIN MENU INTEGRATION ===
  /**
   * Opens the group administration menu/interface
   * This function integrates with the group admin system (separate module)
   * Provides fallback behavior if the admin system isn't loaded
   * 
   * @param {string} groupId - ID of the group to administer
   * @param {string} groupName - Name of the group (for display)
   */
  function openGroupAdminMenu(groupId, groupName) {
    toggleMainPopup(false); // Close the groups popup first
    
    // Try to use the dedicated GroupAdmin module if available
    if (window.GroupAdmin) {
      window.GroupAdmin.openAdminMenu(groupId, groupName);
    } else {
      // Fallback behavior if GroupAdmin module isn't loaded
      console.log(`Opening admin menu for group: ${groupName} (${groupId})`);
      
      // Create a temporary button click event for the group admin system
      // This maintains compatibility with existing admin interfaces
      const tempBtn = document.createElement('button');
      tempBtn.className = 'group-options-btn';
      tempBtn.dataset.groupId = groupId;
      tempBtn.click();
      
      // Alternative fallback: redirect to group page where admin menu is available
      window.location.href = `/home?group=${groupId}`;
    }
  }

  // === EVENT HANDLERS FOR MAIN UI ELEMENTS ===
  
  /**
   * Main groups button click handler
   * Toggles the visibility of the groups popup
   */
  btn.addEventListener('click', e => {
    e.preventDefault(); // Prevent any default button behavior
    // Toggle popup visibility - if open, close it; if closed, open it
    toggleMainPopup(!popup.classList.contains('active'));
  });

  /**
   * Close button handler for the main popup
   */
  closeBtn.addEventListener('click', () => toggleMainPopup(false));

  /**
   * Background overlay click handler
   * Closes whichever modal/popup is currently open
   * This provides intuitive "click outside to close" behavior
   */
  overlay.addEventListener('click', () => {
    if (createModal.classList.contains('active')) {
      // If create modal is open, close it
      toggleCreateModal(false);
    } else {
      // Otherwise close the main popup
      toggleMainPopup(false);
    }
  });

  // === CREATE GROUP FUNCTIONALITY ===
  
  /**
   * Handler for the "Create Group" button click
   * Transitions from the main popup to the create group modal
   */
  function onCreateClicked() {
    toggleMainPopup(false);   // Close the main popup
    // Reset the create form to empty state
    newGroupNameInput.value = '';
    memberListDiv.querySelectorAll('input').forEach(cb => cb.checked = false);
    toggleCreateModal(true);  // Open the create modal
  }

  /**
   * Cancel button handler for create group modal
   */
  cancelCreateBtn.addEventListener('click', () => toggleCreateModal(false));

  /**
   * Submit button handler for creating a new group
   * Validates input, sends data to server, and updates UI
   */
  submitCreateBtn.addEventListener('click', async () => {
    // Validate that user entered a group name
    const name = newGroupNameInput.value.trim();
    if (!name) return alert('Please enter a group name.');

    // Collect all selected member IDs from checkboxes
    const memberIds = Array.from(
      memberListDiv.querySelectorAll('input:checked')
    ).map(cb => cb.value);

    try {
      // Send group creation request to server
      const res = await fetch('/api/group', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, members: memberIds })
      });
      
      // Validate JSON response (standard error handling pattern)
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const group = await res.json();
      
      // Check if the request was successful
      if (!res.ok) {
        throw new Error(group.error || res.statusText);
      }

      // Add the new group to the UI immediately (optimistic update)
      await addGroupListItem(group._id, group.name, group);
      toggleCreateModal(false); // Close the create modal
      alert('Group created successfully!');
    } catch (err) {
      // Handle any errors in group creation
      console.error('Error creating group:', err);
      alert(err.message || 'Failed to create group');
    }
  });

  // === PUBLIC API FOR OTHER SCRIPTS ===
  /**
   * Expose functions for use by other scripts
   * This allows other parts of the application to interact with the group popup
   * For example, other modules might need to refresh the groups list or programmatically open menus
   */
  window.GroupPopup = {
    loadGroups,        // Reload the groups list from server
    addGroupListItem,  // Add a single group to the list (for real-time updates)
    toggleMainPopup,   // Show/hide the main groups popup
    openGroupAdminMenu,// Open admin menu for a specific group
    leaveGroup         // Leave or delete a group programmatically
  };

  // === INITIALIZATION ===
  /**
   * Load initial data when the script starts
   * This runs automatically when the DOM is ready
   */
  loadUsers();  // Load users for group creation functionality
  loadGroups(); // Load and display the user's current groups
});