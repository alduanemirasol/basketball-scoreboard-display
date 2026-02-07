/**
 * Firebase Service Module
 * Handles all Firebase database operations
 */

import { db } from "./firebase.js";
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

  /**
   * Initialize Firebase listener
   * @param {Function} callback - Called when data changes
   */
  listen(callback) {
    this.dbRef = ref(db, CONFIG.firebase.databasePath);

    const handleSnapshot = (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        console.warn("No scoreboard data available");
        return;
      }

      // Pass data to callback
      if (callback) {
        callback(data);
      }
    };

    // Start listening
    onValue(this.dbRef, handleSnapshot);

    // Store unsubscribe function
    this.unsubscribe = () => {
      if (this.dbRef) {
        off(this.dbRef);
      }
    };
  }

  /**
   * Stop listening to Firebase updates
   */
  stopListening() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Get database reference
   * @returns {Object} Firebase database reference
   */
  getRef() {
    return this.dbRef;
  }
}

// Create and export singleton instance
export const firebaseService = new FirebaseService();
