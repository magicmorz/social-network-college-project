window.addEventListener('DOMContentLoaded', () => {
  // 1. Clear all comment inputs on reload
  document.querySelectorAll('.add-comment input').forEach(input => {
    input.value = '';
  });

  // 2. Hide all typing indicators
  document.querySelectorAll('.typing-indicator').forEach(indicator => {
    indicator.style.display = 'none';
  });

  // 3. Add input listeners to show/hide typing indicators
  document.querySelectorAll('.add-comment').forEach(commentBlock => {
    const input = commentBlock.querySelector('input');
    const indicator = commentBlock.nextElementSibling; 

    let timeout;

    input.addEventListener('input', () => {
      indicator.style.display = 'block';
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        indicator.style.display = 'none';
      }, 3000);
    });

    input.addEventListener('blur', () => {
      indicator.style.display = 'none';
      clearTimeout(timeout);
    });
  });
});
