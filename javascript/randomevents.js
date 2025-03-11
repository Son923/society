import { gameState } from './settings.js';
import { addLogEntry } from './log.js';
import { updateGameState } from './game.js';
import { getIllnessChanceReduction } from './medicaltent.js';
import { increaseContentment, decreaseContentment } from './contentment.js';
import { log } from './log.js';
import { getPartyMembers, updatePartyMember } from './party.js';
import { updateResources } from './resources.js';
import { t } from './translations/index.js';

// Atmospheric whispers that appear randomly
export const WHISPERS = [
  { key: 'whisper1' },
  { key: 'whisper2' },
  { key: 'whisper3' },
  { key: 'whisper4' },
  { key: 'whisper5' },
  { key: 'whisper6' },
  { key: 'whisper7' },
  { key: 'whisper8' },
  { key: 'whisper9' },
  { key: 'whisper10' },
  { key: 'whisper11' },
  { key: 'whisper12' },
  { key: 'whisper13' },
  { key: 'whisper14' },
  { key: 'whisper15' },
  { key: 'whisper16' },
  { key: 'whisper17' },
  { key: 'whisper18' },
  { key: 'whisper19' },
  { key: 'whisper20' }
];

// Random events that can occur during gameplay
export const RANDOM_EVENTS = [
  {
    id: 'rainstorm',
    key: 'rainstormEvent',
    effect: () => {
      updateResources('water', 50);
    }
  },
  {
    id: 'wild_animal_attack',
    key: 'wildAnimalAttack',
    effect: () => {
      const partyMembers = getPartyMembers();
      if (partyMembers.length > 0) {
        const randomIndex = Math.floor(Math.random() * partyMembers.length);
        const targetMember = partyMembers[randomIndex];
        const healthLoss = Math.floor(Math.random() * 20) + 10;
        
        updatePartyMember(targetMember.id, {
          health: Math.max(targetMember.health - healthLoss, 1)
        });
        
        return targetMember.name;
      }
      return '';
    }
  },
  {
    id: 'food_spoilage',
    key: 'foodSpoilage',
    effect: () => {
      const foodLoss = Math.floor(Math.random() * 30) + 10;
      updateResources('food', -foodLoss);
    }
  },
  {
    id: 'unexpected_visitors',
    key: 'unexpectedVisitors',
    effect: () => {
      const resourceTypes = ['food', 'water', 'wood'];
      const randomResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
      const resourceGain = Math.floor(Math.random() * 30) + 20;
      updateResources(randomResource, resourceGain);
    }
  },
  {
    id: 'tool_breakage',
    key: 'toolBreakage',
    effect: () => {
      // Effect implemented in game.js with temporary gathering penalty
    }
  },
  {
    id: 'medicinal_herbs',
    key: 'medicinalHerbsFound',
    effect: () => {
      // Heal a random party member
      const partyMembers = getPartyMembers();
      if (partyMembers.length > 0) {
        const randomIndex = Math.floor(Math.random() * partyMembers.length);
        const targetMember = partyMembers[randomIndex];
        const healthGain = Math.floor(Math.random() * 15) + 10;
        
        updatePartyMember(targetMember.id, {
          health: Math.min(targetMember.health + healthGain, 100)
        });
      }
    }
  },
  {
    id: 'sickness_spreads',
    key: 'sicknessSpreads',
    effect: () => {
      const partyMembers = getPartyMembers();
      if (partyMembers.length > 0) {
        const randomIndex = Math.floor(Math.random() * partyMembers.length);
        const targetMember = partyMembers[randomIndex];
        
        updatePartyMember(targetMember.id, {
          health: Math.max(targetMember.health - 15, 1),
          energy: Math.max(targetMember.energy - 20, 1)
        });
        
        return targetMember.name;
      }
      return '';
    }
  }
];

// Create a random event and log it
export function createRandomEvent() {
  if (Math.random() < 0.3) {
    const randomEvent = RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
    const replacementValue = randomEvent.effect() || '';
    const message = t(randomEvent.key).replace('{0}', replacementValue);
    
    log(message, 'event');
  }
}

// Create a random whisper and log it
export function createWhisper() {
  if (Math.random() < 0.1) {
    const randomWhisper = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
    log(t(randomWhisper.key), 'whisper');
  }
}

export function checkForRandomEvent() {
  const currentTime = gameState.hour + (gameState.day - 1) * 24;

  // Check if it's time for a new event (every 12 hours)
  if (currentTime >= gameState.nextEventTime) {
    // 25% chance for a whisper instead of a regular event
    if (Math.random() < 0.25) {
      createWhisper();
    } else {
      // Select a single random event with higher chance for positive events
      const eventTypeRoll = Math.random();
      let event;
      if (eventTypeRoll < 0.6) { // 60% chance for positive event
        event = RANDOM_EVENTS.filter(e => e.type === 'positive')[Math.floor(Math.random() * RANDOM_EVENTS.filter(e => e.type === 'positive').length)];
      } else if (eventTypeRoll < 0.8) { // 20% chance for neutral event
        event = RANDOM_EVENTS.filter(e => e.type === 'neutral')[Math.floor(Math.random() * RANDOM_EVENTS.filter(e => e.type === 'neutral').length)];
      } else { // 20% chance for negative event
        event = RANDOM_EVENTS.filter(e => e.type === 'negative')[Math.floor(Math.random() * RANDOM_EVENTS.filter(e => e.type === 'negative').length)];
      }
      const message = event.effect(gameState);
      addLogEntry(`Random Event: ${event.name}. ${message}`, event.type);
    }

    // Set the next event time (between 12 and 24 hours from now)
    gameState.nextEventTime = currentTime + 12 + Math.floor(Math.random() * 12);

    // Update game state after the event
    updateGameState();
  }
}

export function initializeRandomEvents() {
  if (!gameState.nextEventTime) {
    const currentTime = gameState.hour + (gameState.day - 1) * 24;
    gameState.nextEventTime = currentTime + Math.floor(Math.random() * 12); // First event within 12 hours
  }
}