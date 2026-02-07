/**
 * Animations Module
 * Defines and injects CSS animations
 */

import { injectStyles } from "./dom-utils.js";

/**
 * Initialize all CSS animations
 */
export function initAnimations() {
  const animationStyles = `
    /* Theme Toggle Animation */
    .theme-toggle.theme-change {
      animation: themeChangeAnim 0.3s ease;
    }
    
    @keyframes themeChangeAnim {
      0%, 100% { 
        transform: rotate(0deg) scale(1); 
      }
      50% { 
        transform: rotate(180deg) scale(0.9); 
      }
    }

    /* Possession Change Animation */
    .team-section.possession-change {
      animation: possessionChange 0.4s ease-out;
    }

    @keyframes possessionChange {
      0% { 
        transform: scale(1); 
      }
      50% { 
        transform: scale(1.03); 
      }
      100% { 
        transform: scale(1.02); 
      }
    }

    /* Score Change Animation */
    .score-display.score-changed {
      animation: scoreChange 0.6s ease-out;
    }

    @keyframes scoreChange {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.15);
      }
      100% {
        transform: scale(1);
      }
    }
  `;

  injectStyles(animationStyles);
}
