/*
  Specializations Module
  This module defines the different specializations that party members can have.
  Each specialization provides unique bonuses and abilities to party members.
*/

/**
 * Object containing all available specialization types for party members.
 * Each specialization has a unique bonus and description.
 */
export const specializationTypes = {
  gatherer: {
    id: "gatherer",
    name: "Gatherer",
    icon: "axe",
    description: "25% more resources from gathering actions",
    resourceBonus: 0.25,
    expeditionLootBonus: 0.1,
    specialAbility: "quickGathering" // 1-hour action for resources
  },
  builder: {
    id: "builder",
    name: "Builder",
    icon: "hammer",
    description: "20% reduced wood cost for buildings",
    woodCostReduction: 0.2,
    buildingQualityBonus: 0.1,
    specialAbility: "rapidConstruction" // Speed up current building
  },
  researcher: {
    id: "researcher",
    name: "Researcher",
    icon: "book",
    description: "Generates 0.5 knowledge points per hour",
    knowledgeGeneration: 0.5,
    researchSpeedBonus: 0.15,
    specialAbility: "insight" // Reveal random technology
  },
  fighter: {
    id: "fighter",
    name: "Fighter",
    icon: "sword",
    description: "25% more effective in combat",
    combatBonus: 0.25,
    expeditionRiskReduction: 0.1,
    specialAbility: "protect" // Reduce party damage in combat
  },
  medic: {
    id: "medic",
    name: "Medic",
    icon: "heart-pulse",
    description: "30% more effective medicine and +2 health regeneration per day",
    medicineEffectiveness: 0.3,
    healthRegeneration: 2,
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
  if (specializationType === "gatherer") {
    return 1.25; // 25% bonus to all resource gathering
  }
  return 1; // No bonus for other specializations or resource types
}

/**
 * Applies the specialization effects to a party member.
 * @param {Object} partyMember - The party member to apply effects to.
 */
export function applySpecializationEffects(partyMember) {
  if (!partyMember.specialization) return;

  const specialization = specializationTypes[partyMember.specialization];
  if (!specialization) return;

  // Apply health regeneration for medics
  if (partyMember.specialization === "medic" && partyMember.health < 100) {
    partyMember.health = Math.min(100, partyMember.health + specialization.healthRegeneration / 24); // Divide by 24 to get hourly rate
  }

  // Additional effects can be added here as the game expands
}

/**
 * Gets the wood cost reduction for buildings if the party member is a builder.
 * @param {Object} partyMember - The party member to check.
 * @returns {number} The reduction multiplier for wood costs.
 */
export function getWoodCostReduction(partyMember) {
  if (partyMember.specialization === "builder") {
    return 1 - specializationTypes.builder.woodCostReduction; // 20% reduction
  }
  return 1; // No reduction
}

/**
 * Gets the knowledge generation per hour if the party member is a researcher.
 * @param {Object} partyMember - The party member to check.
 * @returns {number} The amount of knowledge generated per hour.
 */
export function getKnowledgeGeneration(partyMember) {
  if (partyMember.specialization === "researcher") {
    return specializationTypes.researcher.knowledgeGeneration;
  }
  return 0;
} 