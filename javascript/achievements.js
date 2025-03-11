import { gameState } from './settings.js';
import { addLogEntry } from './log.js';
import { createLucideIcons } from './utils.js';
import { UPGRADES } from './settings.js';
import { t } from './translations/index.js';

/**
 * Defines the list of achievements in the game.
 * Each achievement has an id, name, description, and a condition function.
 * @type {Array<Object>}
 */
export const ACHIEVEMENTS = [
  { id: 'survivor', condition: state => state.day >= 7 },
  { id: 'wellFed', condition: state => state.totalResourcesGathered.food >= 1000 },
  { id: 'hydrated', condition: state => state.totalResourcesGathered.water >= 1000 },
  { id: 'lumberjack', condition: state => state.totalResourcesGathered.wood >= 1000 },
  { id: 'farmer', condition: state => state.upgrades.farming },
  { id: 'hunter', condition: state => state.upgrades.huntingLodge },
  { id: 'wellDriller', condition: state => state.upgrades.well },
  { id: 'doctor', condition: state => state.upgrades.medicalTent },
  { id: 'toolMaker', condition: state => state.upgrades.toolWorkshop },
  { id: 'waterPurifier', condition: state => state.upgrades.waterPurification },
  { id: 'masterFarmer', condition: state => state.upgrades.advancedFarming },
  { id: 'bigFamily', condition: state => state.party.length >= 10 },
  { id: 'efficient', condition: state => state.totalActions >= 100 },
  { id: 'wellStocked', condition: state => state.food >= 500 && state.water >= 500 && state.wood >= 500 },
  { id: 'marathon', condition: state => state.totalPlayTime >= 24 * 60 * 60 },
  { id: 'cropMaster', condition: state => state.totalCropsHarvested >= 100 },
  { id: 'bigGame', condition: state => state.totalAnimalsHunted >= 50 },
  { id: 'waterWizard', condition: state => state.totalWellWaterCollected >= 1000 },
  { id: 'survivor30', condition: state => state.day >= 30 },
  { id: 'jackOfAllTrades', condition: state => Object.keys(UPGRADES).every(upgradeId => state.upgrades[upgradeId]) },
];

/**
 * Checks for newly unlocked achievements and unlocks them if conditions are met.
 */
export function checkAchievements() {
  ACHIEVEMENTS.forEach(achievement => {
    if (!gameState.achievements[achievement.id] && achievement.condition(gameState)) {
      unlockAchievement(achievement.id);
    }
  });
}

/**
 * Unlocks an achievement by its ID.
 * @param {string} achievementId - The ID of the achievement to unlock.
 */
function unlockAchievement(achievementId) {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (achievement) {
    gameState.achievements[achievementId] = true;
    addLogEntry(`${t('achievementUnlocked')}: ${t(achievementId)}!`, 'success');
    updateAchievementsUI();
  }
}

/**
 * Returns an array of unlocked achievements.
 * @returns {Array<Object>} An array of unlocked achievement objects.
 */
export function getUnlockedAchievements() {
  return ACHIEVEMENTS.filter(achievement => gameState.achievements[achievement.id]);
}

/**
 * Initializes the achievements in the game state.
 */
export function initializeAchievements() {
  gameState.achievements = gameState.achievements || {};
  ACHIEVEMENTS.forEach(achievement => {
    gameState.achievements[achievement.id] = gameState.achievements[achievement.id] || false;
  });
  updateAchievementsUI();
}

/**
 * Updates the achievements UI.
 */
export function updateAchievementsUI() {
  const achievementsContainer = document.getElementById('achievements');
  if (!achievementsContainer) return;

  achievementsContainer.innerHTML = ACHIEVEMENTS.map(createAchievementElement).join('');
  createLucideIcons();
}

/**
 * Creates an HTML element for an achievement.
 * @param {Object} achievement - The achievement object.
 * @returns {string} HTML string for the achievement element.
 */
function createAchievementElement(achievement) {
  const isUnlocked = gameState.achievements[achievement.id];
  return `
    <div class="achievement-item ${isUnlocked ? 'achievement-unlocked' : 'achievement-locked'}">
      <div class="achievement-icon">
        <i data-lucide="${isUnlocked ? 'check-circle' : 'circle'}" class="icon"></i>
      </div>
      <div class="achievement-info">
        <div class="achievement-name">${t(achievement.id)}</div>
        <div class="achievement-description">${t(achievement.id + 'Desc')}</div>
      </div>
    </div>
  `;
}