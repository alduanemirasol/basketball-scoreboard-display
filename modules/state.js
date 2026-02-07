/** Reactive state store with change notification */

import CONFIG from "./config.js";

class StateStore {
  constructor() {
    this.state = {
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
    };

    this.previousState = { ...this.state };
    this.listeners = [];
  }

  /** @returns {Object} Copy of current state */
  getState() {
    return { ...this.state };
  }

  /** @returns {Object} Copy of previous state */
  getPreviousState() {
    return { ...this.previousState };
  }

  /** Merge new values into state and notify listeners. */
  setState(newState) {
    this.previousState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.notifyListeners(this.state, this.previousState);
  }

  /** Subscribe to state changes. Returns an unsubscribe function. */
  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  /** Notify all registered listeners. */
  notifyListeners(state, previousState) {
    this.listeners.forEach((listener) => listener(state, previousState));
  }

  /** Check whether a specific field changed in the last update. */
  hasChanged(field) {
    return this.state[field] !== this.previousState[field];
  }

  /** Reset all state to defaults. */
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

export const stateStore = new StateStore();
