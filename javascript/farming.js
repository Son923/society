import { gameState } from './settings.js';
import { updateGameState } from './game.js';
import { addLogEntry } from './log.js';
import { createLucideIcons } from './utils.js';

/**
 * Defines the types of crops and their properties.
 * @typedef {Object} CropType
 * @property {number} growthTime - Time in hours for the crop to grow
 * @property {number} waterNeeded - Amount of water needed to plant the crop
 * @property {number} yield - Amount of food yielded when harvested
 */

/**
 * @type {Object.<string, CropType>}
 */
const CROP_TYPES = {
  wheat: { growthTime: 24, waterNeeded: 5, yield: 20 },
  carrot: { growthTime: 48, waterNeeded: 10, yield: 50 },
  bean: { growthTime: 72, waterNeeded: 15, yield: 80 }
};

/**
 * Initializes the farming module in the game state.
 */
export function initializeFarming() {
  if (!gameState.farming) {
    gameState.farming = {
      grid: Array(5).fill().map(() => Array(5).fill(null)),
      maxCrops: 25,
      crops: CROP_TYPES,
      plantingCrop: 'wheat'
    };
  }
  updateFarmingUI();
}

/**
 * Plants a crop in the specified plot.
 * @param {number} row - The row index of the plot
 * @param {number} col - The column index of the plot
 */
export function plantCrop(row, col) {
  if (gameState.farming.grid[row][col] !== null) {
    return;
  }

  const cropType = gameState.farming.plantingCrop;
  const waterCost = CROP_TYPES[cropType].waterNeeded;

  if (gameState.water < waterCost) {
    addLogEntry(`Not enough water to plant ${cropType}. Need ${waterCost} water.`, 'error');
    return;
  }

  // Apply farming effects from upgrades and technologies
  const farmingEffects = applyAdvancedFarmingEffects();
  const baseGrowthTime = CROP_TYPES[cropType].growthTime;
  const adjustedGrowthTime = Math.floor(baseGrowthTime * farmingEffects.growthTimeReduction);

  gameState.water -= waterCost;
  gameState.farming.grid[row][col] = {
    type: cropType,
    plantedAt: gameState.hour + (gameState.day - 1) * 24,
    growthTime: adjustedGrowthTime,
    growthProgress: 0
  };

  addLogEntry(`Planted ${cropType} (requires ${adjustedGrowthTime} hours to grow)`, 'success');
  updateGameState();
  updateFarmingUI();
}

/**
 * Harvests a crop from the specified plot.
 * @param {number} row - The row index of the plot
 * @param {number} col - The column index of the plot
 */
export function harvestCrop(row, col) {
  const plot = gameState.farming.grid[row][col];
  if (!plot || plot.growthProgress < 1) {
    return;
  }

  const cropType = plot.type;
  const baseYield = CROP_TYPES[cropType].yield;

  // Apply farming effects from upgrades and technologies
  const farmingEffects = applyAdvancedFarmingEffects();
  const adjustedYield = Math.floor(baseYield * farmingEffects.yieldMultiplier);

  // Add the harvested food to the game state
  gameState.food += adjustedYield;
  gameState.totalResourcesGathered.food += adjustedYield;
  gameState.totalCropsHarvested += 1;

  // Clear the plot
  gameState.farming.grid[row][col] = null;

  addLogEntry(`Harvested ${cropType}: +${adjustedYield} food`, 'success');
  updateGameState();
  updateFarmingUI();
}

/**
 * Sets the current crop type for planting.
 * @param {string} cropType - The type of crop to set for planting
 */
export function setPlantingCrop(cropType) {
  gameState.farming.plantingCrop = cropType;
  updateFarmingUI();
}

/**
 * Updates the farming UI.
 */
export function updateFarmingUI() {
  const farmingModule = document.getElementById('farming-module');
  if (!farmingModule) return;

  farmingModule.innerHTML = `
    <h2><i data-lucide="sprout" class="icon-dark"></i> Farming</h2>
    <div class="crop-picker">
      ${Object.keys(CROP_TYPES).map(cropType => createCropButton(cropType)).join('')}
    </div>
    <div id="farming-grid">
      ${gameState.farming.grid.map((row, rowIndex) =>
    row.map((plot, colIndex) => createPlotElement(plot, rowIndex, colIndex)).join('')
  ).join('')}
    </div>
  `;

  createLucideIcons();
}

/**
 * Creates a button element for a crop type.
 * @param {string} cropType - The type of crop
 * @returns {string} HTML string for the crop button
 */
function createCropButton(cropType) {
  return `
    <button onclick="window.setPlantingCrop('${cropType}')" class="${gameState.farming.plantingCrop === cropType ? 'active' : ''}">
      <i data-lucide="${getCropIcon(cropType)}" class="icon ${getCropColor(cropType)}"></i>
      ${cropType} [${CROP_TYPES[cropType].waterNeeded} <i data-lucide="droplet" class="icon blue"></i>]
    </button>
  `;
}

/**
 * Creates an HTML element for a plot.
 * @param {Object|null} plot - The plot object or null if empty
 * @param {number} row - The row index of the plot
 * @param {number} col - The column index of the plot
 * @returns {string} HTML string for the plot element
 */
function createPlotElement(plot, row, col) {
  if (!plot) {
    return `<div class="plot-cell empty-plot" onclick="window.plantCrop(${row}, ${col})"></div>`;
  }

  const now = gameState.hour + (gameState.day - 1) * 24;
  // Use the plot's growthTime which has already been adjusted for advanced farming effects
  const growthProgress = (now - plot.plantedAt) / plot.growthTime;

  // Store the growth progress in the plot object
  plot.growthProgress = Math.min(growthProgress, 1);

  const isReady = plot.growthProgress >= 1;
  const progressPercent = Math.floor(plot.growthProgress * 100);

  // Determine growth class based on progress
  let growthClass = 'just-planted';
  if (isReady) {
    growthClass = 'ready-to-harvest';
  } else if (progressPercent >= 75) {
    growthClass = 'almost-ready';
  } else if (progressPercent >= 50) {
    growthClass = 'half-grown';
  } else if (progressPercent >= 25) {
    growthClass = 'quarter-grown';
  }

  return `
    <div class="plot-cell ${growthClass}"
         onclick="${isReady ? `window.harvestCrop(${row}, ${col})` : ''}"
         title="${plot.type}: ${progressPercent}% grown">
      <i data-lucide="${getCropIcon(plot.type)}" class="icon ${getCropColor(plot.type)}"></i>
      ${!isReady ? `<div class="growth-progress">${progressPercent}%</div>` : ''}
    </div>
  `;
}

/**
 * Gets the icon name for a crop type.
 * @param {string} cropType - The type of crop
 * @returns {string} The icon name
 */
function getCropIcon(cropType) {
  const icons = {
    wheat: 'wheat',
    carrot: 'carrot',
    bean: 'bean'
  };
  return icons[cropType] || 'sprout';
}

/**
 * Gets the color class for a crop type.
 * @param {string} cropType - The type of crop
 * @returns {string} The color class
 */
function getCropColor(cropType) {
  const colors = {
    wheat: 'light-yellow',
    carrot: 'dark-yellow',
    bean: 'dark-red'
  };
  return colors[cropType] || 'green';
}

/**
 * Applies the effects of the Advanced Farming upgrade and technology.
 * @returns {Object} The modified crop properties
 */
export function applyAdvancedFarmingEffects() {
  const hasAdvancedFarmingUpgrade = gameState.upgrades.advancedFarming;
  const hasAdvancedFarmingTech = gameState.technologies?.advancedFarming?.researched;

  let yieldMultiplier = 1;
  let growthTimeReduction = 1;

  // Apply upgrade effects
  if (hasAdvancedFarmingUpgrade) {
    yieldMultiplier *= 1.5; // 50% more yield
    growthTimeReduction *= 0.75; // 25% less growth time
  }

  // Apply technology effects
  if (hasAdvancedFarmingTech) {
    yieldMultiplier *= 1.5; // Additional 50% more yield
    growthTimeReduction *= 0.75; // Additional 25% less growth time
  }

  return {
    yieldMultiplier,
    growthTimeReduction
  };
}

// Expose functions to the global scope for onclick events
window.setPlantingCrop = setPlantingCrop;
window.plantCrop = plantCrop;
window.harvestCrop = harvestCrop;