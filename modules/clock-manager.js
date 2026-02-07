/** Game clock and shot clock management with server-time sync */

import CONFIG from "./config.js";
import { formatTime, parseTimestamp } from "./utils.js";

class ClockManager {
  constructor() {
    this.interval = null;
    this.gameDuration = CONFIG.game.defaultGameDuration;
    this.gameClockStartedAt = null;
    this.gameElapsedBeforePause = 0;
    this.shotDuration = CONFIG.game.defaultShotDuration;
    this.shotPartialReset = CONFIG.game.defaultShotPartialReset;
    this.shotClockStartedAt = null;
    this.shotElapsedBeforePause = 0;
    this.status = CONFIG.status.idle;
    this.updateCallback = null;
  }

  /** Register a callback invoked on every clock tick. */
  onUpdate(callback) {
    this.updateCallback = callback;
  }

  /** Sync local clock state with Firebase data. */
  syncWithFirebase(data) {
    this.gameDuration = data.gameDuration ?? CONFIG.game.defaultGameDuration;
    this.shotDuration = data.shotDuration ?? CONFIG.game.defaultShotDuration;
    this.shotPartialReset =
      data.shotPartialReset ?? CONFIG.game.defaultShotPartialReset;

    this.gameClockStartedAt = parseTimestamp(data.clockStartedAt);
    this.gameElapsedBeforePause = data.elapsedBeforePause ?? 0;
    this.shotClockStartedAt = parseTimestamp(data.shotStartedAt);
    this.shotElapsedBeforePause = data.shotElapsedBeforePause ?? 0;
    this.status = data.status ?? CONFIG.status.idle;

    // Fallback to local timestamp when server timestamp is absent
    if (this.status === CONFIG.status.running && !this.gameClockStartedAt) {
      this.gameClockStartedAt = Date.now();
    }
    if (this.status === CONFIG.status.running && !this.shotClockStartedAt) {
      this.shotClockStartedAt = Date.now();
    }

    if (this.status === CONFIG.status.running) {
      this.start();
    } else {
      this.stop();
      this.emitUpdate();
    }
  }

  /** @returns {number} Remaining game clock seconds */
  getGameClockTime() {
    if (this.status === CONFIG.status.running && this.gameClockStartedAt) {
      const elapsed =
        this.gameElapsedBeforePause +
        Math.floor((Date.now() - this.gameClockStartedAt) / 1000);
      return Math.max(0, this.gameDuration - elapsed);
    }
    return Math.max(0, this.gameDuration - this.gameElapsedBeforePause);
  }

  /** @returns {number} Remaining shot clock seconds */
  getShotClockTime() {
    if (this.status === CONFIG.status.running && this.shotClockStartedAt) {
      const elapsed =
        this.shotElapsedBeforePause +
        Math.floor((Date.now() - this.shotClockStartedAt) / 1000);
      return Math.max(0, this.shotDuration - elapsed);
    }
    return Math.max(0, this.shotDuration - this.shotElapsedBeforePause);
  }

  /** Push current clock values to the registered callback. */
  emitUpdate() {
    if (!this.updateCallback) return;
    const gameTime = this.getGameClockTime();
    const shotTime = this.getShotClockTime();
    this.updateCallback({
      gameTime,
      gameFormatted: formatTime(gameTime),
      shotTime,
      shotFormatted: shotTime.toString(),
    });
  }

  /** Start the periodic clock update interval. */
  start() {
    this.stop();
    this.interval = setInterval(
      () => this.emitUpdate(),
      CONFIG.game.clockUpdateInterval,
    );
  }

  /** Stop the periodic clock update interval. */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /** @returns {boolean} */
  isRunning() {
    return this.interval !== null && this.status === CONFIG.status.running;
  }

  /** @returns {string} */
  getStatus() {
    return this.status;
  }

  /** Reset all clock state to defaults. */
  reset() {
    this.stop();
    this.gameClockStartedAt = null;
    this.gameElapsedBeforePause = 0;
    this.shotClockStartedAt = null;
    this.shotElapsedBeforePause = 0;
    this.status = CONFIG.status.idle;
  }
}

export const clockManager = new ClockManager();
