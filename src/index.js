addEventListener('DOMContentLoaded', () => {
  const root = document.documentElement;
  const titleEl = document.querySelector('.title');
  const titles = ['Sagar.', 'saa&#8226;gr.'];
  let loadedAt = new Date().getHours();

  function switchText(el, arr) {
    let i = 0;
    return () => {
      i = i === arr.length - 1 ? 0 : i + 1;
      el.innerHTML =  arr[i];
    }
  }
  const switchTitle = switchText(titleEl, titles);
  
  if (loadedAt <= 7 || loadedAt >= 19) {
    root.style.setProperty('--primary', 'rgb(240, 240, 240)');
    root.style.setProperty('--secondary', 'rgb(190, 190, 190)');
    root.style.setProperty('--tertiary', 'rgb(50, 50, 50)');
    root.style.setProperty('--light', 'rgb(10, 10, 10)');
    root.style.setProperty('--background', 'rgb(15, 15, 15)');
    root.style.setProperty('--highlight', 'rgb(203,96,21)');
  }

  titleEl.addEventListener('mouseenter', switchTitle);
  titleEl.addEventListener('mouseleave', switchTitle);
  titleEl.addEventListener('click', switchTitle);

});