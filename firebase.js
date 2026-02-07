/** Firebase initialization */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBZHKp7Ru4hJZrjX6XlkDLjX_Gfd6xkn6A",
  authDomain: "basketball-scoreboard-9907f.firebaseapp.com",
  databaseURL:
    "https://basketball-scoreboard-9907f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "basketball-scoreboard-9907f",
  storageBucket: "basketball-scoreboard-9907f.firebasestorage.app",
  messagingSenderId: "1078760039484",
  appId: "1:1078760039484:web:0cf5f9e2c2817956078f39",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
