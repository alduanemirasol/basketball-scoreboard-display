/** Application entry point — wires all modules together */

import CONFIG from "./config.js";
import { getElements } from "./dom-utils.js";
import { parseTimestamp } from "./utils.js";
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

  /** Bootstrap the application. */
  init() {
    if (this.isInitialized) return;

    console.log("Initializing scoreboard...");

    this.elements = getElements();
    this.uiUpdater = new UIUpdater(this.elements);
    this.eventHandler = new EventHandler(this.elements);

    themeManager.init();
    initAnimations();
    this.eventHandler.init();
    this.setupClockManager();
    this.setupStateListeners();
    this.startFirebaseSync();

    this.isInitialized = true;
    console.log("Scoreboard ready");
  }

  /** Forward clock ticks to the UI updater. */
  setupClockManager() {
    clockManager.onUpdate((data) => this.uiUpdater.updateClocks(data));
  }

  /** Re-render UI on every state change. */
  setupStateListeners() {
    stateStore.subscribe((state, prev) =>
      this.uiUpdater.updateAll(state, prev),
    );
  }

  /** Map incoming Firebase data to clock manager and state store. */
  startFirebaseSync() {
    firebaseService.listen((data) => {
      clockManager.syncWithFirebase(data);

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
        clockStartedAt: parseTimestamp(data.clockStartedAt),
        elapsedBeforePause: data.elapsedBeforePause ?? 0,
        shotStartedAt: parseTimestamp(data.shotStartedAt),
        shotElapsedBeforePause: data.shotElapsedBeforePause ?? 0,
        possession: data.possession ?? CONFIG.possession.none,
      });
    });
  }

  /** Tear down all listeners and intervals. */
  destroy() {
    clockManager.stop();
    this.eventHandler.cleanup();
    firebaseService.stopListening();
    this.isInitialized = false;
  }

  /** Return diagnostic info. */
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

const app = new ScoreboardApp();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => app.init());
} else {
  app.init();
}

export default app;
