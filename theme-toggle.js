/**
 * theme-toggle.js — Theme Toggle with localStorage
 * Micap AI | https://micap.ai
 *
 * USAGE: Include in every page:
 *   <script src="/theme-toggle.js"></script>
 *
 * Add toggle button to navigation:
 *   <button id="theme-toggle" class="theme-toggle" aria-label="Toggle theme">
 *     <span class="theme-icon">🌙</span>
 *   </button>
 */

(function() {
  'use strict';

  // Configuration
  const THEME_KEY = 'micap-theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';
  const SYSTEM_THEME = 'system';

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
    if (theme === LIGHT_THEME) {
      document.documentElement.setAttribute('data-theme', LIGHT_THEME);
      updateToggleIcon('☀️');
    } else {
      document.documentElement.removeAttribute('data-theme');
      updateToggleIcon('🌙');
    }
    localStorage.setItem(THEME_KEY, theme);
  }

  // Update toggle button icon
  function updateToggleIcon(icon) {
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      const iconSpan = toggle.querySelector('.theme-icon');
      if (iconSpan) {
        iconSpan.textContent = icon;
      }
    }
  }

  // Toggle between themes
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const newTheme = current === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;
    applyTheme(newTheme);
  }

  // Initialize on DOM ready
  function init() {
    // Apply initial theme
    const initialTheme = getInitialTheme();
    applyTheme(initialTheme);

    // Attach toggle listener
    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', toggleTheme);
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
