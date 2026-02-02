import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js"; // Import Firebase app
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"; // Import database

// Firebase database URL
const firebaseConfig = {
  databaseURL:
    "https://basketball-scoreboard-9907f-default-rtdb.asia-southeast1.firebasedatabase.app",
};

const app = initializeApp(firebaseConfig); // Initialize Firebase
export const db = getDatabase(app); // Export database instance
