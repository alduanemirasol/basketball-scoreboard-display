/** CSS animation definitions injected at runtime */

import { injectStyles } from "./dom-utils.js";

/** Inject all animation keyframes into the document. */
export function initAnimations() {
  injectStyles(`
    .theme-toggle.theme-change {
      animation: themeChangeAnim 0.3s ease;
    }
    @keyframes themeChangeAnim {
      0%, 100% { transform: rotate(0deg) scale(1); }
      50% { transform: rotate(180deg) scale(0.9); }
    }

    .team-section.possession-change {
      animation: possessionChange 0.4s ease-out;
    }
    @keyframes possessionChange {
      0% { transform: scale(1); }
      50% { transform: scale(1.03); }
      100% { transform: scale(1.02); }
    }

    .score-display.score-changed {
      animation: scoreChange 0.6s ease-out;
    }
    @keyframes scoreChange {
      0% { transform: scale(1); }
      50% { transform: scale(1.15); }
      100% { transform: scale(1); }
    }
  `);
}
