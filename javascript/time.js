/**
 * Time Module
 * Handles game time progression and display updates.
 */

import { gameState, TICK_INTERVAL } from './settings.js';
import { updateGameState } from './game.js';
import { t } from './translations/index.js';

let isPaused = false;
let tickInterval = null;
// Add a separate flag for UI interactions
export let isUIInteractionPaused = false;

/**
 * Starts the game time and initializes the tick interval.
 */
export function startTime() {
  updateTimeDisplay();
  tickInterval = setInterval(tick, TICK_INTERVAL);
  // Store the interval in window for global access
  window.gameTickInterval = tickInterval;
}

/**
 * Explicitly pause the game for UI interactions
 * @param {boolean} pause - Whether to pause or resume
 */
export function pauseForUIInteraction(pause) {
  isUIInteractionPaused = pause;
  console.log(`Game ${pause ? 'paused' : 'resumed'} for UI interaction`);
}

/**
 * Progresses game time by one hour and updates the game state.
 */
function tick() {
  if (isPaused || isUIInteractionPaused) return;

  gameState.hour = (gameState.hour % 24) + 1;
  if (gameState.hour === 1) {
    gameState.day++;
  }

  gameState.totalPlayTime += TICK_INTERVAL / 1000; // Convert milliseconds to seconds

  updateTimeDisplay();
  updateGameState();
}

/**
 * Updates the time display in the DOM.
 */
export function updateTimeDisplay() {
  const timeElement = document.getElementById('time');
  if (timeElement) {
    timeElement.textContent = `${t('day')} ${gameState.day}, ${t('hour')} ${gameState.hour}`;
  }
}

/**
 * Toggles the paused state of the game time.
 */
export function togglePause() {
  isPaused = !isPaused;
}

/**
 * Resets the game time to the initial state and stops the timer.
 */
export function resetTime() {
  stopTime();
  gameState.day = 1;
  gameState.hour = 1;
  updateTimeDisplay();
}

/**
 * Stops the game time and clears the tick interval.
 */
export function stopTime() {
  clearInterval(tickInterval);
  tickInterval = null;
  isPaused = false;
}