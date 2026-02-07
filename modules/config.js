/**
 * Configuration Module
 * Central place for all app configuration
 */

export const CONFIG = {
  // Firebase Configuration
  firebase: {
    databasePath: "scoreboard",
  },

  // Game Settings
  game: {
    defaultPeriod: 1,
    maxPeriods: 4,
    defaultGameDuration: 720, // 12 minutes in seconds
    defaultShotDuration: 24, // Full shot clock
    defaultShotPartialReset: 14, // Offensive rebound reset
    clockUpdateInterval: 100, // Update every 100ms for smooth display
  },

  // Theme Settings
  theme: {
    storageKey: "scoreboard-theme",
    defaultTheme: "dark",
    toggleKey: "t", // Keyboard shortcut
  },

  // Animation Durations
  animations: {
    scoreChange: 600,
    possessionChange: 400,
    themeChange: 300,
  },

  // Foul Warning Thresholds
  fouls: {
    warningThreshold: 4,
    dangerThreshold: 6,
  },

  // Shot Clock Warning Thresholds
  shotClock: {
    warningThreshold: 10,
    dangerThreshold: 5,
  },

  // Status States
  status: {
    idle: "idle",
    running: "running",
    paused: "paused",
    finished: "finished",
  },

  // Possession Values
  possession: {
    home: "home",
    away: "away",
    none: null,
  },
};

export default CONFIG;
