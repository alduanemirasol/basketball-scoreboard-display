/** Scoreboard controller */

import { db } from "./firebase.js";
import {
  ref,
  update,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const SCOREBARD_REF = ref(db, "scoreboard");

const $ = (id) => document.getElementById(id);

// DOM references
const els = {
  homeScore: $("homeScoreVal"),
  awayScore: $("awayScoreVal"),
  homeFouls: $("homeFoulsVal"),
  awayFouls: $("awayFoulsVal"),
  period: $("periodVal"),
  maxPeriod: $("maxPeriodVal"),
  gameClockDisplay: $("gameClockDisplay"),
  shotClockDisplay: $("shotClockDisplay"),
  status: $("statusVal"),
  possession: $("possessionVal"),
};

// Local state mirror
let state = {
  homeScore: 0,
  awayScore: 0,
  homeFouls: 0,
  awayFouls: 0,
  period: 1,
  maxPeriod: 4,
  gameDuration: 720,
  shotDuration: 24,
  shotPartialReset: 14,
  status: "idle",
  clockStartedAt: null,
  elapsedBeforePause: 0,
  shotStartedAt: null,
  shotElapsedBeforePause: 0,
  possession: null,
};

// Firebase write helper
function push(data) {
  const payload = {};
  for (const [k, v] of Object.entries(data)) {
    payload[k] = v === null ? "null" : v;
  }
  update(SCOREBARD_REF, payload);
}

// Listen for remote changes
onValue(SCOREBARD_REF, (snap) => {
  const data = snap.val();
  if (!data) return;

  state = {
    homeScore: data.homeScore ?? 0,
    awayScore: data.awayScore ?? 0,
    homeFouls: data.homeFouls ?? 0,
    awayFouls: data.awayFouls ?? 0,
    period: data.period ?? 1,
    maxPeriod: data.maxPeriod ?? 4,
    gameDuration: data.gameDuration ?? 720,
    shotDuration: data.shotDuration ?? 24,
    shotPartialReset: data.shotPartialReset ?? 14,
    status: data.status ?? "idle",
    clockStartedAt: data.clockStartedAt === "null" ? null : data.clockStartedAt,
    elapsedBeforePause: data.elapsedBeforePause ?? 0,
    shotStartedAt: data.shotStartedAt === "null" ? null : data.shotStartedAt,
    shotElapsedBeforePause: data.shotElapsedBeforePause ?? 0,
    possession: data.possession ?? null,
  };

  refreshUI();
});

// Clock helpers
function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getGameRemaining() {
  if (state.status === "running" && state.clockStartedAt) {
    const elapsed =
      state.elapsedBeforePause +
      Math.floor((Date.now() - state.clockStartedAt) / 1000);
    return Math.max(0, state.gameDuration - elapsed);
  }
  return Math.max(0, state.gameDuration - state.elapsedBeforePause);
}

function getShotRemaining() {
  if (state.status === "running" && state.shotStartedAt) {
    const elapsed =
      state.shotElapsedBeforePause +
      Math.floor((Date.now() - state.shotStartedAt) / 1000);
    return Math.max(0, state.shotDuration - elapsed);
  }
  return Math.max(0, state.shotDuration - state.shotElapsedBeforePause);
}

// UI refresh
function refreshUI() {
  els.homeScore.textContent = state.homeScore;
  els.awayScore.textContent = state.awayScore;
  els.homeFouls.textContent = state.homeFouls;
  els.awayFouls.textContent = state.awayFouls;
  els.period.textContent = state.period;
  els.maxPeriod.textContent = state.maxPeriod;
  els.status.textContent = state.status.toUpperCase();
  els.possession.textContent = state.possession
    ? state.possession.toUpperCase()
    : "NONE";
  els.gameClockDisplay.textContent = formatTime(getGameRemaining());
  els.shotClockDisplay.textContent = getShotRemaining();

  // Highlight active buttons
  document.querySelectorAll("[data-possession]").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.possession === (state.possession || "none"),
    );
  });

  document.querySelectorAll("[data-status-action]").forEach((btn) => {
    const action = btn.dataset.statusAction;
    const isActive =
      (action === "start" && state.status === "running") ||
      (action === "pause" && state.status === "paused") ||
      (action === "reset" && state.status === "idle");
    btn.classList.toggle("active", isActive);
  });
}

// Live clock update
setInterval(() => {
  if (state.status === "running") {
    els.gameClockDisplay.textContent = formatTime(getGameRemaining());
    els.shotClockDisplay.textContent = getShotRemaining();
  }
}, 200);

// Score controls
function changeScore(team, delta) {
  const key = team === "home" ? "homeScore" : "awayScore";
  push({ [key]: Math.max(0, state[key] + delta) });
}

// Foul controls
function changeFouls(team, delta) {
  const key = team === "home" ? "homeFouls" : "awayFouls";
  push({ [key]: Math.max(0, state[key] + delta) });
}

// Period
function changePeriod(delta) {
  push({ period: Math.max(1, state.period + delta) });
}

// Possession
function setPossession(value) {
  push({ possession: value === "none" ? null : value });
}

// Clock controls
function startClock() {
  if (state.status === "running") return;
  const now = Date.now();
  push({
    status: "running",
    clockStartedAt: now,
    shotStartedAt: now,
  });
}

function pauseClock() {
  if (state.status !== "running") return;
  const gameElapsed = state.clockStartedAt
    ? state.elapsedBeforePause +
      Math.floor((Date.now() - state.clockStartedAt) / 1000)
    : state.elapsedBeforePause;
  const shotElapsed = state.shotStartedAt
    ? state.shotElapsedBeforePause +
      Math.floor((Date.now() - state.shotStartedAt) / 1000)
    : state.shotElapsedBeforePause;
  push({
    status: "paused",
    clockStartedAt: null,
    elapsedBeforePause: gameElapsed,
    shotStartedAt: null,
    shotElapsedBeforePause: shotElapsed,
  });
}

function resetClock() {
  push({
    status: "idle",
    clockStartedAt: null,
    elapsedBeforePause: 0,
    shotStartedAt: null,
    shotElapsedBeforePause: 0,
  });
}

// Shot clock
function resetShotClock(duration) {
  if (state.status === "running") {
    push({
      shotDuration: duration,
      shotStartedAt: Date.now(),
      shotElapsedBeforePause: 0,
    });
  } else {
    push({
      shotDuration: duration,
      shotStartedAt: null,
      shotElapsedBeforePause: 0,
    });
  }
}

// Full reset
function resetGame() {
  if (!confirm("Reset entire game?")) return;
  push({
    homeScore: 0,
    awayScore: 0,
    homeFouls: 0,
    awayFouls: 0,
    period: 1,
    maxPeriod: 4,
    gameDuration: 720,
    shotDuration: 24,
    shotPartialReset: 14,
    status: "idle",
    clockStartedAt: null,
    elapsedBeforePause: 0,
    shotStartedAt: null,
    shotElapsedBeforePause: 0,
    possession: null,
  });
}

// Click handler
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;

  switch (action) {
    case "home-score-up":
      changeScore("home", Number(btn.dataset.points || 1));
      break;
    case "home-score-down":
      changeScore("home", -1);
      break;
    case "away-score-up":
      changeScore("away", Number(btn.dataset.points || 1));
      break;
    case "away-score-down":
      changeScore("away", -1);
      break;
    case "home-foul-up":
      changeFouls("home", 1);
      break;
    case "home-foul-down":
      changeFouls("home", -1);
      break;
    case "away-foul-up":
      changeFouls("away", 1);
      break;
    case "away-foul-down":
      changeFouls("away", -1);
      break;
    case "period-up":
      changePeriod(1);
      break;
    case "period-down":
      changePeriod(-1);
      break;
    case "clock-start":
      startClock();
      break;
    case "clock-pause":
      pauseClock();
      break;
    case "clock-reset":
      resetClock();
      break;
    case "shot-reset-full":
      resetShotClock(state.shotDuration);
      break;
    case "shot-reset-partial":
      resetShotClock(state.shotPartialReset);
      break;
    case "game-reset":
      resetGame();
      break;
  }
});

// Possession buttons
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-possession]");
  if (!btn) return;
  setPossession(btn.dataset.possession);
});
