/* ================================================================
   search_panel.js  –  slide-out “Search” drawer + sidebar collapse
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------------------------------------------------------------
     DOM references
     --------------------------------------------------------------- */
  const panel    = document.getElementById('searchPanel');   // drawer
  const btnOpen  = document.getElementById('openSearchBtn'); // magnifier icon
  const btnClose = document.getElementById('searchCloseBtn');// little “✕”
  const field    = document.getElementById('searchField');   // <input>
  const sidebar  = document.querySelector('.sidebar');       // main left bar

  /* ---------------------------------------------------------------
     1 • guarantee a clean state on every page load
     --------------------------------------------------------------- */
  panel  .classList.remove('open');
  sidebar.classList.remove('collapsed');

  /* ---------------------------------------------------------------
     2 • helper – open / close drawer + collapse sidebar
     --------------------------------------------------------------- */
  function togglePanel(force) {
    const willOpen = (force !== undefined)
      ? force
      : !panel.classList.contains('open');

    panel  .classList.toggle('open',      willOpen);
    sidebar.classList.toggle('collapsed', willOpen);

    if (willOpen) {
      field.focus();
    }
  }

  /* ---------------------------------------------------------------
     3 • click on magnifier icon
        – 1st click  ⇒ open
        – 2nd click  ⇒ close (if already open)
     --------------------------------------------------------------- */
  btnOpen.addEventListener('click', (e) => {
    e.preventDefault();
    panel.classList.contains('open')
      ? togglePanel(false)
      : togglePanel(true);
  });

  /* ---------------------------------------------------------------
     4 • click on “✕”  (always closes)
     --------------------------------------------------------------- */
  btnClose.addEventListener('click', () => togglePanel(false));

  /* ---------------------------------------------------------------
     5 • Esc key  closes drawer
     --------------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      togglePanel(false);
    }
  });

  /* ---------------------------------------------------------------
     6 • clicks outside the drawer
        first  click  → just blur the input
        second click  → close drawer
     --------------------------------------------------------------- */
  document.addEventListener('click', (e) => {

    if (!panel.classList.contains('open')) return;           // drawer closed – ignore

    const clickedInsidePanel = panel.contains(e.target);
    const clickedMagnifier   = btnOpen.contains(e.target);

    if (clickedInsidePanel || clickedMagnifier) return;      // ignore internal clicks

    /* outside click while input is focused: just blur */
    if (document.activeElement === field) {
      field.blur();
      return;                                                // wait for a 2nd click
    }

    /* second outside click – close everything */
    togglePanel(false);
  });

   /* ---------------------------------------------------------------
     7 • Close the drawer immediately on any window resize
   --------------------------------------------------------------- */
  window.addEventListener('resize', () => {
    if (panel.classList.contains('open')) {
      togglePanel(false);
    }
  });
});
