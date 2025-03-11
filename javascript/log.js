import { gameState } from './settings.js';
import { t } from './translations/index.js';

/**
 * Log Module
 * Handles game log functionality including adding entries, updating UI, and initialization.
 */

const MAX_LOG_ENTRIES = 100;

/**
 * Initializes the log module.
 */
export function initializeLog() {
  // Initialize logEntries if it doesn't exist
  gameState.logEntries = gameState.logEntries || [];
  
  // Listen for language change events
  document.addEventListener('languageChanged', () => {
    updateLogUI();
  });
}

/**
 * Adds a new log entry to the game state and updates the UI.
 * @param {string} message - The message to be logged or translation key.
 * @param {string|object} typeOrParams - The type of log entry or parameters for translation.
 * @param {string} [optionalType] - The type of log entry if second param is translation params.
 */
export function addLogEntry(message, typeOrParams = 'info', optionalType) {
  let finalMessage = message;
  let finalType = typeOrParams;

  // Check if the second parameter is an object (translation parameters)
  if (typeof typeOrParams === 'object') {
    // If typeOrParams is an object, it contains translation parameters
    finalType = optionalType || 'info';
  }

  const entryData = {
    message: finalMessage,
    type: finalType,
    day: gameState.day,
    hour: gameState.hour
  };

  // Initialize logEntries if it doesn't exist
  gameState.logEntries = gameState.logEntries || [];

  // Add new entry to the beginning of the array
  gameState.logEntries.unshift(entryData);

  // Limit the number of log entries
  if (gameState.logEntries.length > MAX_LOG_ENTRIES) {
    gameState.logEntries.pop();
  }

  updateLogUI();
}

/**
 * Updates the log UI with the current log entries.
 */
export function updateLogUI() {
  const logContent = document.getElementById('log-content');
  if (!logContent) return;

  logContent.innerHTML = gameState.logEntries.map(entry =>
    `<div class="log-entry ${entry.type}">
      <b>${entry.day}.${entry.hour}</b>
      <span>${entry.message}</span>
    </div>`
  ).join('');
}

/**
 * Clears all log entries and updates the UI.
 */
export function clearLog() {
  gameState.logEntries = [];
  updateLogUI();
}