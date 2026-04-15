/**
 * Theme Toggle Component
 * Handles dark/light mode switching with localStorage persistence
 */

class ThemeToggle {
  constructor() {
    this.element = document.getElementById('themeToggle');
    this.theme = this.loadTheme();
    this.init();
  }

  loadTheme() {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved) return saved;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }

    return 'light';
  }

  init() {
    this.applyTheme(this.theme);
    this.setupEventListener();
  }

  setupEventListener() {
    if (this.element) {
      this.element.addEventListener('click', () => this.toggle());
    }
  }

  toggle() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    this.applyTheme(this.theme);
    this.saveTheme();
  }

  applyTheme(theme) {
    const html = document.documentElement;
    if (theme === 'light') {
      html.setAttribute('data-theme', 'light');
      if (this.element) {
        this.element.querySelector('span').textContent = '☀️';
        this.element.title = 'Switch to Dark Mode';
      }
    } else {
      html.setAttribute('data-theme', 'dark');
      if (this.element) {
        this.element.querySelector('span').textContent = '🌙';
        this.element.title = 'Switch to Light Mode';
      }
    }
  }

  saveTheme() {
    localStorage.setItem('theme', this.theme);
  }
}

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.themeToggle = new ThemeToggle();
  });
} else {
  window.themeToggle = new ThemeToggle();
}
