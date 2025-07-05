(() => {
  // === Selectors & constants ===
  const POST_SELECTOR        = '.instagram-post';                  // Class for all posts
  const TOP_INPUT_SELECTOR   = '.search-container .search-input'; // Top search bar input
  const PANEL_INPUT_SELECTOR = '#searchField';                    // Drawer search bar input
  const HIDDEN_CLASS         = 'is-hidden';                       // Class to hide filtered-out posts
  const FILTER_BTN_SELECTOR  = '.filter-btn';                     // Class for content filter buttons

  // === DOM element references ===
  const topInput   = document.querySelector(TOP_INPUT_SELECTOR);
  const panelInput = document.querySelector(PANEL_INPUT_SELECTOR);
  const posts      = [...document.querySelectorAll(POST_SELECTOR)];
  const filterBtns = [...document.querySelectorAll(FILTER_BTN_SELECTOR)];

  // Exit early if no posts exist
  if (!posts.length) return;

  // Cache each post's lowercase text content for faster filtering
  const searchable = posts.map(post => post.innerText.toLowerCase());

  // Track which content types (e.g., picture, reel) are active
  let activeTypes = [];

  // === Update the active content filter buttons and reapply filter ===
  const updateActiveTypes = () => {
    activeTypes = filterBtns
      .filter(btn => btn.classList.contains('active'))       // Only buttons currently active
      .map(btn => btn.dataset.type);                         // Extract their data-type
    applyFilter();                                           // Re-run filtering logic
  };

  // === Toggle content filter buttons on click ===
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');                        // Toggle visual state
      updateActiveTypes();                                   // Update filters
    });
  });

  // === Debounce helper: delays function calls for smoother UX ===
  const debounce = (fn, delay = 150) => {
    let t;
    return (...a) => {
      clearTimeout(t);                                       // Clear previous timeout
      t = setTimeout(() => fn(...a), delay);                 // Set new timeout
    };
  };

  // === Apply both text and content-type filters to posts ===
  const applyFilter = () => {
    const q = (topInput?.value || panelInput?.value || '')   // Get text from either input
                .trim()
                .toLowerCase();

    posts.forEach((post, i) => {
      const textMatch = !q || searchable[i].includes(q);     // Match text content
      const typeMatch = !activeTypes.length ||               // Match type if filters are active
                        activeTypes.includes(post.dataset.type);
      const show = textMatch && typeMatch;                   // Post must match both
      post.classList.toggle(HIDDEN_CLASS, !show);            // Hide if doesn't match
    });
  };

  // === Attach input listeners with debounce to both search fields ===
  [topInput, panelInput].forEach(inp => {
    if (inp) inp.addEventListener('input', debounce(applyFilter));
  });

})();
