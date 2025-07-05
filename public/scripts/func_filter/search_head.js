document.addEventListener('DOMContentLoaded', () => {
  const input = document.querySelector('.search-input');
  const icon  = document.querySelector('.search-icon');
  const box   = document.querySelector('.search-container');   

  if (!input || !icon || !box) return;

  const toggle = () => {
    const hasText = !!input.value.trim();
    icon.style.opacity = hasText ? '0' : '1';
    box.classList.toggle('hasText', hasText);                
  };

  input.addEventListener('input', toggle);
  input.addEventListener('focus', toggle);
  input.addEventListener('blur',  toggle);

  toggle();           // run once on load
});