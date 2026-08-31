document.addEventListener('DOMContentLoaded', () => {
  setActiveNavLink();
});

function setActiveNavLink() {
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.nav-link');

  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (
      href === currentPath ||
      (currentPath.endsWith(href) && href !== '#') ||
      (currentPath === '/' && href.includes('index.html'))
    ) {
      link.classList.add('active');
    }
  });
}

function showToast(message = 'Copied to clipboard!') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('hidden');

  setTimeout(() => {
    toast.classList.add('hidden');
  }, 2200);
}

window.showToast = showToast;
