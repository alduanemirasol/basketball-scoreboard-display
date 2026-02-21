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
  homeTimeouts: el("homeTimeouts"),
  awayTimeouts: el("awayTimeouts"),
  homeTeamLabel: el("homeTeamLabel"),
  awayTeamLabel: el("awayTeamLabel"),
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
  clockRunning: false,
};

let gameClockInterval = null;
let shotClockInterval = null;

// Latest data snapshot for live clock ticking
let latestData = null;

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Format seconds to MM:SS display
 */
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/**
 * Compute the current game clock value in seconds from server data
 */
function computeGameClock(data) {
  const totalDuration = data.gameDuration ?? 720;
  const elapsed = data.elapsedBeforePause ?? 0;

  if (data.clockRunning && data.clockStartedAt) {
    const now = Date.now();
    const additionalElapsed = (now - data.clockStartedAt) / 1000;
    return Math.max(0, totalDuration - elapsed - additionalElapsed);
  } else {
    return Math.max(0, totalDuration - elapsed);
  }
}

/**
 * Compute the current shot clock value in seconds from server data
 */
function computeShotClock(data) {
  const shotDuration = data.shotPartialReset ?? data.shotDuration ?? 14;
  const elapsed = data.shotElapsedBeforePause ?? 0;

  if (data.shotClockRunning && data.shotStartedAt) {
    const now = Date.now();
    const additionalElapsed = (now - data.shotStartedAt) / 1000;
    return Math.max(0, shotDuration - elapsed - additionalElapsed);
  } else {
    return Math.max(0, shotDuration - elapsed);
  }
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

  homeFoulsContainer.classList.toggle("high-fouls", homeFouls >= 4 && homeFouls < 6);
  homeFoulsContainer.classList.toggle("danger-fouls", homeFouls >= 6);

  awayFoulsContainer.classList.toggle("high-fouls", awayFouls >= 4 && awayFouls < 6);
  awayFoulsContainer.classList.toggle("danger-fouls", awayFouls >= 6);
}

/**
 * Update shot clock display value and warning states
 */
function updateShotClockDisplay(shotSeconds) {
  const shotClockContainer = document.querySelector(".shot-clock-container");
  if (!shotClockContainer) return;

  // Show integer value
  elements.shotClock.textContent = Math.ceil(shotSeconds);

  shotClockContainer.classList.remove("warning", "danger");
  if (shotSeconds <= 5 && shotSeconds > 0) {
    shotClockContainer.classList.add("danger");
  } else if (shotSeconds <= 10 && shotSeconds > 5) {
    shotClockContainer.classList.add("warning");
  }
}

/**
 * Update game status and body classes
 */
function updateGameStatus(data) {
  const isRunning = data.clockRunning === true;
  const statusText = (data.status ?? "paused").toUpperCase();
  elements.status.textContent = statusText;

  document.body.classList.toggle("running", isRunning);
  document.body.classList.toggle("paused", !isRunning);
}

/**
 * Start live clock ticking intervals
 */
function startLiveClocks() {
  stopLiveClocks();

  gameClockInterval = setInterval(() => {
    if (!latestData) return;
    const seconds = computeGameClock(latestData);
    elements.gameClock.textContent = formatTime(seconds);
    if (seconds <= 0) stopLiveClocks();
  }, 100);

  shotClockInterval = setInterval(() => {
    if (!latestData) return;
    const seconds = computeShotClock(latestData);
    updateShotClockDisplay(seconds);
  }, 100);
}

/**
 * Stop live clock intervals
 */
function stopLiveClocks() {
  if (gameClockInterval) { clearInterval(gameClockInterval); gameClockInterval = null; }
  if (shotClockInterval) { clearInterval(shotClockInterval); shotClockInterval = null; }
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

  latestData = data;

  // Detect score changes before updating
  handleScoreChange(data.homeScore, data.awayScore);

  // Update static display elements
  elements.homeScore.textContent = data.homeScore ?? 0;
  elements.awayScore.textContent = data.awayScore ?? 0;
  elements.homeFouls.textContent = data.homeFouls ?? 0;
  elements.awayFouls.textContent = data.awayFouls ?? 0;
  elements.period.textContent = data.period ?? 1;
  elements.maxPeriod.textContent = data.maxPeriod ?? 4;

  // Team names
  if (elements.homeTeamLabel) elements.homeTeamLabel.textContent = data.homeName ?? "HOME";
  if (elements.awayTeamLabel) elements.awayTeamLabel.textContent = data.awayName ?? "AWAY";

  // Timeouts
  if (elements.homeTimeouts) elements.homeTimeouts.textContent = data.homeTimeouts ?? 0;
  if (elements.awayTimeouts) elements.awayTimeouts.textContent = data.awayTimeouts ?? 0;

  // Compute and display clocks from server timestamps
  const gameSeconds = computeGameClock(data);
  const shotSeconds = computeShotClock(data);
  elements.gameClock.textContent = formatTime(gameSeconds);
  updateShotClockDisplay(shotSeconds);

  // Update game states
  updateLeadingTeam(data.homeScore, data.awayScore);
  updatePossession(data.possession);
  updateFouls(data.homeFouls ?? 0, data.awayFouls ?? 0);
  updateGameStatus(data);

  // Start or stop live ticking
  if (data.clockRunning || data.shotClockRunning) {
    startLiveClocks();
  } else {
    stopLiveClocks();
  }

  // Store current data for next comparison
  previousData = {
    homeScore: data.homeScore,
    awayScore: data.awayScore,
    shotClock: shotSeconds,
    possession: data.possession,
    clockRunning: data.clockRunning,
  };
});

// ========================================
// THEME TOGGLE
// ========================================

function initTheme() {
  const savedTheme = localStorage.getItem("scoreboard-theme") || "dark";
  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(`theme-${savedTheme}`);
}

function toggleTheme() {
  const currentTheme = document.body.classList.contains("theme-dark") ? "dark" : "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  document.body.classList.remove("theme-dark", "theme-light");
  document.body.classList.add(`theme-${newTheme}`);

  localStorage.setItem("scoreboard-theme", newTheme);
  triggerAnimation(elements.themeToggle, "theme-change", 300);
}

// ========================================
// EVENT LISTENERS
// ========================================

elements.themeToggle?.addEventListener("click", toggleTheme);

document.addEventListener("keydown", (e) => {
  if (e.key === "t" || e.key === "T") {
    toggleTheme();
  }
});

// ========================================
// INITIALIZATION
// ========================================

initTheme();

// Add CSS for animations
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
