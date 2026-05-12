/**
 * theme-toggle.js — Theme Toggle with localStorage
 * Micap AI | https://micap.ai
 *
 * USAGE: Include in every page:
 *   <script src="/theme-toggle.js"></script>
 *
 * Add toggle button to navigation:
 *   <button id="themeToggle" class="theme-toggle">🌙</button>
 */

(function() {
  'use strict';

  // Configuration
  const THEME_KEY = 'micap-theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  // Get stored theme or system preference
  function getInitialTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return LIGHT_THEME;
    }
    return DARK_THEME;
  }

  // Apply theme to document
  function applyTheme(theme) {
    const html = document.documentElement;
    
    if (theme === LIGHT_THEME) {
      html.setAttribute('data-theme', LIGHT_THEME);
      document.body.setAttribute('data-theme', LIGHT_THEME);
      updateToggleIcon('☀️');
    } else {
      html.removeAttribute('data-theme');
      document.body.removeAttribute('data-theme');
      updateToggleIcon('🌙');
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  // Update toggle button icon
  function updateToggleIcon(icon) {
    // Try both possible button IDs
    let toggle = document.getElementById('themeToggle');
    if (!toggle) {
      toggle = document.getElementById('theme-toggle');
    }
    
    if (toggle) {
      toggle.textContent = icon;
    }
  }

  // Toggle between themes
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = current === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
    applyTheme(newTheme);
  }

  // Initialize on DOM ready
  function init() {
    // Apply initial theme
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);

    // Attach toggle listener to both possible button IDs
    let toggle = document.getElementById('themeToggle');
    if (!toggle) {
      toggle = document.getElementById('theme-toggle');
    }
    
    if (toggle) {
      toggle.addEventListener('click', toggleTheme);
      toggle.style.cursor = 'pointer';
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        const stored = localStorage.getItem(THEME_KEY);
        if (!stored) {
          const newTheme = e.matches ? LIGHT_THEME : DARK_THEME;
          applyTheme(newTheme);
        }
      });
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose toggle function globally for manual use
  window.toggleTheme = toggleTheme;
})();
