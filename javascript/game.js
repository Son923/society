/*
  Game Module
  This module handles core game functionality including initialization,
  difficulty selection, game controls, and state management.
*/

import { createLucideIcons, initializeCollapsibles } from './utils.js';
import { addLogEntry, clearLog, updateLogUI, initializeLog } from './log.js';
import { startTime, togglePause as toggleTimePause, resetTime, stopTime, updateTimeDisplay } from './time.js';
import { saveGameState, loadGameState, clearGameState } from './storage.js';
import { gameState, UPGRADES, resetGameState, STARTING_RESOURCES } from './settings.js';
import { initializeParty, updatePartyStats, updatePartyDisplay, performAction, PartyMember, checkPartyStatus } from './party.js';
import { setupActionListeners, updateActionButtonsState } from './actions.js';
import { initializeUpgrades, checkUpgradeAvailability, updateUpgradesUI, applyUpgradeEffects } from './upgrades.js';
import { unlockSecondaryModule } from './upgrades.js';
import { initializeFarming, updateFarmingUI } from './farming.js';
import { initializeWell, generateWellWater } from './well.js';
import { initializeHunting } from './hunting.js';
import { initializeLumberMill, updateLumberMill } from './lumbermill.js';
import { initializeAchievements, checkAchievements, ACHIEVEMENTS, updateAchievementsUI } from './achievements.js';
import { initializeWatchtower, checkRescueMission, updateWatchtowerUI } from './watchtower.js';
import { checkForRandomEvent, initializeRandomEvents } from './randomevents.js';
import { checkTutorials, initializeTutorials, saveTutorialState } from './tutorial.js';
import { runAutomations, initializeAutomation } from './automation.js';
import { applyMedicalTentEffects } from './medicaltent.js';
import { initializeContentment, checkContentmentEffects, updateContentmentDisplay, getContentmentEffects } from './contentment.js';
import { getKnowledgeGeneration } from './specializations.js';
import { initializeTechnologies, updateResearchProgress, showTechnologyModule, updateTechnologiesUI } from './technologies.js';
import { t } from './translations/index.js';

// Debug mode flag
let isDebugMode = false;

/**
 * Enables debug mode, unlocking all upgrades and setting resources to 1000.
 */
function enableDebugMode() {
  if (isDebugMode) return;
  console.log('Debug mode enabled');
  isDebugMode = true;
  gameState.food = 1000;
  gameState.water = 1000;
  gameState.wood = 1000;
  gameState.knowledgePoints = 1000;

  for (const upgradeId in UPGRADES) {
    gameState.upgrades[upgradeId] = true;
    UPGRADES[upgradeId].available = false;
    applyUpgradeEffects(upgradeId);
  }

  updateResourceDisplay();
  updateUpgradesUI();
  initializeUnlockedModules();
  addLogEntry('Debug mode enabled: All upgrades unlocked and resources set to 1000', 'success');
}

// Expose enableDebugMode to the global scope
window.enableDebugMode = enableDebugMode;

/**
 * Initializes the game by setting up event listeners and loading game state.
 */
export function initializeGame() {
  console.log('Initializing game...');

  // Add global click listener to resume game ticks when clicking outside dropdown
  document.addEventListener('click', (event) => {
    // If we're clicking anywhere that's not a select element or its option
    if (!event.target.closest('select')) {
      // Import the function dynamically to avoid circular dependencies
      import('./time.js').then(timeModule => {
        timeModule.pauseForUIInteraction(false);
      });
    }
  });

  setupDifficultySelection();
  setupGameControls();
  setupPartyActions();
  setupActionListeners();
  initializeLog();
  initializeAutomation();
  initializeRandomEvents();
  initializeTutorials();
  initializeContentment();

  const loadedState = loadGame();
  if (loadedState === 'incompatible') {
    alert('Your saved game is incompatible with the current version. The game will be reset. There is no mercy in the apocalypse.');
    resetGame();
  } else if (loadedState) {
    showGameScreen();
    updateResourceDisplay();
    updatePartyDisplay();
    updateTimeDisplay();
    updateLogUI();
    initializeUpgrades();
    initializeTechnologies();
    startTime();

    // Check if there's a pending research to complete after loading
    if (gameState.completePendingResearch) {
      import('./technologies.js').then(techModule => {
        techModule.completeResearch(gameState.completePendingResearch);
        delete gameState.completePendingResearch;
      });
    }
  }

  updateStartScreenResources();
  initializeUpgrades();
  initializeAchievements();
  initializeUnlockedModules();
  initializeCollapsibles();
  initializeWatchtower();

  // Check for debug mode
  if (window.location.hash === '#debug') {
    enableDebugMode();
  }

  console.log('Game initialization complete');
}

/**
 * Starts the game with the selected difficulty and sets initial resources.
 * @param {string} difficulty - The selected game difficulty.
 */
function startGame(difficulty) {
  console.log(`Starting game with ${difficulty} difficulty`);
  gameState.difficulty = difficulty;

  // Set initial resources based on difficulty
  if (STARTING_RESOURCES[difficulty]) {
    Object.assign(gameState, STARTING_RESOURCES[difficulty]);
  } else {
    console.error('Invalid difficulty selected');
    return;
  }

  initializeParty();
  initializeRandomEvents();
  showGameScreen();
  updateResourceDisplay();
  updatePartyDisplay();
  startTime();
  saveGameState(gameState);
  addLogEntry(`Game started with ${difficulty} difficulty`, 'success');
}

/**
 * Sets up event listeners for difficulty selection buttons.
 */
function setupDifficultySelection() {
  const difficultyButtons = document.querySelectorAll('#game_start_screen button[data-difficulty]');
  difficultyButtons.forEach(button => {
    button.addEventListener('click', () => startGame(button.dataset.difficulty));
  });
}

/**
 * Sets up event listeners for game control buttons (pause and reset).
 */
function setupGameControls() {
  const pauseButton = document.getElementById('pause-game');
  const resetButton = document.getElementById('reset-game');

  pauseButton?.addEventListener('click', togglePause);
  resetButton?.addEventListener('click', resetGame);
}

/**
 * Toggles the game pause state, updating UI elements accordingly.
 */
function togglePause() {
  const pauseButton = document.getElementById('pause-game');
  const pauseIcon = pauseButton.querySelector('.icon');
  const timeDisplayElement = document.querySelector('.time-display');
  const isPaused = pauseIcon.getAttribute('data-lucide') === 'pause';

  pauseIcon.setAttribute('data-lucide', isPaused ? 'play' : 'pause');
  createLucideIcons();
  timeDisplayElement.classList.toggle('paused', isPaused);

  console.log(`Game ${isPaused ? 'paused' : 'resumed'}`);
  toggleTimePause();
}

/**
 * Resets the game to its initial state and returns to the start screen.
 */
function resetGame() {
  if (confirm("Are you sure you want to reset the game? All progress will be lost.")) {
    console.log('Game reset');
    stopTime();
    resetTime();
    clearGameState();
    resetGameState();
    clearLog();
    showStartScreen();
    resetPauseButton();
    initializeHunting();
    initializeAchievements();
    updateAchievementsUI();
    updateStartScreenResources();
  }
}

/**
 * Updates the game state, including party stats and resource display.
 */
export function updateGameState() {
  // Check if the game is over
  if (checkPartyStatus()) {
    gameOver();
    return;
  }

  // Update party stats
  updatePartyStats();
  updatePartyDisplay();

  // Update resource display
  updateResourceDisplay();

  // Check for random events
  checkForRandomEvent();

  // Check for achievements
  checkAchievements();
  updateAchievementsUI();

  // Check for tutorials
  checkTutorials();

  // Check for rescue missions
  checkRescueMission();
  updateWatchtowerUI();

  // Update farming
  if (gameState.upgrades.farming) {
    updateFarmingUI();
  }

  // Generate well water
  if (gameState.upgrades.well) {
    generateWellWater();
  }

  // Update lumber mill
  if (gameState.upgrades.lumberMill) {
    updateLumberMill();
  }

  // Apply medical tent effects
  if (gameState.upgrades.medicalTent) {
    applyMedicalTentEffects();
  }

  // Run automations
  runAutomations();

  // Generate knowledge from researchers
  generateKnowledgeFromResearchers();

  // Check contentment effects
  checkContentmentEffects();
  updateContentmentDisplay();

  // Update research progress
  updateResearchProgress();

  // Update technologies UI if there's active research
  if (gameState.activeResearch) {
    updateTechnologiesUI();
  }

  // Check if technology module should be shown
  checkTechnologyModuleAvailability();

  // Update action buttons state
  updateActionButtonsState();

  // Save game state
  saveGameState();
}

/**
 * Generates knowledge points from party members with researcher specialization
 */
function generateKnowledgeFromResearchers() {
  if (!gameState.party) return;

  let totalKnowledgeGeneration = 0;

  gameState.party.forEach(member => {
    if (member.specialization === 'researcher' && !member.isDead) {
      const knowledgeGeneration = getKnowledgeGeneration(member);
      totalKnowledgeGeneration += knowledgeGeneration;
    }
  });

  if (totalKnowledgeGeneration > 0) {
    gameState.knowledgePoints += totalKnowledgeGeneration;
    gameState.totalKnowledgePointsGained += totalKnowledgeGeneration;
  }
}

/**
 * Checks if the technology module should be shown based on game progress
 */
function checkTechnologyModuleAvailability() {
  // Show technology module after day 10 or when player has at least 5 knowledge points
  const shouldShowTechModule = gameState.day >= 10 || gameState.knowledgePoints >= 5;

  // Check if technology module exists in the DOM
  const techModule = document.getElementById('technology-module');

  if (shouldShowTechModule && techModule) {
    // If the module is still a mystery, show it
    if (techModule.classList.contains('mystery')) {
      showTechnologyModule(true);
      addLogEntry('You have gained enough knowledge to unlock the Technology research system!', 'success');
    }
  }
}

/**
 * Loads a saved game state if available.
 */
function loadGame() {
  const savedState = loadGameState();
  if (savedState && savedState !== 'incompatible') {
    Object.assign(gameState, savedState);
    reconstructPartyMembers();
    return true;
  }
  return savedState;
}

/**
 * Reconstructs PartyMember objects from saved state.
 */
function reconstructPartyMembers() {
  gameState.party = gameState.party.map(member => {
    const reconstructedMember = new PartyMember(member.name);
    return Object.assign(reconstructedMember, member);
  });
}

/**
 * Updates the displayed resource values in the UI.
 */
function updateResourceDisplay() {
  const resourceElements = document.querySelectorAll('.resources .resource span');
  ['food', 'water', 'wood', 'knowledgePoints'].forEach((resource, index) => {
    resourceElements[index].textContent = gameState[resource];
  });

  // Update contentment display if it exists
  const contentmentDisplay = document.getElementById('contentment-display');
  if (contentmentDisplay) {
    updateContentmentDisplay();
  }
}

/**
 * Updates the displayed resource values in the start screen based on STARTING_RESOURCES.
 */
function updateStartScreenResources() {
  const difficultyButtons = document.querySelectorAll('#game_start_screen button[data-difficulty]');

  difficultyButtons.forEach(button => {
    const difficulty = button.dataset.difficulty;
    const resources = STARTING_RESOURCES[difficulty];

    if (resources) {
      ['food', 'water', 'wood'].forEach(resource => {
        const span = button.querySelector(`.${resource} b`);
        if (span) span.textContent = `${resources[resource]} `;
      });
    }
  });
}

/**
 * Sets up event listeners for party action buttons.
 */
function setupPartyActions() {
  const partyContainer = document.getElementById('party-display');
  if (!partyContainer) {
    console.error('Party container not found');
    return;
  }

  partyContainer.addEventListener('click', handlePartyAction);
  console.log('Party actions setup complete');
}

/**
 * Handles click events on party action buttons.
 * @param {Event} event - The click event.
 */
function handlePartyAction(event) {
  const button = event.target.closest('button');
  if (button && !button.disabled) {
    const action = button.dataset.action;
    const personIndex = parseInt(button.dataset.person, 10);
    try {
      performAction(personIndex, action);
    } catch (error) {
      console.error('Error performing action:', error);
    }
  }
}

/**
 * Displays the game over screen with final stats.
 */
export function gameOver() {
  stopTime();
  showGameOverScreen();
  addLogEntry('Game Over! Everyone has died.', 'error');
}

function showGameOverScreen() {
  document.getElementById('game_start_screen').classList.add('hidden');
  document.getElementById('game_screen').classList.add('hidden');
  document.getElementById('game_over_screen').classList.remove('hidden');

  const gameOverContent = document.getElementById('game_over_content');
  const timePlayed = (gameState.day - 1) * 24 + gameState.hour;
  const hoursPlayed = Math.floor(timePlayed);
  const daysPlayed = Math.floor(hoursPlayed / 24);

  // Get achieved achievements
  const achievedAchievements = ACHIEVEMENTS.filter(achievement => gameState.achievements[achievement.id]);

  gameOverContent.innerHTML = `
    <div class="splash_screen">
      <div class="splash_header">
        <i data-lucide="skull" class="icon-large"></i>
        <div>
          <h1>${t('gameOver')}</h1>
        </div>
      </div>
      <div id="game_stats">
        <h2>
          <b>${t('timeSurvived')}</b>
          <span class="time">${daysPlayed} ${t('days')}, ${hoursPlayed % 24} ${t('hours')}</span>
        </h2>
        <div class="numbers">
          <p>${t('resources')}</p>
          <div class="resource-list">
            <div class="resource"><i data-lucide="beef" class="icon dark-yellow"></i><span>${Math.floor(gameState.totalResourcesGathered.food)}</span></div>
            <div class="resource"><i data-lucide="droplet" class="icon blue"></i><span>${Math.floor(gameState.totalResourcesGathered.water)}</span></div>
            <div class="resource"><i data-lucide="tree-pine" class="icon green"></i><span>${Math.floor(gameState.totalResourcesGathered.wood)}</span></div>
            <div class="resource"><i data-lucide="book" class="icon magenta"></i><span>${Math.floor(gameState.totalKnowledgePointsGained)}</span></div>
          </div>
        </div>
        <div class="achievements">
          <div class="achievement-list">
            ${achievedAchievements.map(achievement => `
              <div class="achievement-item">
                <div class="achievement-name">${t(achievement.id)}</div>
                <div class="achievement-description">${t(achievement.id + 'Desc')}</div>
              </div>
            `).join('')}
          </div>
          ${achievedAchievements.length === 0 ? `<p class="no-achievements">${t('noAchievements')}</p>` : ''}
        </div>
      </div>
      <button id="restart-game">${t('restartGame')}</button>
    </div>
  `;

  document.getElementById('restart-game').addEventListener('click', resetGame);
  createLucideIcons();
}

/**
 * Shows the game screen and hides others.
 */
function showGameScreen() {
  document.getElementById('game_start_screen').classList.add('hidden');
  document.getElementById('game_screen').classList.remove('hidden');
}

/**
 * Shows the start screen and hides others.
 */
function showStartScreen() {
  document.getElementById('game_screen').classList.add('hidden');
  document.getElementById('game_over_screen').classList.add('hidden');
  document.getElementById('game_start_screen').classList.remove('hidden');
}

/**
 * Resets the pause button icon to 'pause'.
 */
function resetPauseButton() {
  const pauseButton = document.getElementById('pause-game');
  const pauseIcon = pauseButton.querySelector('.icon');
  pauseIcon.setAttribute('data-lucide', 'pause');
  createLucideIcons();
}

/**
 * Initializes all unlocked modules based on the game state
 */
function initializeUnlockedModules() {
  if (gameState.upgrades.farming) {
    unlockSecondaryModule('farming-module');
    initializeFarming();
  }

  if (gameState.upgrades.well) {
    unlockSecondaryModule('well-module');
    initializeWell();
  }

  if (gameState.upgrades.huntingLodge) {
    unlockSecondaryModule('hunting-module');
    initializeHunting();
  }

  if (gameState.upgrades.lumberMill) {
    unlockSecondaryModule('lumber-mill-module');
    initializeLumberMill();
  }

  if (gameState.upgrades.watchtower) {
    unlockSecondaryModule('watchtower-module');
    initializeWatchtower();
  }

  // Initialize technology module if conditions are met
  if (gameState.day >= 10 || gameState.knowledgePoints >= 5) {
    // Add technology module to secondary modules if it doesn't exist
    if (!document.getElementById('technology-module')) {
      const secondaryModules = document.getElementById('secondary-modules');
      if (secondaryModules) {
        const techModule = document.createElement('section');
        techModule.id = 'technology-module';
        techModule.className = 'mystery';
        techModule.innerHTML = `
          <div class="icon"><i data-lucide="circle-help" class="icon gutter-grey"></i></div>
          <div class="title">Ancient Knowledge</div>
          <div class="description">What secrets await those who seek to understand?</div>
        `;
        secondaryModules.appendChild(techModule);
        createLucideIcons();
      }
    }

    showTechnologyModule(true);
    initializeTechnologies();
  }
}