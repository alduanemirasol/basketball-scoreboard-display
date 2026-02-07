/** User interaction event management */

import CONFIG from "./config.js";
import { themeManager } from "./theme-manager.js";

export class EventHandler {
  constructor(elements) {
    this.elements = elements;
    this.listeners = [];
  }

  /** Bind all event listeners. */
  init() {
    this.setupThemeToggle();
    this.setupKeyboardShortcuts();
  }

  /** Bind theme toggle button click. */
  setupThemeToggle() {
    if (!this.elements.themeToggle) return;
    const handler = () => themeManager.toggle();
    this.elements.themeToggle.addEventListener("click", handler);
    this.listeners.push({
      element: this.elements.themeToggle,
      event: "click",
      handler,
    });
  }

  /** Bind keyboard shortcuts. */
  setupKeyboardShortcuts() {
    const handler = (e) => {
      if (
        e.key === CONFIG.theme.toggleKey ||
        e.key === CONFIG.theme.toggleKey.toUpperCase()
      ) {
        themeManager.toggle();
      }
    };
    document.addEventListener("keydown", handler);
    this.listeners.push({ element: document, event: "keydown", handler });
  }

  /** Remove all registered event listeners. */
  cleanup() {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}
