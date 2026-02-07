/**
 * Main Application Module
 * Orchestrates all modules and initializes the app
 */

import CONFIG from "./config.js";
import { getElements } from "./dom-utils.js";
import { stateStore } from "./state.js";
import { clockManager } from "./clock-manager.js";
import { themeManager } from "./theme-manager.js";
import { UIUpdater } from "./ui-updater.js";
import { firebaseService } from "./firebase-service.js";
import { EventHandler } from "./event-handler.js";
import { initAnimations } from "./animations.js";

class ScoreboardApp {
  constructor() {
    this.elements = null;
    this.uiUpdater = null;
    this.eventHandler = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the entire application
   */
  init() {
    if (this.isInitialized) {
      console.warn("App already initialized");
      return;
    }

    console.log("🏀 Initializing Basketball Scoreboard...");

    // Get DOM elements
    this.elements = getElements();

    // Initialize managers
    this.uiUpdater = new UIUpdater(this.elements);
    this.eventHandler = new EventHandler(this.elements);

    // Setup theme
    themeManager.init();

    // Setup animations
    initAnimations();

    // Setup event handlers
    this.eventHandler.init();

    // Setup clock manager callbacks
    this.setupClockManager();

    // Setup state listeners
    this.setupStateListeners();

    // Start Firebase listener
    this.startFirebaseSync();

    this.isInitialized = true;
    console.log("✅ Scoreboard initialized successfully");
  }

  /**
   * Setup clock manager with update callback
   */
  setupClockManager() {
    clockManager.onUpdate((clockData) => {
      // Update UI with clock data
      this.uiUpdater.updateClocks(clockData);
    });
  }

  /**
   * Setup state change listeners
   */
  setupStateListeners() {
    stateStore.subscribe((state, previousState) => {
      // Update UI with new state
      this.uiUpdater.updateAll(state, previousState);
    });
  }

  /**
   * Start syncing with Firebase
   */
  startFirebaseSync() {
    firebaseService.listen((data) => {
      // Sync clock manager with Firebase data
      clockManager.syncWithFirebase(data);

      // Update state store with Firebase data
      stateStore.setState({
        homeScore: data.homeScore ?? 0,
        awayScore: data.awayScore ?? 0,
        homeFouls: data.homeFouls ?? 0,
        awayFouls: data.awayFouls ?? 0,
        period: data.period ?? CONFIG.game.defaultPeriod,
        maxPeriod: data.maxPeriod ?? CONFIG.game.maxPeriods,
        gameDuration: data.gameDuration ?? CONFIG.game.defaultGameDuration,
        shotDuration: data.shotDuration ?? CONFIG.game.defaultShotDuration,
        shotPartialReset:
          data.shotPartialReset ?? CONFIG.game.defaultShotPartialReset,
        status: data.status ?? CONFIG.status.idle,
        clockStartedAt: data.clockStartedAt,
        elapsedBeforePause: data.elapsedBeforePause ?? 0,
        shotStartedAt: data.shotStartedAt,
        shotElapsedBeforePause: data.shotElapsedBeforePause ?? 0,
        possession: data.possession ?? CONFIG.possession.none,
      });
    });
  }

  /**
   * Cleanup and destroy the app
   */
  destroy() {
    console.log("🧹 Cleaning up scoreboard...");

    // Stop clock
    clockManager.stop();

    // Remove event listeners
    this.eventHandler.cleanup();

    // Stop Firebase listener
    firebaseService.stopListening();

    this.isInitialized = false;
    console.log("✅ Cleanup complete");
  }

  /**
   * Get app info
   */
  getInfo() {
    return {
      initialized: this.isInitialized,
      theme: themeManager.getTheme(),
      clockRunning: clockManager.isRunning(),
      clockStatus: clockManager.getStatus(),
      currentState: stateStore.getState(),
    };
  }
}

// Create singleton instance
const app = new ScoreboardApp();

// Initialize on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => app.init());
} else {
  app.init();
}

// Export for debugging/testing
export default app;
