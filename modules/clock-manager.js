/**
 * Clock Manager Module
 * Handles game clock and shot clock with server-sync
 */

import CONFIG from "./config.js";
import { formatTime, parseTimestamp } from "./utils.js";

class ClockManager {
  constructor() {
    this.interval = null;

    // Game Clock State
    this.gameDuration = CONFIG.game.defaultGameDuration;
    this.gameClockStartedAt = null;
    this.gameElapsedBeforePause = 0;

    // Shot Clock State
    this.shotDuration = CONFIG.game.defaultShotDuration;
    this.shotPartialReset = CONFIG.game.defaultShotPartialReset;
    this.shotClockStartedAt = null;
    this.shotElapsedBeforePause = 0;

    // Status
    this.status = CONFIG.status.idle;

    // Callbacks
    this.updateCallback = null;
  }

  /**
   * Set callback for clock updates
   * @param {Function} callback - Function to call on each tick
   */
  onUpdate(callback) {
    this.updateCallback = callback;
  }

  /**
   * Sync with Firebase data
   * @param {Object} data - Firebase scoreboard data
   */
  syncWithFirebase(data) {
    this.gameDuration = data.gameDuration ?? CONFIG.game.defaultGameDuration;
    this.shotDuration = data.shotDuration ?? CONFIG.game.defaultShotDuration;
    this.shotPartialReset =
      data.shotPartialReset ?? CONFIG.game.defaultShotPartialReset;

    this.gameClockStartedAt = parseTimestamp(data.clockStartedAt);
    this.gameElapsedBeforePause = data.elapsedBeforePause ?? 0;

    this.shotClockStartedAt = parseTimestamp(data.shotStartedAt);
    this.shotElapsedBeforePause = data.shotElapsedBeforePause ?? 0;

    const newStatus = data.status ?? CONFIG.status.idle;
    const wasRunning = this.status === CONFIG.status.running;
    this.status = newStatus;

    // If status is running but no server timestamp, use local time as fallback
    if (this.status === CONFIG.status.running && !this.gameClockStartedAt) {
      this.gameClockStartedAt = Date.now();
    }
    if (this.status === CONFIG.status.running && !this.shotClockStartedAt) {
      this.shotClockStartedAt = Date.now();
    }

    // Start or stop based on status
    if (this.status === CONFIG.status.running) {
      this.start();
    } else {
      this.stop();
      // Emit one update so UI reflects current paused/idle clock values
      this.emitUpdate();
    }
  }

  /**
   * Calculate current game clock time
   * @returns {number} Remaining time in seconds
   */
  getGameClockTime() {
    if (this.status === CONFIG.status.running && this.gameClockStartedAt) {
      // Calculate elapsed time since clock started
      const now = Date.now();
      const elapsedSinceStart = Math.floor(
        (now - this.gameClockStartedAt) / 1000,
      );
      const totalElapsed = this.gameElapsedBeforePause + elapsedSinceStart;
      const remaining = this.gameDuration - totalElapsed;
      return Math.max(0, remaining);
    } else {
      // Paused or idle - use stored elapsed time
      const remaining = this.gameDuration - this.gameElapsedBeforePause;
      return Math.max(0, remaining);
    }
  }

  /**
   * Calculate current shot clock time
   * @returns {number} Remaining time in seconds
   */
  getShotClockTime() {
    if (this.status === CONFIG.status.running && this.shotClockStartedAt) {
      // Calculate elapsed time since shot clock started
      const now = Date.now();
      const elapsedSinceStart = Math.floor(
        (now - this.shotClockStartedAt) / 1000,
      );
      const totalElapsed = this.shotElapsedBeforePause + elapsedSinceStart;
      const remaining = this.shotDuration - totalElapsed;
      return Math.max(0, remaining);
    } else {
      // Paused or idle - use stored elapsed time
      const remaining = this.shotDuration - this.shotElapsedBeforePause;
      return Math.max(0, remaining);
    }
  }

  /**
   * Emit a single clock update to the callback
   */
  emitUpdate() {
    const gameTime = this.getGameClockTime();
    const shotTime = this.getShotClockTime();

    if (this.updateCallback) {
      this.updateCallback({
        gameTime,
        gameFormatted: formatTime(gameTime),
        shotTime,
        shotFormatted: shotTime.toString(),
      });
    }
  }

  /**
   * Start the clock update interval
   */
  start() {
    this.stop(); // Clear any existing interval

    this.interval = setInterval(() => {
      this.emitUpdate();
    }, CONFIG.game.clockUpdateInterval);
  }

  /**
   * Stop the clock update interval
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Check if clock is running
   * @returns {boolean}
   */
  isRunning() {
    return this.interval !== null && this.status === CONFIG.status.running;
  }

  /**
   * Get current status
   * @returns {string}
   */
  getStatus() {
    return this.status;
  }

  /**
   * Reset clocks to defaults
   */
  reset() {
    this.stop();
    this.gameClockStartedAt = null;
    this.gameElapsedBeforePause = 0;
    this.shotClockStartedAt = null;
    this.shotElapsedBeforePause = 0;
    this.status = CONFIG.status.idle;
  }
}

// Create and export singleton instance
export const clockManager = new ClockManager();
