/**
 * Theme Manager Module
 * Handles theme switching and persistence
 */

import CONFIG from "./config.js";
import { triggerAnimation } from "./dom-utils.js";

class ThemeManager {
  constructor() {
    this.currentTheme = CONFIG.theme.defaultTheme;
  }

  /**
   * Initialize theme from storage or default
   */
  init() {
    const savedTheme =
      localStorage.getItem(CONFIG.theme.storageKey) ||
      CONFIG.theme.defaultTheme;
    this.setTheme(savedTheme, false);
  }

  /**
   * Set the current theme
   * @param {string} theme - Theme name ('dark' or 'light')
   * @param {boolean} animate - Whether to animate the change
   */
  setTheme(theme, animate = true) {
    // Remove all theme classes
    document.body.classList.remove("theme-dark", "theme-light");

    // Add new theme class
    document.body.classList.add(`theme-${theme}`);

    this.currentTheme = theme;

    // Save to storage
    localStorage.setItem(CONFIG.theme.storageKey, theme);

    // Trigger animation if requested
    if (animate) {
      const toggleButton = document.getElementById("themeToggle");
      if (toggleButton) {
        triggerAnimation(
          toggleButton,
          "theme-change",
          CONFIG.animations.themeChange,
        );
      }
    }
  }

  /**
   * Toggle between dark and light themes
   */
  toggle() {
    const newTheme = this.currentTheme === "dark" ? "light" : "dark";
    this.setTheme(newTheme, true);
  }

  /**
   * Get current theme
   * @returns {string}
   */
  getTheme() {
    return this.currentTheme;
  }

  /**
   * Check if current theme is dark
   * @returns {boolean}
   */
  isDark() {
    return this.currentTheme === "dark";
  }

  /**
   * Check if current theme is light
   * @returns {boolean}
   */
  isLight() {
    return this.currentTheme === "light";
  }
}

// Create and export singleton instance
export const themeManager = new ThemeManager();
