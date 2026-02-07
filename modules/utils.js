/** Shared utility functions */

/**
 * Format seconds as MM:SS.
 * @param {number} seconds
 * @returns {string}
 */
export function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Parse a Firebase timestamp that may be stored as the string "null".
 * @param {*} value
 * @returns {number|null}
 */
export function parseTimestamp(value) {
  if (value === null || value === undefined || value === "null") {
    return null;
  }
  return Number(value);
}
