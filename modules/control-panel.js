/**
 * Example Control Panel
 * This shows how to control the scoreboard with the new Firebase structure
 *
 * IMPORTANT: This is example code showing the control logic.
 * You need to create your own UI/buttons for this.
 */

import { db } from "./firebase.js";
import {
  ref,
  update,
  get,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const scoreboardRef = ref(db, "scoreboard");

// ========================================
// CLOCK CONTROLS
// ========================================

/**
 * Start/Resume the game clock and shot clock
 */
export async function startClock() {
  try {
    await update(scoreboardRef, {
      status: "running",
      clockStartedAt: serverTimestamp(),
      shotStartedAt: serverTimestamp(),
    });
    console.log("✅ Clock started");
  } catch (error) {
    console.error("❌ Error starting clock:", error);
  }
}

/**
 * Pause the game clock and shot clock
 */
export async function pauseClock() {
  try {
    // Get current state
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();

    if (data.status !== "running") {
      console.log("⚠️ Clock is not running");
      return;
    }

    // Calculate elapsed time
    const now = Date.now();
    const gameElapsed = data.clockStartedAt
      ? Math.floor((now - data.clockStartedAt) / 1000)
      : 0;
    const shotElapsed = data.shotStartedAt
      ? Math.floor((now - data.shotStartedAt) / 1000)
      : 0;

    // Update to paused state
    await update(scoreboardRef, {
      status: "paused",
      clockStartedAt: null,
      elapsedBeforePause: (data.elapsedBeforePause || 0) + gameElapsed,
      shotStartedAt: null,
      shotElapsedBeforePause: (data.shotElapsedBeforePause || 0) + shotElapsed,
    });

    console.log("⏸️ Clock paused");
  } catch (error) {
    console.error("❌ Error pausing clock:", error);
  }
}

/**
 * Reset game to initial state
 */
export async function resetGame() {
  try {
    await update(scoreboardRef, {
      homeScore: 0,
      awayScore: 0,
      period: 1,
      homeFouls: 0,
      awayFouls: 0,
      status: "idle",
      clockStartedAt: null,
      elapsedBeforePause: 0,
      shotStartedAt: null,
      shotElapsedBeforePause: 0,
      possession: null,
    });
    console.log("🔄 Game reset");
  } catch (error) {
    console.error("❌ Error resetting game:", error);
  }
}

// ========================================
// SHOT CLOCK CONTROLS
// ========================================

/**
 * Reset shot clock to full (24 seconds)
 */
export async function resetShotClockFull() {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();

    await update(scoreboardRef, {
      shotDuration: 24,
      shotStartedAt: data.status === "running" ? serverTimestamp() : null,
      shotElapsedBeforePause: 0,
    });

    console.log("🔄 Shot clock reset to 24");
  } catch (error) {
    console.error("❌ Error resetting shot clock:", error);
  }
}

/**
 * Reset shot clock to partial (14 seconds - offensive rebound)
 */
export async function resetShotClockPartial() {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();

    await update(scoreboardRef, {
      shotDuration: 14,
      shotStartedAt: data.status === "running" ? serverTimestamp() : null,
      shotElapsedBeforePause: 0,
    });

    console.log("🔄 Shot clock reset to 14");
  } catch (error) {
    console.error("❌ Error resetting shot clock:", error);
  }
}

// ========================================
// SCORE CONTROLS
// ========================================

/**
 * Add points to home team
 * @param {number} points - Points to add (1, 2, or 3)
 */
export async function addHomePoints(points) {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const newScore = Math.min(199, (data.homeScore || 0) + points);

    await update(scoreboardRef, { homeScore: newScore });
    console.log(`✅ Home +${points} → ${newScore}`);
  } catch (error) {
    console.error("❌ Error adding home points:", error);
  }
}

/**
 * Add points to away team
 * @param {number} points - Points to add (1, 2, or 3)
 */
export async function addAwayPoints(points) {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const newScore = Math.min(199, (data.awayScore || 0) + points);

    await update(scoreboardRef, { awayScore: newScore });
    console.log(`✅ Away +${points} → ${newScore}`);
  } catch (error) {
    console.error("❌ Error adding away points:", error);
  }
}

/**
 * Subtract points from home team
 * @param {number} points - Points to subtract
 */
export async function subtractHomePoints(points) {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const newScore = Math.max(0, (data.homeScore || 0) - points);

    await update(scoreboardRef, { homeScore: newScore });
    console.log(`✅ Home -${points} → ${newScore}`);
  } catch (error) {
    console.error("❌ Error subtracting home points:", error);
  }
}

/**
 * Subtract points from away team
 * @param {number} points - Points to subtract
 */
export async function subtractAwayPoints(points) {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const newScore = Math.max(0, (data.awayScore || 0) - points);

    await update(scoreboardRef, { awayScore: newScore });
    console.log(`✅ Away -${points} → ${newScore}`);
  } catch (error) {
    console.error("❌ Error subtracting away points:", error);
  }
}

// ========================================
// FOUL CONTROLS
// ========================================

/**
 * Add foul to home team
 */
export async function addHomeFoul() {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const newFouls = Math.min(10, (data.homeFouls || 0) + 1);

    await update(scoreboardRef, { homeFouls: newFouls });
    console.log(`✅ Home fouls → ${newFouls}`);
  } catch (error) {
    console.error("❌ Error adding home foul:", error);
  }
}

/**
 * Add foul to away team
 */
export async function addAwayFoul() {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const newFouls = Math.min(10, (data.awayFouls || 0) + 1);

    await update(scoreboardRef, { awayFouls: newFouls });
    console.log(`✅ Away fouls → ${newFouls}`);
  } catch (error) {
    console.error("❌ Error adding away foul:", error);
  }
}

/**
 * Remove foul from home team
 */
export async function removeHomeFoul() {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const newFouls = Math.max(0, (data.homeFouls || 0) - 1);

    await update(scoreboardRef, { homeFouls: newFouls });
    console.log(`✅ Home fouls → ${newFouls}`);
  } catch (error) {
    console.error("❌ Error removing home foul:", error);
  }
}

/**
 * Remove foul from away team
 */
export async function removeAwayFoul() {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const newFouls = Math.max(0, (data.awayFouls || 0) - 1);

    await update(scoreboardRef, { awayFouls: newFouls });
    console.log(`✅ Away fouls → ${newFouls}`);
  } catch (error) {
    console.error("❌ Error removing away foul:", error);
  }
}

// ========================================
// POSSESSION CONTROLS
// ========================================

/**
 * Set possession to home team
 */
export async function setPossessionHome() {
  try {
    await update(scoreboardRef, { possession: "home" });
    console.log("✅ Possession → Home");
  } catch (error) {
    console.error("❌ Error setting possession:", error);
  }
}

/**
 * Set possession to away team
 */
export async function setPossessionAway() {
  try {
    await update(scoreboardRef, { possession: "away" });
    console.log("✅ Possession → Away");
  } catch (error) {
    console.error("❌ Error setting possession:", error);
  }
}

/**
 * Clear possession (jump ball, etc.)
 */
export async function clearPossession() {
  try {
    await update(scoreboardRef, { possession: null });
    console.log("✅ Possession → None");
  } catch (error) {
    console.error("❌ Error clearing possession:", error);
  }
}

// ========================================
// PERIOD CONTROLS
// ========================================

/**
 * Advance to next period
 */
export async function nextPeriod() {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const currentPeriod = data.period || 1;
    const maxPeriod = data.maxPeriod || 4;

    if (currentPeriod >= maxPeriod) {
      // Game finished
      await update(scoreboardRef, {
        status: "finished",
        clockStartedAt: null,
        shotStartedAt: null,
      });
      console.log("🏁 Game finished");
    } else {
      // Next period
      await update(scoreboardRef, {
        period: currentPeriod + 1,
        status: "idle",
        clockStartedAt: null,
        elapsedBeforePause: 0,
        shotStartedAt: null,
        shotElapsedBeforePause: 0,
      });
      console.log(`✅ Period → ${currentPeriod + 1}`);
    }
  } catch (error) {
    console.error("❌ Error advancing period:", error);
  }
}

/**
 * Go to previous period (for corrections)
 */
export async function previousPeriod() {
  try {
    const snapshot = await get(scoreboardRef);
    const data = snapshot.val();
    const currentPeriod = data.period || 1;

    if (currentPeriod <= 1) {
      console.log("⚠️ Already at first period");
      return;
    }

    await update(scoreboardRef, {
      period: currentPeriod - 1,
      status: "idle",
    });

    console.log(`✅ Period → ${currentPeriod - 1}`);
  } catch (error) {
    console.error("❌ Error going to previous period:", error);
  }
}

// ========================================
// EXAMPLE USAGE
// ========================================

/**
 * Example: Create button handlers
 */
export function setupControlPanel() {
  // Clock controls
  document.getElementById("btnStart")?.addEventListener("click", startClock);
  document.getElementById("btnPause")?.addEventListener("click", pauseClock);
  document.getElementById("btnReset")?.addEventListener("click", resetGame);

  // Shot clock
  document
    .getElementById("btnShotReset24")
    ?.addEventListener("click", resetShotClockFull);
  document
    .getElementById("btnShotReset14")
    ?.addEventListener("click", resetShotClockPartial);

  // Home team scoring
  document
    .getElementById("btnHome1")
    ?.addEventListener("click", () => addHomePoints(1));
  document
    .getElementById("btnHome2")
    ?.addEventListener("click", () => addHomePoints(2));
  document
    .getElementById("btnHome3")
    ?.addEventListener("click", () => addHomePoints(3));
  document
    .getElementById("btnHomeMinus")
    ?.addEventListener("click", () => subtractHomePoints(1));

  // Away team scoring
  document
    .getElementById("btnAway1")
    ?.addEventListener("click", () => addAwayPoints(1));
  document
    .getElementById("btnAway2")
    ?.addEventListener("click", () => addAwayPoints(2));
  document
    .getElementById("btnAway3")
    ?.addEventListener("click", () => addAwayPoints(3));
  document
    .getElementById("btnAwayMinus")
    ?.addEventListener("click", () => subtractAwayPoints(1));

  // Fouls
  document
    .getElementById("btnHomeFoul")
    ?.addEventListener("click", addHomeFoul);
  document
    .getElementById("btnHomeUnfoul")
    ?.addEventListener("click", removeHomeFoul);
  document
    .getElementById("btnAwayFoul")
    ?.addEventListener("click", addAwayFoul);
  document
    .getElementById("btnAwayUnfoul")
    ?.addEventListener("click", removeAwayFoul);

  // Possession
  document
    .getElementById("btnPossHome")
    ?.addEventListener("click", setPossessionHome);
  document
    .getElementById("btnPossAway")
    ?.addEventListener("click", setPossessionAway);
  document
    .getElementById("btnPossClear")
    ?.addEventListener("click", clearPossession);

  // Period
  document
    .getElementById("btnNextPeriod")
    ?.addEventListener("click", nextPeriod);
  document
    .getElementById("btnPrevPeriod")
    ?.addEventListener("click", previousPeriod);

  console.log("🎮 Control panel ready");
}

// ========================================
// KEYBOARD SHORTCUTS (Optional)
// ========================================

/**
 * Setup keyboard shortcuts for control
 */
export function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    // Ignore if typing in input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
      return;
    }

    switch (e.key.toLowerCase()) {
      // Clock
      case " ": // Spacebar - start/pause
        e.preventDefault();
        pauseClock(); // Toggle implementation needed
        break;
      case "r":
        resetGame();
        break;

      // Shot clock
      case "s":
        resetShotClockFull();
        break;
      case "d":
        resetShotClockPartial();
        break;

      // Home team
      case "1":
        addHomePoints(1);
        break;
      case "2":
        addHomePoints(2);
        break;
      case "3":
        addHomePoints(3);
        break;
      case "f":
        addHomeFoul();
        break;

      // Away team
      case "7":
        addAwayPoints(1);
        break;
      case "8":
        addAwayPoints(2);
        break;
      case "9":
        addAwayPoints(3);
        break;
      case "j":
        addAwayFoul();
        break;

      // Period
      case "n":
        nextPeriod();
        break;
      case "p":
        previousPeriod();
        break;
    }
  });

  console.log("⌨️ Keyboard shortcuts enabled");
}
