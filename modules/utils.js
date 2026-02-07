/**
 * Utility Functions Module
 * Common helper functions used across the application
 */

/**
 * Format seconds to MM:SS display
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string (e.g., "12:00")
 */
export function formatTime(seconds) {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Parse Firebase timestamp value
 * Firebase may store null as the string "null"
 * @param {*} value - Value from Firebase
 * @returns {number|null} Parsed timestamp or null
 */
export function parseTimestamp(value) {
  if (value === null || value === undefined || value === "null") {
    return null;
  }
  return Number(value);
}
