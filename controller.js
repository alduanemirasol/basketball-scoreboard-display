/** Scoreboard controller */
import { db, auth } from "./firebase.js";
import {
  ref,
  update,
  onValue,
  set,
  remove,
  get,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
  const newPeriod = state.period + delta;
  if (newPeriod < 1 || newPeriod > state.maxPeriod) return;
  push({ period: newPeriod });
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

// Reset clock
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

// ============================================
// Admin Management
// ============================================

const ADMINS_REF = ref(db, "admins");
const $authSection = document.getElementById("authSection");
const $loginForm = document.getElementById("loginForm");
const $userInfo = document.getElementById("userInfo");
const $userEmail = document.getElementById("userEmail");
const $adminSection = document.getElementById("adminSection");
const $adminList = document.getElementById("adminList");

// Check if current user is an admin
async function checkAdminStatus(user) {
  if (!user) return false;
  const adminRef = ref(db, `admins/${user.uid}`);
  const snapshot = await get(adminRef);
  return snapshot.exists();
}

// Update UI based on auth state
async function updateAuthUI(user) {
  const isAdmin = await checkAdminStatus(user);

  if (user && isAdmin) {
    $loginForm.style.display = "none";
    $userInfo.style.display = "none";
    $adminSection.style.display = "block";
    loadAdminList();
  } else if (user) {
    $loginForm.style.display = "none";
    $userInfo.style.display = "block";
    $userEmail.textContent = user.email;
    $adminSection.style.display = "none";
  } else {
    $loginForm.style.display = "block";
    $userInfo.style.display = "none";
    $adminSection.style.display = "none";
  }
}

// Load and display admin list
async function loadAdminList() {
  const snapshot = await get(ADMINS_REF);
  $adminList.innerHTML = "";

  if (snapshot.exists()) {
    const admins = snapshot.val();
    Object.keys(admins).forEach((uid) => {
      const li = document.createElement("li");
      li.textContent = uid;
      $adminList.appendChild(li);
    });
  } else {
    $adminList.innerHTML = "<li>No admins configured</li>";
  }
}

// Add admin
async function addAdmin(uid) {
  if (!uid || uid.trim() === "") {
    alert("Please enter a valid UID");
    return;
  }
  try {
    await set(ref(db, `admins/${uid}`), true);
    alert(`Admin ${uid} added successfully`);
    document.getElementById("newAdminUid").value = "";
    loadAdminList();
  } catch (error) {
    console.error("Error adding admin:", error);
    alert("Error adding admin: " + error.message);
  }
}

// Remove admin
async function removeAdmin(uid) {
  if (!uid || uid.trim() === "") {
    alert("Please enter a valid UID");
    return;
  }
  if (!confirm(`Are you sure you want to remove admin ${uid}?`)) return;

  try {
    await remove(ref(db, `admins/${uid}`));
    alert(`Admin ${uid} removed successfully`);
    document.getElementById("removeAdminUid").value = "";
    loadAdminList();
  } catch (error) {
    console.error("Error removing admin:", error);
    alert("Error removing admin: " + error.message);
  }
}

// Auth event listeners
onAuthStateChanged(auth, updateAuthUI);

// Login
document.getElementById("loginBtn").addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
  }
});

// Sign up
document.getElementById("signupBtn").addEventListener("click", async () => {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error("Signup error:", error);
    alert("Signup failed: " + error.message);
  }
});

// Logout
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout error:", error);
  }
});

// Add admin button
document.getElementById("addAdminBtn").addEventListener("click", () => {
  const uid = document.getElementById("newAdminUid").value;
  addAdmin(uid);
});

// Remove admin button
document.getElementById("removeAdminBtn").addEventListener("click", () => {
  const uid = document.getElementById("removeAdminUid").value;
  removeAdmin(uid);
});

// Initial auth state check
updateAuthUI(null);
