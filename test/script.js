import { db } from "./firebaseConfig.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// ===================== DOM REFERENCES =====================
const el = (id) => document.getElementById(id);

const homePanel   = el("homePanel");
const awayPanel   = el("awayPanel");
const homeScoreEl = el("homeScore");
const awayScoreEl = el("awayScore");
const homeFoulsEl = el("homeFouls");
const awayFoulsEl = el("awayFouls");
const periodEl    = el("period");
const maxPeriodEl = el("maxPeriod");
const gameClockEl = el("gameClock");
const shotClockEl = el("shotClock");
const statusEl    = el("status");
const logList     = el("logList");
const logEmpty    = el("logEmpty");
const btnFullscreen = el("btnFullscreen");

// ===================== LOCAL STATE (previous snapshot values) =====================
// Used only to detect changes client-side for flash + score log
let prev = {
  homeScore: 0,
  awayScore: 0,
};

const scoreLog = []; // kept in memory for the session

// ===================== HELPERS =====================
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Trigger the CSS flash animation on a score element
function flashScore(scoreEl) {
  scoreEl.classList.remove("flash");
  void scoreEl.offsetWidth; // force reflow so the animation restarts
  scoreEl.classList.add("flash");
  setTimeout(() => scoreEl.classList.remove("flash"), 600);
}

// ===================== SCORE LOG =====================
function addLogEntry(team, pts, isHome) {
  scoreLog.unshift({
    team,
    pts,
    isHome,
    time: gameClockEl.textContent, // already formatted at this point
    period: periodEl.textContent,
  });
  if (scoreLog.length > 12) scoreLog.pop();
  renderLog();
}

function renderLog() {
  logEmpty.style.display = scoreLog.length === 0 ? "block" : "none";

  // Remove previous entries
  logList.querySelectorAll(".log-entry").forEach((node) => node.remove());

  scoreLog.forEach((entry, i) => {
    const div = document.createElement("div");
    div.className = `log-entry ${entry.isHome ? "home-score" : "away-score"}`;
    if (i > 0) div.style.animation = "none"; // only the newest entry animates in

    div.innerHTML = `
      <span class="log-team">${entry.team}</span>
      <span class="log-pts">+${entry.pts}</span>
      <span class="log-meta">Q${entry.period} ${entry.time}</span>
    `;
    logList.appendChild(div);
  });
}

// ===================== FIREBASE LISTENER =====================
const scoreboardRef = ref(db, "scoreboard");

onValue(scoreboardRef, (snapshot) => {
  const data = snapshot.val();
  if (!data) return; // no data yet

  // --- Update clocks & period FIRST (so the log can read the current time) ---
  periodEl.textContent    = data.period;
  maxPeriodEl.textContent = data.maxPeriod;
  gameClockEl.textContent = formatTime(data.gameClock);
  shotClockEl.textContent = `SHOT ${data.shotClock}`;

  // --- Detect score changes → flash + log entry ---
  if (data.homeScore !== prev.homeScore) {
    const pts = data.homeScore - prev.homeScore;
    if (pts > 0) {
      flashScore(homeScoreEl);
      addLogEntry("HOME", pts, true);
    }
  }
  if (data.awayScore !== prev.awayScore) {
    const pts = data.awayScore - prev.awayScore;
    if (pts > 0) {
      flashScore(awayScoreEl);
      addLogEntry("AWAY", pts, false);
    }
  }

  // --- Write scores & fouls ---
  homeScoreEl.textContent = data.homeScore;
  awayScoreEl.textContent = data.awayScore;
  homeFoulsEl.textContent = data.homeFouls;
  awayFoulsEl.textContent = data.awayFouls;

  // --- Clock state classes ---
  const isRunning  = data.status === "running";
  const isFinished = data.status === "finished";
  gameClockEl.classList.toggle("paused",  !isRunning);
  gameClockEl.classList.toggle("running",  isRunning);

  // --- Shot clock warning (≤ 5s while running) ---
  shotClockEl.classList.toggle("warning", data.shotClock <= 5 && data.shotClock > 0 && isRunning);

  // --- Status badge ---
  statusEl.classList.remove("paused", "running", "finished");
  if (isFinished) {
    statusEl.textContent = "● GAME OVER";
    statusEl.classList.add("finished");
  } else if (isRunning) {
    statusEl.textContent = "● LIVE";
    statusEl.classList.add("running");
  } else {
    statusEl.textContent = "● PAUSED";
    statusEl.classList.add("paused");
  }

  // --- Possession glow ---
  homePanel.classList.toggle("possession", data.possession === "home");
  awayPanel.classList.toggle("possession", data.possession === "away");

  // --- Save current values for next diff ---
  prev.homeScore = data.homeScore;
  prev.awayScore = data.awayScore;
});

// ===================== FULLSCREEN TOGGLE =====================
btnFullscreen.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

document.addEventListener("fullscreenchange", () => {
  btnFullscreen.textContent = document.fullscreenElement ? "⛶ EXIT FULL" : "⛶ FULLSCREEN";
});
