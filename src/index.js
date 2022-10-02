addEventListener('DOMContentLoaded', () => {
  // switch to dark mode
  const root = document.documentElement;
  const loadedAt = new Date().getHours();

  if (loadedAt <= 7 || loadedAt >= 19) {
    root.style.setProperty('--text', 'rgb(240, 240, 240)');
    root.style.setProperty('--text-mid', 'rgb(130, 130, 130)');
    root.style.setProperty('--shadow', 'rgb(10, 10, 10)');
    root.style.setProperty('--text-light', 'rgb(10, 10, 10)');
    root.style.setProperty('--background', 'rgb(30, 30, 30)');
  }
});
