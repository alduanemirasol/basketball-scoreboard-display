/** Theme switching and persistence */

import CONFIG from "./config.js";
import { triggerAnimation } from "./dom-utils.js";

class ThemeManager {
  constructor() {
    this.currentTheme = CONFIG.theme.defaultTheme;
  }

  /** Load saved theme or apply default. */
  init() {
    const saved =
      localStorage.getItem(CONFIG.theme.storageKey) ||
      CONFIG.theme.defaultTheme;
    this.setTheme(saved, false);
  }

  /** Apply a theme and optionally animate the toggle button. */
  setTheme(theme, animate = true) {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(`theme-${theme}`);
    this.currentTheme = theme;
    localStorage.setItem(CONFIG.theme.storageKey, theme);

    if (animate) {
      const btn = document.getElementById("themeToggle");
      if (btn)
        triggerAnimation(btn, "theme-change", CONFIG.animations.themeChange);
    }
  }

  /** Toggle between dark and light. */
  toggle() {
    this.setTheme(this.currentTheme === "dark" ? "light" : "dark");
  }

  /** @returns {string} */
  getTheme() {
    return this.currentTheme;
  }

  /** @returns {boolean} */
  isDark() {
    return this.currentTheme === "dark";
  }

  /** @returns {boolean} */
  isLight() {
    return this.currentTheme === "light";
  }
}

export const themeManager = new ThemeManager();
