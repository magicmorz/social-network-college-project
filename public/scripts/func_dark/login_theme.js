document.addEventListener('DOMContentLoaded', () => {
 
  let theme = localStorage.getItem('theme');

  
  if (!theme) {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme = prefersDark ? 'dark' : 'light';
  }

 
  document.documentElement.setAttribute('data-theme', theme);
});
