/** UI update logic for all scoreboard display elements */

import CONFIG from "./config.js";
import { formatTime } from "./utils.js";
import { triggerAnimation, toggleClass, setText } from "./dom-utils.js";

export class UIUpdater {
  constructor(elements) {
    this.elements = elements;
    this.previousGameTime = CONFIG.game.defaultGameDuration;
  }

  /** Play the buzzer audio element. */
  playBuzzerSound() {
    const buzzer = document.getElementById("buzzerSound");
    if (!buzzer) return;
    buzzer.currentTime = 0;
    buzzer.play().catch((err) => console.error("Buzzer play failed:", err));
  }

  /** Update score text for both teams. */
  updateScores(homeScore, awayScore) {
    setText(this.elements.homeScore, homeScore ?? 0);
    setText(this.elements.awayScore, awayScore ?? 0);
  }

  /** Trigger score-change animation when values differ. */
  animateScoreChange(newHome, newAway, oldHome, oldAway) {
    if (newHome !== oldHome) {
      triggerAnimation(
        this.elements.homeScore,
        "score-changed",
        CONFIG.animations.scoreChange,
      );
    }
    if (newAway !== oldAway) {
      triggerAnimation(
        this.elements.awayScore,
        "score-changed",
        CONFIG.animations.scoreChange,
      );
    }
  }

  /** Toggle leading-team highlight classes. */
  updateLeadingTeam(homeScore, awayScore) {
    toggleClass(this.elements.homeTeam, "is-leading", homeScore > awayScore);
    toggleClass(this.elements.awayTeam, "is-leading", awayScore > homeScore);
  }

  /** Update possession indicator and animate on change. */
  updatePossession(possession, previousPossession) {
    const hasHome = possession === CONFIG.possession.home;
    const hasAway = possession === CONFIG.possession.away;

    toggleClass(this.elements.homeTeam, "has-possession", hasHome);
    toggleClass(this.elements.awayTeam, "has-possession", hasAway);

    if (possession !== previousPossession && possession) {
      const team = hasHome ? this.elements.homeTeam : this.elements.awayTeam;
      triggerAnimation(
        team,
        "possession-change",
        CONFIG.animations.possessionChange,
      );
    }
  }

  /** Update foul counts and apply warning/danger classes. */
  updateFouls(homeFouls, awayFouls) {
    setText(this.elements.homeFouls, homeFouls ?? 0);
    setText(this.elements.awayFouls, awayFouls ?? 0);

    const homeContainer = this.elements.homeFouls?.closest(".stat-item");
    const awayContainer = this.elements.awayFouls?.closest(".stat-item");

    if (homeContainer) {
      toggleClass(
        homeContainer,
        "high-fouls",
        homeFouls >= CONFIG.fouls.warningThreshold &&
          homeFouls < CONFIG.fouls.dangerThreshold,
      );
      toggleClass(
        homeContainer,
        "danger-fouls",
        homeFouls >= CONFIG.fouls.dangerThreshold,
      );
    }

    if (awayContainer) {
      toggleClass(
        awayContainer,
        "high-fouls",
        awayFouls >= CONFIG.fouls.warningThreshold &&
          awayFouls < CONFIG.fouls.dangerThreshold,
      );
      toggleClass(
        awayContainer,
        "danger-fouls",
        awayFouls >= CONFIG.fouls.dangerThreshold,
      );
    }
  }

  /** Update period display. */
  updatePeriod(period, maxPeriod) {
    setText(this.elements.period, period ?? CONFIG.game.defaultPeriod);
    setText(this.elements.maxPeriod, maxPeriod ?? CONFIG.game.maxPeriods);
  }

  /**
   * Update game clock text. When gameTime is provided, detect
   * the zero-transition to trigger the buzzer and apply the red style.
   */
  updateGameClock(formattedTime, gameTime = null) {
    setText(this.elements.gameClock, formattedTime);

    if (gameTime !== null) {
      if (this.previousGameTime > 0 && gameTime <= 0) {
        this.playBuzzerSound();
      }

      if (gameTime <= 0) {
        this.elements.gameClock.classList.add("clock-zero");
      } else {
        this.elements.gameClock.classList.remove("clock-zero");
      }

      this.previousGameTime = gameTime;
    }
  }

  /** Update shot clock text and warning/danger classes. */
  updateShotClock(shotTime) {
    setText(this.elements.shotClock, shotTime);

    const container = document.querySelector(".shot-clock-container");
    if (!container) return;

    container.classList.remove("warning", "danger");

    if (shotTime <= CONFIG.shotClock.dangerThreshold && shotTime > 0) {
      container.classList.add("danger");
    } else if (
      shotTime <= CONFIG.shotClock.warningThreshold &&
      shotTime > CONFIG.shotClock.dangerThreshold
    ) {
      container.classList.add("warning");
    }
  }

  /** Update status text and body-level state classes. */
  updateStatus(status) {
    setText(this.elements.status, status.toUpperCase());
    toggleClass(document.body, "running", status === CONFIG.status.running);
    toggleClass(document.body, "paused", status === CONFIG.status.paused);
    toggleClass(document.body, "idle", status === CONFIG.status.idle);
    toggleClass(document.body, "finished", status === CONFIG.status.finished);
  }

  /** Update both game clock and shot clock from clockManager data. */
  updateClocks(clockData) {
    this.updateGameClock(clockData.gameFormatted, clockData.gameTime);
    this.updateShotClock(clockData.shotTime);
  }

  /** Full UI refresh from state (called on every state change). */
  updateAll(state, previousState) {
    if (previousState) {
      this.animateScoreChange(
        state.homeScore,
        state.awayScore,
        previousState.homeScore,
        previousState.awayScore,
      );
    }

    this.updateScores(state.homeScore, state.awayScore);
    this.updateFouls(state.homeFouls, state.awayFouls);
    this.updatePeriod(state.period, state.maxPeriod);
    this.updateLeadingTeam(state.homeScore, state.awayScore);
    this.updatePossession(state.possession, previousState?.possession);
    this.updateStatus(state.status);
  }
}
