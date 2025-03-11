import { gameState, UPGRADES } from './settings.js';
import { updateGameState } from './game.js';
import { addLogEntry } from './log.js';
import { createLucideIcons } from './utils.js';
import { saveGameState } from './storage.js';
import { initializeFarming } from './farming.js';
import { initializeHunting } from './hunting.js';
import { initializeAutomatedFeeding, initializeWaterPurificationSystem, initializeComfortableSleepingQuarters, initializeFoodGatheringDrone, initializeWaterGatheringDrone, initializeWoodGatheringDrone } from './automation.js';
import { initializeWell } from './well.js';
import { initializeLumberMill } from './lumbermill.js';
import { initializeWatchtower } from './watchtower.js';
import { applyAdvancedFarmingEffects } from './farming.js';
import { getWoodCostReduction } from './specializations.js';
import { initializeMedicalTent } from './medicaltent.js';
import { t } from './translations/index.js';

/**
 * Buys an upgrade if the player can afford it.
 * @param {string} upgradeId - The ID of the upgrade to buy.
 */
export function buyUpgrade(upgradeId) {
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade || gameState.upgrades[upgradeId]) return;

  // Calculate costs with builder discount applied to wood
  const adjustedCosts = {};
  for (const [resource, amount] of Object.entries(upgrade.cost)) {
    if (resource === 'wood') {
      // Find the best builder in the party
      const bestBuilder = findBestBuilder();
      const woodCostReduction = bestBuilder ? getWoodCostReduction(bestBuilder) : 1;
      adjustedCosts[resource] = Math.floor(amount * woodCostReduction);
    } else {
      adjustedCosts[resource] = amount;
    }
  }

  let canAfford = true;
  for (const [resource, amount] of Object.entries(adjustedCosts)) {
    if (gameState[resource] < amount) {
      canAfford = false;
      break;
    }
  }

  if (canAfford) {
    for (const [resource, amount] of Object.entries(adjustedCosts)) {
      gameState[resource] -= amount;
    }
    gameState.upgrades[upgradeId] = true;

    // Log the upgrade purchase with discount information if applicable
    if (adjustedCosts.wood !== upgrade.cost.wood) {
      addLogEntry(`${t('unlockedUpgrade')}: ${t(upgradeId)} (${t('builderDiscount')}: ${upgrade.cost.wood - adjustedCosts.wood} ${t('wood')} ${t('saved')})`, 'success');
    } else {
      addLogEntry(`${t('unlockedUpgrade')}: ${t(upgradeId)}`, 'success');
    }

    applyUpgradeEffects(upgradeId);
    checkPrerequisites(upgradeId);
    updateGameState();
    updateUpgradesUI();
    saveGameState(); // Add this line to save the game state after buying an upgrade
  } else {
    addLogEntry(`${t('cannotAffordUpgrade')}: ${t(upgradeId)}`, 'error');
  }
}

/**
 * Finds the party member with the builder specialization who provides the best wood cost reduction.
 * @returns {Object|null} The best builder party member, or null if none found.
 */
function findBestBuilder() {
  if (!gameState.party) return null;

  return gameState.party.reduce((bestBuilder, member) => {
    if (member.specialization === 'builder' && !member.isDead) {
      if (!bestBuilder) return member;
    }
    return bestBuilder;
  }, null);
}

/**
 * Applies the effects of an upgrade.
 * @param {string} upgradeId - The ID of the upgrade to apply.
 */
export function applyUpgradeEffects(upgradeId) {
  switch (upgradeId) {
    case 'farming':
      unlockSecondaryModule('farming-module');
      initializeFarming();
      break;
    case 'well':
      unlockSecondaryModule('well-module');
      initializeWell();
      break;
    case 'huntingLodge':
      unlockSecondaryModule('hunting-module');
      initializeHunting();
      break;
    case 'advancedFarming':
      applyAdvancedFarmingEffects();
      break;
    case 'waterPurification':
      applyWaterPurificationEffects();
      break;
    case 'toolWorkshop':
      applyToolWorkshopEffects();
      break;
    case 'medicalTent':
      initializeMedicalTent();
      break;
    case 'lumberMill':
      unlockSecondaryModule('lumber-mill-module');
      initializeLumberMill();
      break;
    case 'watchtower':
      unlockSecondaryModule('watchtower-module');
      initializeWatchtower();
      break;
    case 'automatedFeeding':
      initializeAutomatedFeeding();
      break;
    case 'waterPurificationSystem':
      initializeWaterPurificationSystem();
      break;
    case 'comfortableSleepingQuarters':
      initializeComfortableSleepingQuarters();
      break;
    case 'foodGatheringDrone':
      initializeFoodGatheringDrone();
      break;
    case 'waterGatheringDrone':
      initializeWaterGatheringDrone();
      break;
    case 'woodGatheringDrone':
      initializeWoodGatheringDrone();
      break;
    case 'specializations':
      initializeSpecializations();
      break;
    default:
      console.warn(`No effects implemented for upgrade: ${upgradeId}`);
  }
}

/**
 * Checks and updates the availability of upgrades.
 */
export function checkUpgradeAvailability() {
  if (!gameState.upgrades) {
    gameState.upgrades = {};
  }

  for (const [upgradeId, upgrade] of Object.entries(UPGRADES)) {
    if (!gameState.upgrades[upgradeId]) {
      let canAfford = true;
      for (const [resource, amount] of Object.entries(upgrade.cost)) {
        if (gameState[resource] < amount) {
          canAfford = false;
          break;
        }
      }

      if (!upgrade.available) {
        if ((upgrade.prerequisite && gameState.upgrades[upgrade.prerequisite]) || !upgrade.prerequisite) {
          upgrade.available = canAfford;
          if (canAfford) {
            addLogEntry(`${t('newUpgradeAvailable')}: ${t(upgradeId)}`, 'info');
          }
        }
      }
    } else {
      upgrade.available = false; // Set to false if already purchased
    }
  }
  updateUpgradesUI();
}

/**
 * Updates the upgrades UI.
 */
export function updateUpgradesUI() {
  const upgradesContainer = document.getElementById('upgrades');
  if (!upgradesContainer) return;

  upgradesContainer.innerHTML = '';

  for (const [upgradeId, upgrade] of Object.entries(UPGRADES)) {
    if (upgrade.available || gameState.upgrades[upgradeId]) {
      const upgradeButton = document.createElement('button');
      upgradeButton.className = 'upgrade-button';
      upgradeButton.dataset.upgradeId = upgradeId;

      // Calculate costs with builder discount applied to wood
      const adjustedCosts = {};
      let builderDiscountApplied = false;
      let originalWoodCost = 0;
      let discountedWoodCost = 0;

      for (const [resource, amount] of Object.entries(upgrade.cost)) {
        if (resource === 'wood') {
          // Find the best builder in the party
          const bestBuilder = findBestBuilder();
          const woodCostReduction = bestBuilder ? getWoodCostReduction(bestBuilder) : 1;

          if (woodCostReduction < 1) {
            builderDiscountApplied = true;
            originalWoodCost = amount;
            discountedWoodCost = Math.floor(amount * woodCostReduction);
            adjustedCosts[resource] = discountedWoodCost;
          } else {
            adjustedCosts[resource] = amount;
          }
        } else {
          adjustedCosts[resource] = amount;
        }
      }

      let canAfford = true;
      for (const [resource, amount] of Object.entries(adjustedCosts)) {
        if (gameState[resource] < amount) {
          canAfford = false;
          break;
        }
      }

      if (gameState.upgrades[upgradeId]) {
        upgradeButton.classList.add('purchased');
      } else if (!canAfford) {
        upgradeButton.classList.add('cannot-afford');
      } else {
        upgradeButton.classList.add('available');
      }

      upgradeButton.innerHTML = `
        <div class="upgrade-name">
          <span class="name">${t(upgradeId)}</span>
          <span class="cost">
            ${Object.entries(upgrade.cost).map(([resource, amount]) => {
        if (resource === 'wood' && builderDiscountApplied) {
          return `
                  <span class="discounted-cost">
                    <span class="original-cost">${originalWoodCost}</span>
                    <span class="discount-arrow">→</span>
                    ${discountedWoodCost}
                  </span>
                  <i data-lucide="${getResourceIcon(resource)}" class="icon ${getResourceColor(resource)}"></i>
                `;
        } else {
          return `
                  ${amount} <i data-lucide="${getResourceIcon(resource)}" class="icon ${getResourceColor(resource)}"></i>
                `;
        }
      }).join('')}
          </span>
        </div>
        <div class="upgrade-effect">${t(upgradeId + 'Desc')}</div>
        ${builderDiscountApplied ? `<div class="builder-discount">${t('builderDiscount')}: ${Math.round((1 - discountedWoodCost / originalWoodCost) * 100)}%</div>` : ''}
      `;

      if (!gameState.upgrades[upgradeId]) {
        upgradeButton.addEventListener('click', () => buyUpgrade(upgradeId));
      }

      upgradesContainer.appendChild(upgradeButton);
    }
  }

  // Refresh Lucide icons
  createLucideIcons();
}

/**
 * Gets the appropriate icon for a resource.
 * @param {string} resource - The resource type.
 * @returns {string} The icon name for the resource.
 */
function getResourceIcon(resource) {
  switch (resource) {
    case 'food': return 'beef';
    case 'water': return 'droplet';
    case 'wood': return 'tree-pine';
    case 'knowledgePoints': return 'book';
    default: return 'circle';
  }
}

/**
 * Gets the appropriate color class for a resource icon.
 * @param {string} resource - The resource type.
 * @returns {string} The color class for the resource icon.
 */
function getResourceColor(resource) {
  switch (resource) {
    case 'food': return 'dark-yellow';
    case 'water': return 'blue';
    case 'wood': return 'green';
    case 'knowledgePoints': return 'magenta';
    default: return '';
  }
}

/**
 * Initializes the upgrades module.
 */
export function initializeUpgrades() {
  if (!gameState.upgrades) {
    gameState.upgrades = {};
  }

  // Check and update the availability of upgrades based on the saved state
  for (const [upgradeId, upgrade] of Object.entries(UPGRADES)) {
    if (gameState.upgrades[upgradeId]) {
      upgrade.available = false; // Set to false if already purchased
    } else if (upgrade.prerequisite) {
      upgrade.available = gameState.upgrades[upgrade.prerequisite] || false;
    } else {
      upgrade.available = true; // Set to true for upgrades without prerequisites
    }
  }

  updateUpgradesUI();
  
  // Listen for language change events
  document.addEventListener('languageChanged', () => {
    updateUpgradesUI();
  });
}

function checkPrerequisites(purchasedUpgradeId) {
  for (const [upgradeId, upgrade] of Object.entries(UPGRADES)) {
    if (!gameState.upgrades[upgradeId] && upgrade.prerequisite === purchasedUpgradeId) {
      upgrade.available = true;
      addLogEntry(`${t('newUpgradeAvailable')}: ${t(upgradeId)}`, 'info');
    }
  }
}

/**
 * Unlocks a secondary module by removing its mystery state.
 * @param {string} moduleId - The ID of the module to unlock.
 */
export function unlockSecondaryModule(moduleId) {
  const module = document.getElementById(moduleId);
  if (module && module.classList.contains('mystery')) {
    module.classList.remove('mystery');
    module.innerHTML = `
      <h2><i data-lucide="${getModuleIcon(moduleId)}" class="icon-dark"></i> ${getModuleTitle(moduleId)}</h2>
      <section class="module-content"></section>
    `;
    createLucideIcons();
    addLogEntry(`Unlocked new module: ${getModuleTitle(moduleId)}`, 'success');
  }
}

function getModuleIcon(moduleId) {
  switch (moduleId) {
    case 'farming-module': return 'sprout';
    case 'well-module': return 'droplet';
    case 'hunting-module': return 'target';
    case 'lumber-mill-module': return 'axe';
    case 'watchtower-module': return 'eye';
    default: return 'circle-help';
  }
}

function getModuleTitle(moduleId) {
  return moduleId.replace('-module', '').split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

/**
 * Applies the effects of the Water Purification System upgrade.
 */
function applyWaterPurificationEffects() {
  gameState.waterPurificationActive = true;
  addLogEntry('Water Purification System activated: Water consumption reduced by 20% for all activities.', 'success');
}

function applyToolWorkshopEffects() {
  gameState.resourceEfficiency = 1.25; // 25% increase in resource gathering efficiency
  addLogEntry('Tool Workshop built. Resource gathering efficiency increased by 25%!', 'success');
}

/**
 * Initializes the specialization system after the upgrade is purchased.
 */
function initializeSpecializations() {
  addLogEntry('Specialization Training complete! Party members can now specialize in different roles.', 'success');
  // Force update of party display to show specialization options
  import('./party.js').then(partyModule => {
    partyModule.updatePartyDisplay();
  });
}