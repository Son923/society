/**
 * Technologies Module
 * Handles the technology research tree system, which extends beyond the existing Upgrades system.
 * Technologies require knowledge points and time to research, unlike upgrades which apply immediately.
 */

import { gameState } from './settings.js';
import { updateGameState } from './game.js';
import { addLogEntry } from './log.js';
import { createLucideIcons } from './utils.js';
import { saveGameState } from './storage.js';
import { unlockSecondaryModule } from './upgrades.js';
import { t } from './translations/index.js';

/**
 * Technology definitions with their costs, research times, effects, and prerequisites
 */
export const TECHNOLOGIES = {
  improvedTools: {
    id: "improvedTools",
    name: "Improved Tools",
    knowledgeCost: 10,
    researchTime: 4, // hours
    effect: "Increase resource gathering by 20%",
    prerequisites: [],
    unlocked: false,
    researched: false,
    category: "survival",
    icon: "anvil"
  },
  advancedFarming: {
    id: "advancedFarming",
    name: "Advanced Farming",
    knowledgeCost: 25,
    researchTime: 8,
    effect: "50% more food from crops",
    prerequisites: ["improvedTools"],
    unlocked: false,
    researched: false,
    category: "farming",
    icon: "sprout"
  },
  waterPurification: {
    id: "waterPurification",
    name: "Water Purification",
    knowledgeCost: 25,
    researchTime: 8,
    effect: "20% less water consumption",
    prerequisites: ["improvedTools"],
    unlocked: false,
    researched: false,
    category: "survival",
    icon: "droplets"
  },
  betterConstruction: {
    id: "betterConstruction",
    name: "Better Construction",
    knowledgeCost: 30,
    researchTime: 12,
    effect: "Buildings cost 25% less wood",
    prerequisites: ["improvedTools"],
    unlocked: false,
    researched: false,
    category: "building",
    icon: "hammer"
  },
  medicinalHerbs: {
    id: "medicinalHerbs",
    name: "Medicinal Herbs",
    knowledgeCost: 40,
    researchTime: 16,
    effect: "Party members heal 5% health per day",
    prerequisites: ["advancedFarming"],
    unlocked: false,
    researched: false,
    category: "medicine",
    icon: "leaf"
  }
};

/**
 * Initializes the technology system
 */
export function initializeTechnologies() {
  // Initialize technologies in gameState if not already present
  if (!gameState.technologies) {
    gameState.technologies = {};
  }

  // Initialize activeResearch if not already present
  if (!gameState.activeResearch) {
    gameState.activeResearch = null;
  }

  // Check which technologies should be unlocked based on prerequisites
  checkTechnologyAvailability();

  // Update the UI
  updateTechnologiesUI();
}

/**
 * Starts research on a technology
 * @param {string} techId - The ID of the technology to research
 */
export function startResearch(techId) {
  const tech = TECHNOLOGIES[techId];

  // Check if the technology exists and is not already researched
  if (!tech || gameState.technologies[techId]?.researched) {
    return;
  }

  // Check if another research is already in progress
  if (gameState.activeResearch) {
    addLogEntry(`Cannot start research on ${tech.name}. Another research is already in progress.`, 'error');
    return;
  }

  // Check if the player can afford the knowledge cost
  if (gameState.knowledgePoints < tech.knowledgeCost) {
    addLogEntry(`Not enough knowledge points to research ${tech.name}.`, 'error');
    return;
  }

  // Deduct the knowledge cost
  gameState.knowledgePoints -= tech.knowledgeCost;

  // Initialize the technology in gameState if not already present
  if (!gameState.technologies[techId]) {
    gameState.technologies[techId] = {
      progress: 0,
      researched: false
    };
  }

  // Set as active research
  gameState.activeResearch = {
    id: techId,
    startTime: gameState.day * 24 + gameState.hour,
    totalTime: tech.researchTime
  };

  addLogEntry(`Started research on ${tech.name}.`, 'success');
  updateGameState();
  updateTechnologiesUI();
  saveGameState();
}

/**
 * Updates research progress during game ticks
 */
export function updateResearchProgress() {
  if (!gameState.activeResearch) {
    return;
  }

  const techId = gameState.activeResearch.id;
  const tech = TECHNOLOGIES[techId];

  if (!tech) {
    gameState.activeResearch = null;
    return;
  }

  // Calculate current progress
  const currentTime = gameState.day * 24 + gameState.hour;
  const elapsedTime = currentTime - gameState.activeResearch.startTime;
  const progress = Math.min(elapsedTime / tech.researchTime, 1);

  // Update progress in gameState
  gameState.technologies[techId].progress = progress;

  // Check if research is complete
  if (progress >= 1) {
    completeResearch(techId);
  }
}

/**
 * Completes research on a technology and applies its effects
 * @param {string} techId - The ID of the technology to complete
 */
export function completeResearch(techId) {
  const tech = TECHNOLOGIES[techId];

  if (!tech) {
    return;
  }

  // Mark as researched
  gameState.technologies[techId].researched = true;
  gameState.technologies[techId].progress = 1;

  // Clear active research
  gameState.activeResearch = null;

  // Apply technology effects
  applyTechnologyEffects(techId);

  // Check for newly available technologies
  checkTechnologyAvailability();

  addLogEntry(`Research complete: ${tech.name}`, 'success');
  updateGameState();
  updateTechnologiesUI();
  saveGameState();
}

/**
 * Checks which technologies should be available based on prerequisites
 */
export function checkTechnologyAvailability() {
  for (const techId in TECHNOLOGIES) {
    const tech = TECHNOLOGIES[techId];

    // Skip if already unlocked
    if (tech.unlocked) {
      continue;
    }

    // Check prerequisites
    let allPrerequisitesMet = true;
    for (const prereqId of tech.prerequisites) {
      if (!gameState.technologies[prereqId]?.researched) {
        allPrerequisitesMet = false;
        break;
      }
    }

    // Unlock if all prerequisites are met
    if (allPrerequisitesMet) {
      tech.unlocked = true;
    }
  }
}

/**
 * Applies the effects of a researched technology
 * @param {string} techId - The ID of the technology to apply
 */
export function applyTechnologyEffects(techId) {
  switch (techId) {
    case 'improvedTools':
      // Increase resource gathering efficiency by 20%
      gameState.resourceEfficiency *= 1.2;
      break;
    case 'advancedFarming':
      // 50% more food from crops - will be handled in farming.js
      break;
    case 'waterPurification':
      // 20% less water consumption
      gameState.waterPurificationActive = true;
      break;
    case 'betterConstruction':
      // 25% less wood cost for buildings - will be applied when calculating costs
      break;
    case 'medicinalHerbs':
      // Party members heal 5% health per day - will be applied in updatePartyStats
      break;
  }
}

/**
 * Updates the technologies UI
 */
export function updateTechnologiesUI() {
  const techModule = document.getElementById('technology-module');
  if (!techModule) return;

  // Clear existing content
  const moduleContent = techModule.querySelector('.module-content');
  if (!moduleContent) return;
  moduleContent.innerHTML = '';

  // Create category filters
  const categories = [...new Set(Object.values(TECHNOLOGIES).map(tech => tech.category))];
  const filterContainer = document.createElement('div');
  filterContainer.className = 'tech-category-filters';

  // Add "All" filter
  const allFilter = document.createElement('button');
  allFilter.textContent = t('all');
  allFilter.className = 'active';
  allFilter.dataset.category = 'all';
  filterContainer.appendChild(allFilter);

  // Add category filters
  categories.forEach(category => {
    const filter = document.createElement('button');
    filter.textContent = t(category);
    filter.dataset.category = category;
    filterContainer.appendChild(filter);
  });

  moduleContent.appendChild(filterContainer);

  // Add active research section if there is one
  if (gameState.activeResearch) {
    const activeResearchId = gameState.activeResearch.id;
    const activeTech = TECHNOLOGIES[activeResearchId];
    
    const activeResearchSection = document.createElement('div');
    activeResearchSection.className = 'active-research';
    
    const progressPercent = Math.min(100, Math.floor((gameState.activeResearch.progress / activeTech.researchTime) * 100));
    
    activeResearchSection.innerHTML = `
      <h3>${t('research')} ${t('inProgress')}</h3>
      <div class="research-item">
        <div class="research-icon">
          <i data-lucide="${activeTech.icon}" class="icon"></i>
        </div>
        <div class="research-details">
          <div class="research-name">${t(activeTech.id) || activeTech.name}</div>
          <div class="research-progress">
            <div class="progress-bar">
              <div class="progress" style="width: ${progressPercent}%"></div>
            </div>
            <span>${progressPercent}%</span>
          </div>
          <div class="research-time">${t('timeRemaining')}: ${Math.ceil(activeTech.researchTime - gameState.activeResearch.progress)} ${t('hours')}</div>
        </div>
      </div>
    `;
    
    moduleContent.appendChild(activeResearchSection);
  }

  // Create available technologies section
  const availableTechSection = document.createElement('div');
  availableTechSection.className = 'available-technologies';
  availableTechSection.innerHTML = `<h3>${t('availableTechnologies')}</h3>`;
  
  const availableTechList = document.createElement('div');
  availableTechList.className = 'tech-list';
  
  // Filter technologies by selected category
  const selectedCategory = document.querySelector('.tech-category-filters button.active')?.dataset.category || 'all';
  
  // Get available technologies
  const availableTechs = Object.values(TECHNOLOGIES).filter(tech => 
    tech.unlocked && !tech.researched && 
    (selectedCategory === 'all' || tech.category === selectedCategory)
  );
  
  if (availableTechs.length === 0) {
    availableTechList.innerHTML = `<p class="no-techs">${t('noAvailableTechnologies')}</p>`;
  } else {
    availableTechs.forEach(tech => {
      const techItem = document.createElement('div');
      techItem.className = 'tech-item';
      techItem.dataset.techId = tech.id;
      
      const canResearch = gameState.knowledge >= tech.knowledgeCost && !gameState.activeResearch;
      
      techItem.innerHTML = `
        <div class="tech-icon">
          <i data-lucide="${tech.icon}" class="icon ${canResearch ? '' : 'disabled'}"></i>
        </div>
        <div class="tech-details">
          <div class="tech-name">${t(tech.id) || tech.name}</div>
          <div class="tech-effect">${t(tech.id + 'Desc') || tech.effect}</div>
          <div class="tech-cost">
            <span>${t('requires')}: ${tech.knowledgeCost} <i data-lucide="book" class="icon magenta"></i></span>
            <span>${tech.researchTime} ${t('hours')}</span>
          </div>
        </div>
        <button class="research-button" data-tech-id="${tech.id}" ${canResearch ? '' : 'disabled'}>
          ${t('research')}
        </button>
      `;
      
      availableTechList.appendChild(techItem);
    });
  }
  
  availableTechSection.appendChild(availableTechList);
  moduleContent.appendChild(availableTechSection);
  
  // Create locked technologies section
  const lockedTechSection = document.createElement('div');
  lockedTechSection.className = 'locked-technologies';
  lockedTechSection.innerHTML = `<h3>${t('lockedTechnologies')}</h3>`;
  
  const lockedTechList = document.createElement('div');
  lockedTechList.className = 'tech-list';
  
  // Get locked technologies
  const lockedTechs = Object.values(TECHNOLOGIES).filter(tech => 
    !tech.unlocked && !tech.researched && 
    (selectedCategory === 'all' || tech.category === selectedCategory)
  );
  
  if (lockedTechs.length === 0) {
    lockedTechList.innerHTML = `<p class="no-techs">${t('noLockedTechnologies')}</p>`;
  } else {
    lockedTechs.forEach(tech => {
      const techItem = document.createElement('div');
      techItem.className = 'tech-item locked';
      
      techItem.innerHTML = `
        <div class="tech-icon">
          <i data-lucide="${tech.icon}" class="icon disabled"></i>
        </div>
        <div class="tech-details">
          <div class="tech-name">${t(tech.id) || tech.name}</div>
          <div class="tech-effect">${t(tech.id + 'Desc') || tech.effect}</div>
          <div class="tech-requirements">
            <span>${t('requires')}: ${t('improvedTools')}</span>
          </div>
        </div>
        <div class="locked-indicator">
          <i data-lucide="lock" class="icon"></i>
        </div>
      `;
      
      lockedTechList.appendChild(techItem);
    });
  }
  
  lockedTechSection.appendChild(lockedTechList);
  moduleContent.appendChild(lockedTechSection);
  
  // Add event listeners to category filters
  document.querySelectorAll('.tech-category-filters button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tech-category-filters button').forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      updateTechnologiesUI();
    });
  });
  
  // Add event listeners to research buttons
  document.querySelectorAll('.research-button').forEach(button => {
    button.addEventListener('click', () => {
      const techId = button.dataset.techId;
      startResearch(techId);
    });
  });
  
  // Create Lucide icons
  createLucideIcons();
}

/**
 * Shows the technology module after a specific game milestone
 * @param {boolean} show - Whether to show the module
 */
export function showTechnologyModule(show = true) {
  const techModule = document.getElementById('technology-module');
  if (!techModule) return;

  if (show) {
    techModule.classList.remove('mystery');
    techModule.innerHTML = `
      <div class="tech-header">
        <h2 class="collapsible"><i data-lucide="microscope" class="icon-dark"></i> Technologies <i data-lucide="chevron-up" class="toggle-icon"></i></h2>
      </div>
      <div class="module-content tech-content"></div>
    `;
    updateTechnologiesUI();
  } else {
    techModule.classList.add('mystery');
    techModule.innerHTML = `
      <div class="mystery-content">
        <div class="icon"><i data-lucide="circle-help" class="icon gutter-grey"></i></div>
        <div class="title">Ancient Knowledge</div>
        <div class="description">What secrets await those who seek to understand?</div>
      </div>
    `;
  }

  createLucideIcons();
} 