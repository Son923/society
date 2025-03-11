/*
  Specializations Module
  This module defines the different specializations that party members can have.
  Each specialization provides unique bonuses and abilities to party members.
*/

import { t } from './translations/index.js';

/**
 * Object containing all available specialization types for party members.
 * Each specialization has a unique bonus and description.
 */
export const SPECIALIZATIONS = {
  gatherer: {
    id: 'gatherer',
    nameKey: 'gatherer',
    descriptionKey: 'gathererDesc',
    icon: '🧺',
    resourceBonus: 0.25, // 25% bonus to resource gathering
    expeditionLootBonus: 0.1,
    specialAbility: "quickGathering" // 1-hour action for resources
  },
  builder: {
    id: 'builder',
    nameKey: 'builder',
    descriptionKey: 'builderDesc',
    icon: '🔨',
    woodCostReduction: 0.2, // 20% reduction in wood costs
    buildingQualityBonus: 0.1,
    specialAbility: "rapidConstruction" // Speed up current building
  },
  researcher: {
    id: 'researcher',
    nameKey: 'researcher',
    descriptionKey: 'researcherDesc',
    icon: '📚',
    knowledgePerHour: 0.5, // Generates 0.5 knowledge per hour
    researchSpeedBonus: 0.15,
    specialAbility: "insight" // Reveal random technology
  },
  fighter: {
    id: 'fighter',
    nameKey: 'fighter',
    descriptionKey: 'fighterDesc',
    icon: '⚔️',
    combatBonus: 0.25, // 25% bonus in combat
    expeditionRiskReduction: 0.1,
    specialAbility: "protect" // Reduce party damage in combat
  },
  medic: {
    id: 'medic',
    nameKey: 'medic',
    descriptionKey: 'medicDesc',
    icon: '🩹',
    medicineEffectiveness: 0.3, // 30% more effective medicine
    healthRegenPerDay: 2, // +2 health regen per day
    specialAbility: "emergencyTreatment" // Instant partial heal
  }
};

/**
 * Gets the specialization bonus for a specific resource type.
 * @param {string} specializationType - The type of specialization.
 * @param {string} resourceType - The type of resource.
 * @returns {number} The bonus multiplier for the resource.
 */
export function getSpecializationBonus(specializationType, resourceType) {
  if (specializationType === 'gatherer') {
    return 1 + SPECIALIZATIONS.gatherer.resourceBonus;
  }
  return 1;
}

/**
 * Applies the specialization effects to a party member.
 * @param {Object} partyMember - The party member to apply effects to.
 */
export function applySpecializationEffects(partyMember) {
  if (!partyMember.specialization) return;

  const specialization = SPECIALIZATIONS[partyMember.specialization];
  if (!specialization) return;

  // Apply health regeneration for medics
  if (partyMember.specialization === 'medic' && partyMember.health < 100) {
    const healthRegen = specialization.healthRegenPerDay / 24; // Per hour
    partyMember.health = Math.min(100, partyMember.health + healthRegen);
  }

  // Additional effects can be added here as the game expands
}

/**
 * Gets the wood cost reduction for buildings if the party member is a builder.
 * @param {Object} partyMember - The party member to check.
 * @returns {number} The reduction multiplier for wood costs.
 */
export function getWoodCostReduction(partyMember) {
  if (partyMember && partyMember.specialization === 'builder') {
    return 1 - SPECIALIZATIONS.builder.woodCostReduction;
  }
  return 1; // No reduction
}

/**
 * Gets the knowledge generation per hour if the party member is a researcher.
 * @param {Object} partyMember - The party member to check.
 * @returns {number} The amount of knowledge generated per hour.
 */
export function getKnowledgeGeneration(partyMember) {
  if (partyMember && partyMember.specialization === 'researcher') {
    return SPECIALIZATIONS.researcher.knowledgePerHour;
  }
  return 0;
}

/**
 * Gets the medicine effectiveness bonus if the party member is a medic.
 * @param {Object} partyMember - The party member to check.
 * @returns {number} The effectiveness multiplier for medicine.
 */
export function getMedicineEffectivenessBonus(partyMember) {
  if (partyMember && partyMember.specialization === 'medic') {
    return SPECIALIZATIONS.medic.medicineEffectiveness;
  }
  return 0;
}

/**
 * Gets the combat bonus if the party member is a fighter.
 * @param {Object} partyMember - The party member to check.
 * @returns {number} The effectiveness multiplier for combat.
 */
export function getCombatBonus(partyMember) {
  if (partyMember && partyMember.specialization === 'fighter') {
    return SPECIALIZATIONS.fighter.combatBonus;
  }
  return 0;
}

/**
 * Gets the display name for a specialization.
 * @param {string} specializationType - The type of specialization.
 * @returns {string} The display name of the specialization.
 */
export function getSpecializationName(specializationType) {
  const specialization = SPECIALIZATIONS[specializationType];
  return specialization ? t(specialization.nameKey) : '';
}

/**
 * Gets the description for a specialization.
 * @param {string} specializationType - The type of specialization.
 * @returns {string} The description of the specialization.
 */
export function getSpecializationDescription(specializationType) {
  const specialization = SPECIALIZATIONS[specializationType];
  return specialization ? t(specialization.descriptionKey) : '';
}

/**
 * Gets the icon for a specialization.
 * @param {string} specializationType - The type of specialization.
 * @returns {string} The icon of the specialization.
 */
export function getSpecializationIcon(specializationType) {
  const specialization = SPECIALIZATIONS[specializationType];
  return specialization ? specialization.icon : '';
}

/**
 * Creates a specialization selector UI for selecting a specialization.
 * @param {Object} partyMember - The party member to create the selector for.
 * @param {Function} onSelect - The callback function to call when a specialization is selected.
 * @returns {Element} The created specialization selector container.
 */
export function createSpecializationSelector(partyMember, onSelect) {
  const container = document.createElement('div');
  container.className = 'specialization-selector';
  
  const title = document.createElement('h3');
  title.textContent = t('selectSpecialization');
  container.appendChild(title);
  
  const subtitle = document.createElement('p');
  subtitle.textContent = t('chooseRole');
  container.appendChild(subtitle);
  
  const options = document.createElement('div');
  options.className = 'specialization-options';
  
  Object.values(SPECIALIZATIONS).forEach(spec => {
    const option = document.createElement('div');
    option.className = 'specialization-option';
    option.dataset.specialization = spec.id;
    
    const icon = document.createElement('span');
    icon.className = 'specialization-icon';
    icon.textContent = spec.icon;
    option.appendChild(icon);
    
    const info = document.createElement('div');
    info.className = 'specialization-info';
    
    const name = document.createElement('h4');
    name.textContent = t(spec.nameKey);
    info.appendChild(name);
    
    const description = document.createElement('p');
    description.textContent = t(spec.descriptionKey);
    info.appendChild(description);
    
    option.appendChild(info);
    
    option.addEventListener('click', () => {
      onSelect(spec.id);
      container.remove();
    });
    
    options.appendChild(option);
  });
  
  container.appendChild(options);
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = t('cancel');
  cancelButton.className = 'cancel-button';
  cancelButton.addEventListener('click', () => {
    container.remove();
  });
  
  container.appendChild(cancelButton);
  
  return container;
} 