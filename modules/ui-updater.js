/**
 * UI Updater Module
 * Handles all UI updates and visual feedback
 */

import CONFIG from "./config.js";
import { formatTime } from "./utils.js";
import { triggerAnimation, toggleClass, setText } from "./dom-utils.js";

export class UIUpdater {
  constructor(elements) {
    this.elements = elements;
  }

  /**
   * Update score displays
   * @param {number} homeScore
   * @param {number} awayScore
   */
  updateScores(homeScore, awayScore) {
    setText(this.elements.homeScore, homeScore ?? 0);
    setText(this.elements.awayScore, awayScore ?? 0);
  }

  /**
   * Animate score changes
   * @param {number} newHomeScore
   * @param {number} newAwayScore
   * @param {number} oldHomeScore
   * @param {number} oldAwayScore
   */
  animateScoreChange(newHomeScore, newAwayScore, oldHomeScore, oldAwayScore) {
    if (newHomeScore !== oldHomeScore) {
      triggerAnimation(
        this.elements.homeScore,
        "score-changed",
        CONFIG.animations.scoreChange,
      );
    }
    if (newAwayScore !== oldAwayScore) {
      triggerAnimation(
        this.elements.awayScore,
        "score-changed",
        CONFIG.animations.scoreChange,
      );
    }
  }

  /**
   * Update team leading indicators
   * @param {number} homeScore
   * @param {number} awayScore
   */
  updateLeadingTeam(homeScore, awayScore) {
    const isHomeLeading = homeScore > awayScore;
    const isAwayLeading = awayScore > homeScore;

    toggleClass(this.elements.homeTeam, "is-leading", isHomeLeading);
    toggleClass(this.elements.awayTeam, "is-leading", isAwayLeading);
  }

  /**
   * Update possession indicators
   * @param {string|null} possession
   * @param {string|null} previousPossession
   */
  updatePossession(possession, previousPossession) {
    const hasHomePos = possession === CONFIG.possession.home;
    const hasAwayPos = possession === CONFIG.possession.away;

    toggleClass(this.elements.homeTeam, "has-possession", hasHomePos);
    toggleClass(this.elements.awayTeam, "has-possession", hasAwayPos);

    // Animate possession change
    if (possession !== previousPossession && possession) {
      const activeTeam = hasHomePos
        ? this.elements.homeTeam
        : this.elements.awayTeam;
      triggerAnimation(
        activeTeam,
        "possession-change",
        CONFIG.animations.possessionChange,
      );
    }
  }

  /**
   * Update foul displays with warning states
   * @param {number} homeFouls
   * @param {number} awayFouls
   */
  updateFouls(homeFouls, awayFouls) {
    setText(this.elements.homeFouls, homeFouls ?? 0);
    setText(this.elements.awayFouls, awayFouls ?? 0);

    const homeFoulsContainer = this.elements.homeFouls?.closest(".stat-item");
    const awayFoulsContainer = this.elements.awayFouls?.closest(".stat-item");

    if (homeFoulsContainer) {
      toggleClass(
        homeFoulsContainer,
        "high-fouls",
        homeFouls >= CONFIG.fouls.warningThreshold &&
          homeFouls < CONFIG.fouls.dangerThreshold,
      );
      toggleClass(
        homeFoulsContainer,
        "danger-fouls",
        homeFouls >= CONFIG.fouls.dangerThreshold,
      );
    }

    if (awayFoulsContainer) {
      toggleClass(
        awayFoulsContainer,
        "high-fouls",
        awayFouls >= CONFIG.fouls.warningThreshold &&
          awayFouls < CONFIG.fouls.dangerThreshold,
      );
      toggleClass(
        awayFoulsContainer,
        "danger-fouls",
        awayFouls >= CONFIG.fouls.dangerThreshold,
      );
    }
  }

  /**
   * Update period display
   * @param {number} period
   * @param {number} maxPeriod
   */
  updatePeriod(period, maxPeriod) {
    setText(this.elements.period, period ?? CONFIG.game.defaultPeriod);
    setText(this.elements.maxPeriod, maxPeriod ?? CONFIG.game.maxPeriods);
  }

  /**
   * Update game clock display
   * @param {string} formattedTime - Already formatted time string
   */
  updateGameClock(formattedTime) {
    setText(this.elements.gameClock, formattedTime);
  }

  /**
   * Update shot clock display
   * @param {number} shotTime - Shot clock time in seconds
   */
  updateShotClock(shotTime) {
    setText(this.elements.shotClock, shotTime);

    const shotClockContainer = document.querySelector(".shot-clock-container");
    if (!shotClockContainer) return;

    // Remove all warning classes
    shotClockContainer.classList.remove("warning", "danger");

    // Add appropriate warning class
    if (shotTime <= CONFIG.shotClock.dangerThreshold && shotTime > 0) {
      shotClockContainer.classList.add("danger");
    } else if (
      shotTime <= CONFIG.shotClock.warningThreshold &&
      shotTime > CONFIG.shotClock.dangerThreshold
    ) {
      shotClockContainer.classList.add("warning");
    }
  }

  /**
   * Update game status display and body classes
   * @param {string} status
   */
  updateStatus(status) {
    const statusText = status.toUpperCase();
    setText(this.elements.status, statusText);

    // Update body classes for global styling
    toggleClass(document.body, "running", status === CONFIG.status.running);
    toggleClass(document.body, "paused", status === CONFIG.status.paused);
    toggleClass(document.body, "idle", status === CONFIG.status.idle);
    toggleClass(document.body, "finished", status === CONFIG.status.finished);
  }

  /**
   * Update both clocks at once
   * @param {Object} clockData - Clock data from clockManager
   */
  updateClocks(clockData) {
    this.updateGameClock(clockData.gameFormatted);
    this.updateShotClock(clockData.shotTime);
  }

  /**
   * Update all UI elements at once
   * @param {Object} state - Current state
   * @param {Object} previousState - Previous state
   */
  updateAll(state, previousState) {
    // Animate score changes before updating
    if (previousState) {
      this.animateScoreChange(
        state.homeScore,
        state.awayScore,
        previousState.homeScore,
        previousState.awayScore,
      );
    }

    // Update all displays
    this.updateScores(state.homeScore, state.awayScore);
    this.updateFouls(state.homeFouls, state.awayFouls);
    this.updatePeriod(state.period, state.maxPeriod);
    this.updateLeadingTeam(state.homeScore, state.awayScore);
    this.updatePossession(state.possession, previousState?.possession);
    this.updateStatus(state.status);
  }
}
