/**
 * Event Handler Module
 * Manages all user interaction events
 */

import CONFIG from "./config.js";
import { themeManager } from "./theme-manager.js";

export class EventHandler {
  constructor(elements) {
    this.elements = elements;
    this.listeners = [];
  }

  /**
   * Initialize all event listeners
   */
  init() {
    this.setupThemeToggle();
    this.setupKeyboardShortcuts();
  }

  /**
   * Setup theme toggle button
   */
  setupThemeToggle() {
    if (this.elements.themeToggle) {
      const handler = () => themeManager.toggle();
      this.elements.themeToggle.addEventListener("click", handler);
      this.listeners.push({
        element: this.elements.themeToggle,
        event: "click",
        handler,
      });
    }
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    const handler = (e) => {
      // Theme toggle shortcut
      if (
        e.key === CONFIG.theme.toggleKey ||
        e.key === CONFIG.theme.toggleKey.toUpperCase()
      ) {
        themeManager.toggle();
      }
    };

    document.addEventListener("keydown", handler);
    this.listeners.push({
      element: document,
      event: "keydown",
      handler,
    });
  }

  /**
   * Remove all event listeners
   */
  cleanup() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}
