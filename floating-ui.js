/**
 * Floating UI Components Module
 * Handles scroll-to-top button and mobile menu animations
 */

// ===== SCROLL-TO-TOP BUTTON =====
function initScrollToTop() {
  const scrollBtn = document.getElementById('scrollToTopBtn');
  if (!scrollBtn) return;

  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });

  // Smooth scroll to top
  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

// ===== MOBILE MENU ENHANCEMENTS =====
function initMobileMenuEnhancements() {
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('navMenu');
  const menuBackdrop = document.getElementById('menuBackdrop');
  
  if (!hamburger || !navMenu) return;

  // Create backdrop if it doesn't exist
  if (!menuBackdrop) {
    const backdrop = document.createElement('div');
    backdrop.id = 'menuBackdrop';
    backdrop.className = 'menu-backdrop';
    document.body.appendChild(backdrop);
  }

  const backdrop = document.getElementById('menuBackdrop');

  // Toggle menu with backdrop
  hamburger.addEventListener('click', () => {
    const isActive = hamburger.classList.contains('active');
    
    if (!isActive) {
      // Opening menu
      hamburger.classList.add('active');
      navMenu.classList.add('active');
      backdrop.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent scrolling
    } else {
      // Closing menu
      closeMenu();
    }
  });

  // Close menu when clicking backdrop
  backdrop.addEventListener('click', closeMenu);

  // Close menu when clicking a link
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && hamburger.classList.contains('active')) {
      closeMenu();
    }
  });

  function closeMenu() {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
    backdrop.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
  }
}

// ===== INITIALIZE ALL COMPONENTS =====
document.addEventListener('DOMContentLoaded', () => {
  initScrollToTop();
  initMobileMenuEnhancements();
});

// Also initialize on page load
window.addEventListener('load', () => {
  initScrollToTop();
  initMobileMenuEnhancements();
});
