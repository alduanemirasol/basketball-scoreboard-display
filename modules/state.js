/**
 * State Management Module
 * Manages application state and provides state-related utilities
 */

import CONFIG from "./config.js";

/**
 * Application state store
 */
class StateStore {
  constructor() {
    this.state = {
      // Scores
      homeScore: 0,
      awayScore: 0,

      // Game info
      period: CONFIG.game.defaultPeriod,
      maxPeriod: CONFIG.game.maxPeriods,

      // Clock configuration
      gameDuration: CONFIG.game.defaultGameDuration,
      shotDuration: CONFIG.game.defaultShotDuration,
      shotPartialReset: CONFIG.game.defaultShotPartialReset,

      // Clock state
      status: CONFIG.status.idle,
      clockStartedAt: null,
      elapsedBeforePause: 0,
      shotStartedAt: null,
      shotElapsedBeforePause: 0,

      // Fouls
      homeFouls: 0,
      awayFouls: 0,

      // Possession
      possession: CONFIG.possession.none,
    };

    this.previousState = { ...this.state };
    this.listeners = [];
  }

  /**
   * Get current state
   * @returns {Object}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Get previous state
   * @returns {Object}
   */
  getPreviousState() {
    return { ...this.previousState };
  }

  /**
   * Update state with new data
   * @param {Object} newState - New state values
   */
  setState(newState) {
    this.previousState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.notifyListeners(this.state, this.previousState);
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /**
   * Notify all listeners of state change
   * @param {Object} state - Current state
   * @param {Object} previousState - Previous state
   */
  notifyListeners(state, previousState) {
    this.listeners.forEach((listener) => listener(state, previousState));
  }

  /**
   * Check if a specific field has changed
   * @param {string} field - Field name to check
   * @returns {boolean}
   */
  hasChanged(field) {
    return this.state[field] !== this.previousState[field];
  }

  /**
   * Reset state to defaults
   */
  reset() {
    this.setState({
      homeScore: 0,
      awayScore: 0,
      period: CONFIG.game.defaultPeriod,
      maxPeriod: CONFIG.game.maxPeriods,
      gameDuration: CONFIG.game.defaultGameDuration,
      shotDuration: CONFIG.game.defaultShotDuration,
      shotPartialReset: CONFIG.game.defaultShotPartialReset,
      status: CONFIG.status.idle,
      clockStartedAt: null,
      elapsedBeforePause: 0,
      shotStartedAt: null,
      shotElapsedBeforePause: 0,
      homeFouls: 0,
      awayFouls: 0,
      possession: CONFIG.possession.none,
    });
  }
}

// Create and export singleton instance
export const stateStore = new StateStore();
