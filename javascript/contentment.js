/**
 * Contentment System Module
 * This module handles the contentment system, which affects gameplay based on the overall
 * satisfaction of the party with their living conditions.
 */

import { gameState } from './settings.js';
import { addLogEntry } from './log.js';
import { t } from './translations/index.js';

// Contentment level thresholds and their descriptions
export const CONTENTMENT_LEVELS = {
  veryHigh: { min: 75, name: 'Very Happy', translationKey: 'veryHappy', icon: 'laugh', color: 'green' },
  high: { min: 50, name: 'Happy', translationKey: 'happy', icon: 'smile', color: 'light-green' },
  medium: { min: 25, name: 'Concerned', translationKey: 'concerned', icon: 'meh', color: 'yellow' },
  low: { min: 0, name: 'Unhappy', translationKey: 'unhappy', icon: 'frown', color: 'orange' },
  veryLow: { min: -Infinity, name: 'Miserable', translationKey: 'miserable', icon: 'angry', color: 'red' }
};

// Effects applied at different contentment levels
export const CONTENTMENT_EFFECTS = {
  resourceEfficiency: {
    veryHigh: 0.15, // +15% resource gathering
    high: 0,        // No modifier
    medium: -0.03,  // -3% resource gathering
    low: -0.06,     // -6% resource gathering
    veryLow: -0.09  // -9% resource gathering
  },
  energyConsumption: {
    veryHigh: -0.1, // -10% energy consumption
    high: 0,        // No modifier
    medium: 0.05,   // +5% energy consumption
    low: 0.1,       // +10% energy consumption
    veryLow: 0.15   // +15% energy consumption
  },
  corruptionResistance: {
    veryHigh: 0.1,  // +10% corruption resistance
    high: 0,        // No modifier
    medium: -0.05,  // -5% corruption resistance
    low: -0.1,      // -10% corruption resistance
    veryLow: -0.15  // -15% corruption resistance
  }
};

/**
 * Initializes the contentment system
 */
export function initializeContentment() {
  // Add contentment properties to gameState if they don't exist
  if (gameState.contentmentLevel === undefined) {
    gameState.contentmentLevel = 50; // Start at neutral contentment
  }

  if (gameState.maxContentment === undefined) {
    gameState.maxContentment = 100;
  }

  if (gameState.contentmentEffects === undefined) {
    gameState.contentmentEffects = {
      resourceEfficiency: 0,
      energyConsumption: 0,
      corruptionResistance: 0
    };
  }

  // Initialize the UI
  updateContentmentDisplay();
}

/**
 * Increases contentment by the specified amount
 * @param {number} amount - The amount to increase contentment by
 * @param {string} reason - The reason for the contentment change (for logging)
 */
export function increaseContentment(amount, reason) {
  const previousLevel = getCurrentContentmentLevel();

  gameState.contentmentLevel = Math.min(
    gameState.contentmentLevel + amount,
    gameState.maxContentment
  );

  const newLevel = getCurrentContentmentLevel();

  // Log the change if significant
  if (amount >= 5) {
    addLogEntry(`Contentment increased${reason ? ` (${reason})` : ''}.`, 'success');
  }

  // Log when crossing a threshold
  if (previousLevel !== newLevel && newLevel.min > previousLevel.min) {
    addLogEntry(`The party's mood has improved to "${newLevel.name}"!`, 'success');
  }

  updateContentmentDisplay();
  updateContentmentEffects();
}

/**
 * Decreases contentment by the specified amount
 * @param {number} amount - The amount to decrease contentment by
 * @param {string} reason - The reason for the contentment change (for logging)
 */
export function decreaseContentment(amount, reason) {
  const previousLevel = getCurrentContentmentLevel();

  gameState.contentmentLevel = Math.max(
    gameState.contentmentLevel - amount,
    0
  );

  const newLevel = getCurrentContentmentLevel();

  // Log the change if significant
  if (amount >= 5) {
    addLogEntry(`Contentment decreased${reason ? ` (${reason})` : ''}.`, 'warning');
  }

  // Log when crossing a threshold
  if (previousLevel !== newLevel && newLevel.min < previousLevel.min) {
    addLogEntry(`The party's mood has worsened to "${newLevel.name}"!`, 'danger');
  }

  updateContentmentDisplay();
  updateContentmentEffects();
}

/**
 * Gets the current contentment level object based on the contentment value
 * @returns {Object} The contentment level object
 */
export function getCurrentContentmentLevel() {
  const contentment = gameState.contentmentLevel;

  if (contentment >= CONTENTMENT_LEVELS.veryHigh.min) return CONTENTMENT_LEVELS.veryHigh;
  if (contentment >= CONTENTMENT_LEVELS.high.min) return CONTENTMENT_LEVELS.high;
  if (contentment >= CONTENTMENT_LEVELS.medium.min) return CONTENTMENT_LEVELS.medium;
  if (contentment >= CONTENTMENT_LEVELS.low.min) return CONTENTMENT_LEVELS.low;
  return CONTENTMENT_LEVELS.veryLow;
}

/**
 * Updates the contentment effects based on the current contentment level
 */
export function updateContentmentEffects() {
  const level = getCurrentContentmentLevel();
  let levelKey;

  // Determine which level key to use
  for (const key in CONTENTMENT_LEVELS) {
    if (CONTENTMENT_LEVELS[key] === level) {
      levelKey = key;
      break;
    }
  }

  // Apply effects
  if (levelKey) {
    gameState.contentmentEffects = {
      resourceEfficiency: CONTENTMENT_EFFECTS.resourceEfficiency[levelKey],
      energyConsumption: CONTENTMENT_EFFECTS.energyConsumption[levelKey],
      corruptionResistance: CONTENTMENT_EFFECTS.corruptionResistance[levelKey]
    };
  }
}

/**
 * Updates the contentment display in the UI
 */
export function updateContentmentDisplay() {
  const contentmentDisplay = document.getElementById('contentment-display');
  if (!contentmentDisplay) return;

  const level = getCurrentContentmentLevel();

  // Update the icon and color
  const iconElement = contentmentDisplay.querySelector('i');
  if (iconElement) {
    iconElement.setAttribute('data-lucide', level.icon);

    // Remove all color classes
    iconElement.classList.remove('green', 'light-green', 'yellow', 'orange', 'red');

    // Add the appropriate color class
    iconElement.classList.add(level.color);
  }

  // Update the text
  const textElement = contentmentDisplay.querySelector('span');
  if (textElement) {
    textElement.textContent = level.translationKey ? t(level.translationKey) : level.name;
  }
}

/**
 * Checks and updates contentment based on resource levels and other factors
 * Should be called daily in the game loop
 */
export function checkContentmentEffects() {
  const { food, water, wood } = gameState;

  // Calculate resource percentages
  const foodPercentage = calculateResourcePercentage('food');
  const waterPercentage = calculateResourcePercentage('water');
  const woodPercentage = calculateResourcePercentage('wood');

  // Check if resources are low (below 10% of capacity)
  const lowResources = [];
  if (foodPercentage < 0.1) lowResources.push('food');
  if (waterPercentage < 0.1) lowResources.push('water');
  if (woodPercentage < 0.1) lowResources.push('wood');

  // Check if resources are high (above 50% of capacity)
  const highResources = [];
  if (foodPercentage > 0.5) highResources.push('food');
  if (waterPercentage > 0.5) highResources.push('water');
  if (woodPercentage > 0.5) highResources.push('wood');

  // Apply contentment changes
  if (lowResources.length > 0) {
    decreaseContentment(0.5 * lowResources.length, `low ${lowResources.join(', ')}`);
  }

  if (highResources.length > 0) {
    increaseContentment(0.5 * highResources.length, `abundant ${highResources.join(', ')}`);
  }
}

/**
 * Calculates the percentage of a resource relative to its maximum capacity
 * @param {string} resourceType - The type of resource to check
 * @returns {number} The percentage (0-1) of the resource
 */
function calculateResourcePercentage(resourceType) {
  // Default max values if not explicitly set
  const defaultMaxValues = {
    food: 100,
    water: 100,
    wood: 100
  };

  const currentAmount = gameState[resourceType] || 0;
  const maxKey = `max${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`;
  const maxAmount = gameState[maxKey] || defaultMaxValues[resourceType] || 100;

  return currentAmount / maxAmount;
}

/**
 * Gets the contentment effects for use in other modules
 * @returns {Object} The current contentment effects
 */
export function getContentmentEffects() {
  return gameState.contentmentEffects;
} 