/* like-toggle.js  – works for hearts that appear later, too
   --------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {

  /* the filled-red SVG we swap in */
  const FULL_HEART = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
         width="24" height="24" fill="rgb(255,48,64)" role="img">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
               2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09
               1.09-1.28 2.76-2.09 4.5-2.09 3.08 0 5.5 2.42 5.5 5.5
               0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>`.trim();

  /* helper: add thousands separators */
  const fmt = n => n.toLocaleString('en-US');

  /* --------------------------------------------------------
     EVENT  DELEGATION:
     listen once on <body>, check if the click came
     from a “Like” button (present or future)               */
  document.body.addEventListener('click', e => {

    const btn = e.target.closest("button[aria-label='Like post']");
    if (!btn) return;                     // click wasn’t on a heart

    /* keep the outline SVG the first time we meet this button */
    if (!btn.__outline) btn.__outline = btn.innerHTML;

    /* toggle state flag on the DOM node itself */
    btn.__liked = !btn.__liked;

    /* swap the icon */
    btn.innerHTML = btn.__liked ? FULL_HEART : btn.__outline;

    /* ---- optional: update simple numeric like counter ---- */
    const post       = btn.closest('.instagram-post');
    const counter    = post?.querySelector('.likes-simple .likes-count');
    if (counter) {
      let n = +counter.textContent.replace(/,/g,'');
      n += btn.__liked ? 1 : -1;
      counter.textContent = fmt(n);
    }

    /* small bounce animation when liking */
    btn.classList.add('pop');
    setTimeout(() => btn.classList.remove('pop'), 350);
  });

  /* hover bounce ONLY while it’s an outline --------------- */
  document.body.addEventListener('mouseenter', e => {
    const btn = e.target.closest("button[aria-label='Like post']");
    if (btn && !btn.__liked) btn.classList.add('bounce');
  }, true);
  document.body.addEventListener('mouseleave', e => {
    const btn = e.target.closest("button[aria-label='Like post']");
    if (btn) btn.classList.remove('bounce');
  }, true);
});
