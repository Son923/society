import { gameState } from './settings.js';
import { updateGameState } from './game.js';
import { addLogEntry } from './log.js';
import { checkUpgradeAvailability } from './upgrades.js';
import { getContentmentEffects } from './contentment.js';
import { getSpecializationBonus } from './specializations.js';

/**
 * Selects the best available party member for an action.
 * @returns {Object|null} An object containing the selected member and their index, or null if no member is available.
 */
function selectBestPartyMember() {
  const currentTime = gameState.hour + (gameState.day - 1) * 24;
  return gameState.party.reduce((best, member, index) => {
    const isBusy = gameState.busyUntil[index] > currentTime;
    const isResting = gameState.busyUntil[index] === -1;
    if (!member.isDead && !isBusy && !isResting && (!best || member.energy > best.member.energy)) {
      return { member, index };
    }
    return best;
  }, null);
}

/**
 * Performs a resource gathering action.
 * @param {string} resourceType - The type of resource to gather ('food', 'water', or 'wood').
 * @param {number} minAmount - The minimum amount of resource that can be gathered.
 * @param {number} maxAmount - The maximum amount of resource that can be gathered.
 */
function performResourceAction(resourceType, minAmount, maxAmount) {
  const selected = selectBestPartyMember();
  if (!selected) {
    console.log(`No available party members to gather ${resourceType}.`);
    addLogEntry(`Failed to gather ${resourceType}: No available party members.`, 'warning');
    if (gameState.party.every(member => member.isDead)) {
      addLogEntry("All party members are dead. Game over!", 'error');
      gameOver();
    }
    return;
  }

  // Apply contentment effects to resource gathering
  const contentmentEffects = getContentmentEffects();
  const contentmentModifier = 1 + (contentmentEffects.resourceEfficiency || 0);

  // Apply specialization bonus if the member is a gatherer
  const specializationModifier = getSpecializationBonus(selected.member.specialization, resourceType);

  // Calculate base amount
  let amountGathered = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

  // Apply contentment and specialization modifiers
  amountGathered = Math.max(1, Math.floor(amountGathered * contentmentModifier * specializationModifier));

  gameState[resourceType] += amountGathered;
  gameState.totalResourcesGathered[resourceType] += amountGathered;
  gameState.totalActions++;

  // 5% chance to gain 1 knowledge point
  if (Math.random() < 0.05) {
    gameState.knowledgePoints += 1;
    gameState.totalKnowledgePointsGained += 1;
    addLogEntry(`${selected.member.name} discovered 1 knowledge point while gathering.`, 'success');
  }

  // Apply effects on hunger, thirst, and energy
  const effects = getResourceActionEffects(resourceType);
  selected.member.applyActionEffects(effects);

  addLogEntry(`${selected.member.name} gathered ${amountGathered} ${resourceType}.`, 'success');

  // Set the party member as busy for 1 hour
  gameState.busyUntil[selected.index] = gameState.hour + (gameState.day - 1) * 24 + 1;

  // Apply water purification effect if active
  if (resourceType === 'water' && gameState.waterPurificationActive) {
    const waterSaved = Math.floor(amountGathered * 0.2);
    amountGathered += waterSaved;
  }

  updateGameState();
  updateActionButtonsState();
  checkUpgradeAvailability();
}

/**
 * Determines the effects on hunger, thirst, and energy for each resource action.
 * @param {string} resourceType - The type of resource being gathered.
 * @returns {Object} An object containing the effects on hunger, thirst, and energy.
 */
function getResourceActionEffects(resourceType) {
  switch (resourceType) {
    case 'food':
      return { hunger: -1, thirst: -3, energy: -5 };
    case 'water':
      return { hunger: -3, thirst: -1, energy: -4 };
    case 'wood':
      return { hunger: -4, thirst: -4, energy: -6 };
    default:
      return { hunger: -2, thirst: -2, energy: -5 };
  }
}

/**
 * Performs the gather food action.
 */
export function gatherFood() {
  const efficiency = gameState.resourceEfficiency || 1;
  const minAmount = Math.floor((3 + (gameState.day / 10)) * efficiency);
  const maxAmount = Math.floor((8 + (gameState.day / 5)) * efficiency);
  performResourceAction('food', minAmount, maxAmount);
}

/**
 * Performs the collect water action.
 */
export function collectWater() {
  const efficiency = gameState.resourceEfficiency || 1;
  const minAmount = Math.floor((2 + (gameState.day / 10)) * efficiency);
  const maxAmount = Math.floor((6 + (gameState.day / 5)) * efficiency);
  performResourceAction('water', minAmount, maxAmount);
}

/**
 * Performs the chop wood action.
 */
export function chopWood() {
  const efficiency = gameState.resourceEfficiency || 1;
  const minAmount = Math.floor((1 + (gameState.day / 10)) * efficiency);
  const maxAmount = Math.floor((2 + (gameState.day / 5)) * efficiency);
  performResourceAction('wood', minAmount, maxAmount);
}

/**
 * Sets up event listeners for action buttons.
 */
export function setupActionListeners() {
  document.getElementById('gatherFoodBtn').addEventListener('click', gatherFood);
  document.getElementById('collectWaterBtn').addEventListener('click', collectWater);
  document.getElementById('chopWoodBtn').addEventListener('click', chopWood);
  updateActionButtonsState();
}

/**
 * Updates the state of action buttons based on available party members.
 */
export function updateActionButtonsState() {
  const isDisabled = !selectBestPartyMember();
  ['gatherFoodBtn', 'collectWaterBtn', 'chopWoodBtn'].forEach(btnId => {
    document.getElementById(btnId).disabled = isDisabled;
  });
}