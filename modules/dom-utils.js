/** DOM helper functions */

/** Get element by ID. */
export const $ = (id) => document.getElementById(id);

/** Return all scoreboard DOM element references. */
export function getElements() {
  return {
    homeScore: $("homeScore"),
    awayScore: $("awayScore"),
    homeFouls: $("homeFouls"),
    awayFouls: $("awayFouls"),
    period: $("period"),
    maxPeriod: $("maxPeriod"),
    gameClock: $("gameClock"),
    shotClock: $("shotClock"),
    status: $("status"),
    homeTeam: $("homeTeam"),
    awayTeam: $("awayTeam"),
    themeToggle: $("themeToggle"),
    liveIndicator: $("liveIndicator"),
  };
}

/** Temporarily apply a CSS class for the given duration (ms). */
export function triggerAnimation(element, animationClass, duration = 600) {
  if (!element) return;
  element.classList.add(animationClass);
  setTimeout(() => element.classList.remove(animationClass), duration);
}

/** Toggle a CSS class based on a boolean condition. */
export function toggleClass(element, className, condition) {
  if (!element) return;
  element.classList.toggle(className, condition);
}

/** Safely set an element's text content. */
export function setText(element, text) {
  if (!element) return;
  element.textContent = text;
}

/** Inject a <style> block into the document head. */
export function injectStyles(css) {
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}
