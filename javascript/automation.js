import { gameState } from './settings.js';
import { addLogEntry } from './log.js';
import { performAction, isBusy } from './party.js';
import { t } from './translations/index.js';

/**
 * Initializes the automation system and sets up event listeners.
 */
export function initializeAutomation() {
  gameState.automations = gameState.automations || {};
  
  // Listen for language change events
  document.addEventListener('languageChanged', () => {
    // Automation doesn't have a persistent UI to update
    // But we can update any displayed automation messages if needed in the future
  });
}

export function initializeAutomatedFeeding() {
  gameState.automations = gameState.automations || {};
  gameState.automations.feeding = true;
}

export function initializeWaterPurificationSystem() {
  gameState.automations = gameState.automations || {};
  gameState.automations.watering = true;
}

export function initializeComfortableSleepingQuarters() {
  gameState.automations = gameState.automations || {};
  gameState.automations.resting = true;
}

export function initializeFoodGatheringDrone() {
  gameState.automations = gameState.automations || {};
  gameState.automations.foodGathering = { active: true, lastGathered: gameState.hour + (gameState.day - 1) * 24 };
}

export function initializeWaterGatheringDrone() {
  gameState.automations = gameState.automations || {};
  gameState.automations.waterGathering = { active: true, lastGathered: gameState.hour + (gameState.day - 1) * 24 };
}

export function initializeWoodGatheringDrone() {
  gameState.automations = gameState.automations || {};
  gameState.automations.woodGathering = { active: true, lastGathered: gameState.hour + (gameState.day - 1) * 24 };
}

export function runAutomations() {
  const currentTime = gameState.hour + (gameState.day - 1) * 24;

  if (gameState.automations) {
    if (gameState.automations.feeding) {
      automatedFeeding();
    }
    if (gameState.automations.watering) {
      automatedWatering();
    }
    if (gameState.automations.resting) {
      automatedResting();
    }
    if (gameState.automations.foodGathering && gameState.automations.foodGathering.active) {
      automatedFoodGathering(currentTime);
    }
    if (gameState.automations.waterGathering && gameState.automations.waterGathering.active) {
      automatedWaterGathering(currentTime);
    }
    if (gameState.automations.woodGathering && gameState.automations.woodGathering.active) {
      automatedWoodGathering(currentTime);
    }
  }
}

function automatedFeeding() {
  const currentTime = gameState.hour + (gameState.day - 1) * 24;
  gameState.party.forEach((member, index) => {
    if (member.hunger <= 50 && gameState.food >= 5 && !isBusy(index, currentTime)) {
      performAction(index, 'eat');
      addLogEntry(t('Automated Feeding System fed {name}'), { name: member.name });
    }
  });
}

function automatedWatering() {
  const currentTime = gameState.hour + (gameState.day - 1) * 24;
  gameState.party.forEach((member, index) => {
    if (member.thirst <= 50 && gameState.water >= 3 && !isBusy(index, currentTime)) {
      performAction(index, 'drink');
      addLogEntry(t('Water Purification System provided water to {name}'), { name: member.name });
    }
  });
}

function automatedResting() {
  const currentTime = gameState.hour + (gameState.day - 1) * 24;
  gameState.party.forEach((member, index) => {
    if (member.energy <= 35 && !isBusy(index, currentTime)) {
      performAction(index, 'sleep');
      addLogEntry(t('Comfortable Sleeping Quarters initiated rest for {name}'), { name: member.name });
    }
  });
}

function automatedFoodGathering(currentTime) {
  if (currentTime - gameState.automations.foodGathering.lastGathered >= 1) {
    const gatherAmount = Math.floor(Math.random() * 8) + 1; // Random amount between 1 and 8
    gameState.food += gatherAmount;
    gameState.totalResourcesGathered.food += gatherAmount;
    // addLogEntry(`Food Gathering Drone collected ${gatherAmount} food`);
    addLogEntry(t('Food Gathering Drone collected {amount} food'), { amount: gatherAmount });
    gameState.automations.foodGathering.lastGathered = currentTime;
  }
}

function automatedWaterGathering(currentTime) {
  if (currentTime - gameState.automations.waterGathering.lastGathered >= 1) {
    const gatherAmount = Math.floor(Math.random() * 5) + 1; // Random amount between 1 and 5
    gameState.water += gatherAmount;
    gameState.totalResourcesGathered.water += gatherAmount;
    // addLogEntry(`Water Gathering Drone collected ${gatherAmount} water`);
    addLogEntry(t('Water Gathering Drone collected {amount} water'), { amount: gatherAmount });
    gameState.automations.waterGathering.lastGathered = currentTime;
  }
}

function automatedWoodGathering(currentTime) {
  if (currentTime - gameState.automations.woodGathering.lastGathered >= 1) {
    const gatherAmount = Math.floor(Math.random() * 3) + 1; // Random amount between 1 and 3
    gameState.wood += gatherAmount;
    gameState.totalResourcesGathered.wood += gatherAmount;
    // addLogEntry(`Wood Gathering Drone collected ${gatherAmount} wood`);
    addLogEntry(t('Wood Gathering Drone collected {amount} wood'), { amount: gatherAmount });
    gameState.automations.woodGathering.lastGathered = currentTime;
  }
}