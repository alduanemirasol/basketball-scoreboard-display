import { db } from "./firebase.js";
import {
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ========================================
// DOM ELEMENTS
// ========================================

const el = (id) => document.getElementById(id);

const elements = {
  homeScore: el("homeScore"),
  awayScore: el("awayScore"),
  homeFouls: el("homeFouls"),
  awayFouls: el("awayFouls"),
  period: el("period"),
  maxPeriod: el("maxPeriod"),
  gameClock: el("gameClock"),
  shotClock: el("shotClock"),
  status: el("status"),
  homeTeam: el("homeTeam"),
  awayTeam: el("awayTeam"),
  themeToggle: el("themeToggle"),
  liveIndicator: el("liveIndicator"),
};

// ========================================
// STATE MANAGEMENT
// ========================================

let previousData = {
  homeScore: 0,
  awayScore: 0,
  shotClock: 24,
  possession: null,
  status: "paused",
};

let gameClockInterval = null;
let currentGameClock = 720; // Store current game clock value in seconds

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format seconds to MM:SS display
 */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Add animation class and remove after animation completes
 */
function triggerAnimation(element, animationClass, duration = 600) {
  if (!element) return;
  element.classList.add(animationClass);
  setTimeout(() => {
    element.classList.remove(animationClass);
  }, duration);
}

/**
 * Update team leading status
 */
function updateLeadingTeam(homeScore, awayScore) {
  const isHomeLeading = homeScore > awayScore;
  const isAwayLeading = awayScore > homeScore;

  elements.homeTeam.classList.toggle("is-leading", isHomeLeading);
  elements.awayTeam.classList.toggle("is-leading", isAwayLeading);
}

/**
 * Update possession indicator
 */
function updatePossession(possession) {
  const hasHomePos = possession === "home";
  const hasAwayPos = possession === "away";

  elements.homeTeam.classList.toggle("has-possession", hasHomePos);
  elements.awayTeam.classList.toggle("has-possession", hasAwayPos);

  // Animate possession change
  if (possession !== previousData.possession && possession) {
    const activeTeam = hasHomePos ? elements.homeTeam : elements.awayTeam;
    triggerAnimation(activeTeam, "possession-change", 400);
  }
}

/**
 * Update fouls display with warning states
 */
function updateFouls(homeFouls, awayFouls) {
  const homeFoulsContainer = elements.homeFouls.closest(".stat-item");
  const awayFoulsContainer = elements.awayFouls.closest(".stat-item");

  // Home team fouls
  homeFoulsContainer.classList.toggle(
    "high-fouls",
    homeFouls >= 4 && homeFouls < 6,
  );
  homeFoulsContainer.classList.toggle("danger-fouls", homeFouls >= 6);

  // Away team fouls
  awayFoulsContainer.classList.toggle(
    "high-fouls",
    awayFouls >= 4 && awayFouls < 6,
  );
  awayFoulsContainer.classList.toggle("danger-fouls", awayFouls >= 6);
}

/**
 * Update shot clock with warning states
 */
function updateShotClock(shotClock) {
  const shotClockContainer = document.querySelector(".shot-clock-container");

  if (!shotClockContainer) return;

  // Remove all warning classes
  shotClockContainer.classList.remove("warning", "danger");

  // Add appropriate warning class
  if (shotClock <= 5 && shotClock > 0) {
    shotClockContainer.classList.add("danger");
  } else if (shotClock <= 10 && shotClock > 5) {
    shotClockContainer.classList.add("warning");
  }
}

/**
 * Update game status and body classes
 */
function updateGameStatus(status) {
  const statusText = status.toUpperCase();
  elements.status.textContent = statusText;

  // Update body classes for global styling
  document.body.classList.toggle("running", status === "running");
  document.body.classList.toggle("paused", status === "paused");

  // Start or stop the game clock based on status
  if (status === "running") {
    startGameClock();
  } else {
    stopGameClock();
  }
}

/**
 * Start the game clock countdown
 */
function startGameClock() {
  // Clear any existing interval
  stopGameClock();

  // Start new interval that updates every second
  gameClockInterval = setInterval(() => {
    if (currentGameClock > 0) {
      currentGameClock--;
      elements.gameClock.textContent = formatTime(currentGameClock);
    } else {
      // Clock reached 0, stop the interval
      stopGameClock();
    }
  }, 1000);
}

/**
 * Stop the game clock countdown
 */
function stopGameClock() {
  if (gameClockInterval) {
    clearInterval(gameClockInterval);
    gameClockInterval = null;
  }
}

/**
 * Detect and animate score changes
 */
function handleScoreChange(newHomeScore, newAwayScore) {
  if (newHomeScore !== previousData.homeScore) {
    triggerAnimation(elements.homeScore, "score-changed");
  }
  if (newAwayScore !== previousData.awayScore) {
    triggerAnimation(elements.awayScore, "score-changed");
  }
}

// ========================================
// FIREBASE LISTENER
// ========================================

const scoreboardRef = ref(db, "scoreboard");

onValue(scoreboardRef, (snapshot) => {
  const data = snapshot.val();

  if (!data) {
    console.warn("No scoreboard data available");
    return;
  }

  // Detect score changes before updating
  handleScoreChange(data.homeScore, data.awayScore);

  // Update current game clock from Firebase (sync with database)
  currentGameClock = data.gameDuration ?? 720;

  // Update all display elements
  elements.homeScore.textContent = data.homeScore ?? 0;
  elements.awayScore.textContent = data.awayScore ?? 0;
  elements.homeFouls.textContent = data.homeFouls ?? 0;
  elements.awayFouls.textContent = data.awayFouls ?? 0;
  elements.period.textContent = data.period ?? 1;
  elements.maxPeriod.textContent = data.maxPeriod ?? 4;
  elements.gameClock.textContent = formatTime(currentGameClock);
  elements.shotClock.textContent = data.shotDuration ?? 24;

  // Update game states
  updateLeadingTeam(data.homeScore, data.awayScore);
  updatePossession(data.possession);
  updateFouls(data.homeFouls, data.awayFouls);
  updateShotClock(data.shotDuration);
  updateGameStatus(data.status || "paused");

  // Store current data for next comparison
  previousData = {
    homeScore: data.homeScore,
    awayScore: data.awayScore,
    shotClock: data.shotDuration,
    possession: data.possession,
    status: data.status,
  };
});

// ========================================
// THEME TOGGLE
// ========================================

function initTheme() {
  // Check for saved theme preference or default to dark
  const savedTheme = localStorage.getItem("scoreboard-theme") || "dark";
  // Remove any existing theme classes
  document.body.classList.remove("theme-dark", "theme-light");
  // Add the correct theme class
  document.body.classList.add(`theme-${savedTheme}`);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("theme-dark")
    ? "dark"
    : "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  // Remove old theme and add new theme
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(`theme-${newTheme}`);

  // Game state classes (running/paused) are already on body, no need to re-add

  localStorage.setItem("scoreboard-theme", newTheme);

  // Trigger animation on theme button
  triggerAnimation(elements.themeToggle, "theme-change", 300);
}

// ========================================
// EVENT LISTENERS
// ========================================

elements.themeToggle?.addEventListener("click", toggleTheme);

// Keyboard shortcut for theme toggle (T key)
document.addEventListener("keydown", (e) => {
  if (e.key === "t" || e.key === "T") {
    toggleTheme();
  }
});

// ========================================
// INITIALIZATION
// ========================================

initTheme();

// Add CSS for theme change animation
const style = document.createElement("style");
style.textContent = `
  .theme-toggle.theme-change {
    animation: themeChangeAnim 0.3s ease;
  }
  
  @keyframes themeChangeAnim {
    0%, 100% { transform: rotate(0deg) scale(1); }
    50% { transform: rotate(180deg) scale(0.9); }
  }

  .team-section.possession-change {
    animation: possessionChange 0.4s ease-out;
  }

  @keyframes possessionChange {
    0% { transform: scale(1); }
    50% { transform: scale(1.03); }
    100% { transform: scale(1.02); }
  }
`;
document.head.appendChild(style);
