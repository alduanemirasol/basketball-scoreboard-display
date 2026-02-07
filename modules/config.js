/** Application configuration constants */

export const CONFIG = {
  firebase: {
    databasePath: "scoreboard",
  },

  game: {
    defaultPeriod: 1,
    maxPeriods: 4,
    defaultGameDuration: 720,
    defaultShotDuration: 24,
    defaultShotPartialReset: 14,
    clockUpdateInterval: 100,
  },

  theme: {
    storageKey: "scoreboard-theme",
    defaultTheme: "dark",
    toggleKey: "t",
  },

  animations: {
    scoreChange: 600,
    possessionChange: 400,
    themeChange: 300,
  },

  fouls: {
    warningThreshold: 4,
    dangerThreshold: 6,
  },

  shotClock: {
    warningThreshold: 10,
    dangerThreshold: 5,
  },

  status: {
    idle: "idle",
    running: "running",
    paused: "paused",
    finished: "finished",
  },

  possession: {
    home: "home",
    away: "away",
    none: null,
  },
};

export default CONFIG;
