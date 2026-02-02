import { db } from "./firebase.js"; // Import the Firebase database instance
import {
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"; // Import functions to read database

const scoreboardRef = ref(db, "scoreboard"); // Reference to "scoreboard" node in database

const el = (id) => document.getElementById(id); // Shortcut to get element by ID

// Convert seconds to "minutes:seconds" format
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Listen for changes in the scoreboard data
onValue(scoreboardRef, (snapshot) => {
  const data = snapshot.val(); // Get the latest scoreboard data
  if (!data) return; // Exit if no data

  // Update scoreboard UI
  el("homeScore").textContent = data.homeScore;
  el("awayScore").textContent = data.awayScore;
  el("homeFouls").textContent = data.homeFouls;
  el("awayFouls").textContent = data.awayFouls;
  el("period").textContent = data.period;
  el("maxPeriod").textContent = data.maxPeriod;
  el("gameClock").textContent = formatTime(data.gameClock);
  el("shotClock").textContent = data.shotClock;
  el("status").textContent = data.status.toUpperCase();

  // Update body classes based on game state
  document.body.classList.toggle("paused", data.status !== "running");
  document.body.classList.toggle("possession-home", data.possession === "home");
  document.body.classList.toggle("possession-away", data.possession === "away");
});
