/** Firebase Realtime Database listener */

import { db } from "../firebase.js";
import {
  ref,
  onValue,
  off,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import CONFIG from "./config.js";

class FirebaseService {
  constructor() {
    this.dbRef = null;
    this.unsubscribe = null;
  }

  /** Start listening for scoreboard changes. */
  listen(callback) {
    this.dbRef = ref(db, CONFIG.firebase.databasePath);

    onValue(this.dbRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        console.warn("No scoreboard data available");
        return;
      }
      if (callback) callback(data);
    });

    this.unsubscribe = () => {
      if (this.dbRef) off(this.dbRef);
    };
  }

  /** Stop listening for updates. */
  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /** @returns {Object} Current database reference */
  getRef() {
    return this.dbRef;
  }
}

export const firebaseService = new FirebaseService();
