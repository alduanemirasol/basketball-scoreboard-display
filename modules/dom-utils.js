/**
 * DOM Utilities Module
 * Handles DOM element selection and common DOM operations
 */

/**
 * Get element by ID (shorthand)
 */
export const $ = (id) => document.getElementById(id);

/**
 * Get all DOM elements used by the scoreboard
 */
export function getElements() {
  return {
    homeScore: $("homeScore"),
    awayScore: $("awayScore"),
    homeFouls: $("homeFouls"),
    awayFouls: $("awayFouls"),
    period: $("period"),
    maxPeriod: $("maxPeriod"),
    gameClock: $("gameClock"),
    shotClock: $("shotClock"),
    status: $("status"),
    homeTeam: $("homeTeam"),
    awayTeam: $("awayTeam"),
    themeToggle: $("themeToggle"),
    liveIndicator: $("liveIndicator"),
  };
}

/**
 * Add animation class and remove after duration
 * @param {HTMLElement} element - Element to animate
 * @param {string} animationClass - CSS class to apply
 * @param {number} duration - Duration in milliseconds
 */
export function triggerAnimation(element, animationClass, duration = 600) {
  if (!element) return;

  element.classList.add(animationClass);
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, duration);
}

/**
 * Toggle CSS class on element
 * @param {HTMLElement} element - Element to toggle class on
 * @param {string} className - Class name to toggle
 * @param {boolean} condition - Whether to add or remove class
 */
export function toggleClass(element, className, condition) {
  if (!element) return;
  element.classList.toggle(className, condition);
}

/**
 * Set text content safely
 * @param {HTMLElement} element - Element to update
 * @param {string|number} text - Text content to set
 */
export function setText(element, text) {
  if (!element) return;
  element.textContent = text;
}

/**
 * Create and inject CSS styles
 * @param {string} css - CSS text to inject
 */
export function injectStyles(css) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}
