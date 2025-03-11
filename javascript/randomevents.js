import { gameState } from './settings.js';
import { addLogEntry } from './log.js';
import { updateGameState } from './game.js';
import { getIllnessChanceReduction } from './medicaltent.js';
import { increaseContentment, decreaseContentment } from './contentment.js';
import { t } from './translations/index.js';

const WHISPERS = [
  "The shadows grow longer...",
  "They're watching...",
  "The ground hungers...",
  "The air carries whispers of forgotten names...",
  "The trees remember...",
  "The water reflects faces that aren't there...",
  "Time is running out...",
  "The old ones stir in their slumber...",
  "The moon weeps blood...",
  "Forgotten rituals yearn to be performed...",
  "The wind carries the scent of decay...",
  "Shadows dance without light...",
  "The earth trembles with anticipation...",
  "Whispers of madness grow louder...",
  "The veil between worlds thins...",
  "Ancient symbols appear in the dust...",
  "The silence screams...",
  "Time flows backwards...",
  "Reality bends and warps...",
  "The abyss gazes back...",
  "Nightmares seep into waking hours...",
  "The boundaries of sanity blur...",
  "Forgotten gods demand tribute...",
  "The air grows thick with dread...",
  "Unseen eyes watch from every corner...",
  "The fabric of existence unravels...",
  "Echoes of unspoken words resonate...",
  "The stars align in impossible patterns...",
  "Memories of places never visited surface...",
  "The void between thoughts expands...",
  "Reflections move independently...",
  "Time becomes a tangible substance...",
  "The world breathes with malevolent intent...",
  "Shadows cast by nothing multiply...",
  "Reality's seams become visible...",
  "The weight of eternity presses down..."
];

const RANDOM_EVENTS = [
  { 
    name: "Rainstorm", 
    effect: (state) => { 
      state.water += 50; 
      return t('A sudden rainstorm replenished your water supply! (+{amount} 💧)', { amount: 50 }); 
    }, 
    type: "positive" 
  },
  {
    name: "Wild Animal Attack", 
    effect: (state) => {
      const victim = state.party[Math.floor(Math.random() * state.party.length)];
      victim.health -= 20;
      return t('{name} was attacked by a wild animal! (-20 health)', { name: victim.name });
    }, 
    type: "negative"
  },
  {
    name: "Food Spoilage", 
    effect: (state) => {
      const spoiled = Math.floor(state.food * 0.2);
      state.food -= spoiled;
      return t('Some of your food has spoiled! (-{amount} 🍖)', { amount: spoiled });
    }, 
    type: "negative"
  },
  {
    name: "Lucky Find", 
    effect: (state) => {
      const amount = Math.floor(Math.random() * 46) + 5; // Random number between 5 and 50
      state.food += amount;
      state.water += amount;
      return t('You found a hidden cache of supplies! (+{amount} 🍖, +{amount} 💧)', { amount });
    }, 
    type: "positive"
  },
  {
    name: "Windfall", 
    effect: (state) => {
      const woodAmount = Math.floor(Math.random() * 16) + 10; // Random amount between 10 and 25
      state.wood += woodAmount;
      return t('A fallen tree provided extra wood! (+{amount} 🪵)', { amount: woodAmount });
    }, 
    type: "positive"
  },
  {
    name: "Mysterious Illness", 
    effect: (state) => {
      const illnessChanceReduction = getIllnessChanceReduction();
      if (Math.random() > illnessChanceReduction) {
        state.party.forEach(person => {
          person.health = Math.max(0, person.health - 5);
          person.energy = Math.max(0, person.energy - 10);
        });
        return t('A mysterious illness affects everyone in the group! (-5 health, -10 energy for all)');
      }
      return t('A mysterious illness threatens the group, but the Medical Tent helps prevent its spread!');
    }, 
    type: "negative"
  },
  {
    name: "Morale Boost", 
    effect: (state) => {
      state.party.forEach(person => {
        person.energy = Math.min(person.traits.maxEnergy, person.energy + 20);
      });
      return t('A surge of hope boosts everyone\'s morale! (+20 energy for all)');
    }, 
    type: "positive"
  },
  {
    name: "Tool Breaking", 
    effect: (state) => {
      state.wood -= 10;
      return t('One of your tools broke! (-10 🪵)');
    }, 
    type: "negative"
  },
  {
    name: "Bountiful Harvest", 
    effect: (state) => {
      if (state.upgrades.farming) {
        const bonus = Math.floor(Math.random() * 30) + 20;
        state.food += bonus;
        return t('Your crops yielded an exceptional harvest! (+{amount} 🍖)', { amount: bonus });
      }
      return t('Your crops look healthy!');
    }, 
    type: "positive"
  },
  {
    name: "Water Contamination", 
    effect: (state) => {
      const lost = Math.floor(state.water * 0.3);
      state.water -= lost;
      return t('Some of your water got contaminated! (-{amount} 💧)', { amount: lost });
    }, 
    type: "negative"
  },
  {
    name: "Unexpected Visitor", effect: (state) => {
      const foodGain = Math.floor(Math.random() * 20) + 10;
      state.food += foodGain;
      return t('A friendly traveler shared some food with your group! (+{amount} 🍖)', { amount: foodGain });
    }, type: "positive"
  },
  {
    name: "Tool Upgrade", effect: (state) => {
      state.party.forEach(person => {
        person.traits.maxEnergy += 10;
      });
      return t('You\'ve found ways to improve your tools! (+10 max energy for all)');
    }, type: "positive"
  },
  {
    name: "Harsh Weather", effect: (state) => {
      state.party.forEach(person => {
        person.energy = Math.max(0, person.energy - 15);
      });
      return t('A spell of harsh weather has drained everyone\'s energy! (-15 energy for all)');
    }, type: "negative"
  },
  {
    name: "Natural Spring", effect: (state) => {
      const waterGain = Math.floor(Math.random() * 40) + 20;
      state.water += waterGain;
      return t('You\'ve discovered a natural spring! (+{amount} 💧)', { amount: waterGain });
    }, type: "positive"
  },
  {
    name: "Wildlife Stampede", effect: (state) => {
      const foodLoss = Math.floor(state.food * 0.15);
      state.food -= foodLoss;
      return t('A stampede of animals trampled some of your food stores! (-{amount} 🍖)', { amount: foodLoss });
    }, type: "negative"
  },
  {
    name: "Ancient Knowledge", effect: (state) => {
      if (state.upgrades.farming) {
        state.farming.maxCrops += 5;
        return t('You\'ve uncovered ancient farming techniques! (+5 max crop capacity)');
      }
      return t('You\'ve found some interesting old documents.');
    }, type: "positive"
  },
  {
    name: "Unexpected Frost", effect: (state) => {
      if (state.upgrades.farming) {
        state.farming.grid.forEach(row => {
          row.forEach(crop => {
            if (crop) crop.plantedAt += 12; // Delay growth
          });
        });
        return t('An unexpected frost has slowed the growth of your crops! (12 hour delay)');
      }
      return t('There was an unexpected frost last night.');
    }, type: "negative"
  },
  {
    name: "Community Spirit", effect: (state) => {
      const energyGain = 25;
      state.party.forEach(person => {
        person.energy = Math.min(person.traits.maxEnergy, person.energy + energyGain);
      });
      return t('A wave of community spirit energizes everyone! (+{amount} energy for all)', { amount: energyGain });
    }, type: "positive"
  },
  {
    name: "Tool Innovation", effect: (state) => {
      state.staminaPerAction = Math.max(5, state.staminaPerAction - 2);
      return t('You\'ve found a way to make your tools more efficient! (-2 stamina cost per action)');
    }, type: "positive"
  },
  {
    name: "Solar Flare", effect: (state) => {
      state.party.forEach(person => {
        person.energy = Math.max(0, person.energy - 20);
      });
      return t('A solar flare disrupts sleep patterns! (-20 energy for all)');
    }, type: "negative"
  },
  {
    name: "Meteor Shower", effect: (state) => {
      const resourceGain = Math.floor(Math.random() * 20) + 10;
      state.wood += resourceGain;
      state.food += resourceGain;
      return t('A meteor shower brings rare minerals! (+{amount} 🪵, +{amount} 🍖)', { amount: resourceGain });
    }, type: "positive"
  },
  {
    name: "Locust Swarm", effect: (state) => {
      if (state.upgrades.farming) {
        const foodLoss = Math.floor(state.food * 0.25);
        state.food -= foodLoss;
        return t('A locust swarm devours your crops! (-{amount} 🍖)', { amount: foodLoss });
      }
      return t('A locust swarm passes through the area.');
    }, type: "negative"
  },
  {
    name: "Inspiring Dream", effect: (state) => {
      const luckyPerson = state.party[Math.floor(Math.random() * state.party.length)];
      luckyPerson.traits.maxEnergy += 20;
      return t('{name} had an inspiring dream! (+20 max energy)', { name: luckyPerson.name });
    }, type: "positive"
  },
  {
    name: "Earthquake", effect: (state) => {
      const woodLoss = Math.floor(state.wood * 0.2);
      state.wood -= woodLoss;
      return t('An earthquake damages some structures! (-{amount} 🪵)', { amount: woodLoss });
    }, type: "negative"
  },
  {
    name: "Shooting Star", effect: (state) => {
      state.party.forEach(person => {
        person.health = Math.min(100, person.health + 10);
      });
      return t('A shooting star boosts everyone\'s spirits! (+10 health for all)');
    }, type: "positive"
  },
  {
    name: "Time Anomaly", effect: (state) => {
      const timeJump = Math.floor(Math.random() * 12) + 1;
      state.hour = (state.hour + timeJump) % 24;
      return t('A strange time anomaly occurs! ({amount} hours pass instantly)', { amount: timeJump });
    }, type: "neutral"
  },
  {
    name: "Alien Artifact", effect: (state) => {
      const randomPerson = state.party[Math.floor(Math.random() * state.party.length)];
      randomPerson.traits.maxEnergy += 30;
      randomPerson.health = 100;
      return t('{name} found an alien artifact! (+30 max energy, full health)', { name: randomPerson.name });
    }, type: "positive"
  },
  {
    name: "Cosmic Ray", effect: (state) => {
      const unluckyPerson = state.party[Math.floor(Math.random() * state.party.length)];
      unluckyPerson.health = Math.max(1, unluckyPerson.health - 30);
      return t('{name} was hit by a cosmic ray! (-30 health)', { name: unluckyPerson.name });
    }, type: "negative"
  },
  {
    name: "Quantum Fluctuation", 
    effect: (state) => {
      const resourceChange = Math.floor(Math.random() * 50) - 25; // -25 to +25
      state.food += resourceChange;
      state.water += resourceChange;
      state.wood += resourceChange;
      return t('A quantum fluctuation alters reality! ({sign}{amount} to all resources)', { 
        sign: resourceChange > 0 ? '+' : '', 
        amount: Math.abs(resourceChange) 
      });
    }, 
    type: "neutral"
  },
  {
    name: "Moment of Hope",
    effect: (state) => {
      increaseContentment(10, "moment of hope");
      return t('The party shares stories of better times, boosting everyone\'s spirits. (+10 contentment)');
    },
    type: "positive"
  },
  {
    name: "Successful Hunt",
    effect: (state) => {
      state.food += 30;
      increaseContentment(5, "successful hunt");
      return t('A successful hunt provides extra food and lifts the party\'s spirits! (+30 🥩, +5 contentment)');
    },
    type: "positive"
  },
  {
    name: "Beautiful Sunset",
    effect: (state) => {
      increaseContentment(8, "beautiful sunset");
      return t('A breathtaking sunset reminds everyone of the beauty still left in the world. (+8 contentment)');
    },
    type: "positive"
  },
  {
    name: "Grim Reminder",
    effect: (state) => {
      decreaseContentment(10, "grim reminder");
      return t('The party stumbles upon evidence of the apocalypse\'s devastation, dampening everyone\'s mood. (-10 contentment)');
    },
    type: "negative"
  },
  {
    name: "Argument",
    effect: (state) => {
      decreaseContentment(8, "party argument");
      return t('An argument breaks out among party members over dwindling resources. (-8 contentment)');
    },
    type: "negative"
  },
  {
    name: "Nightmare",
    effect: (state) => {
      decreaseContentment(5, "shared nightmare");
      return t('Several party members experience the same disturbing nightmare, leaving everyone on edge. (-5 contentment)');
    },
    type: "negative"
  },
  {
    name: "Found Supplies",
    effect: (state) => {
      state.food += 15;
      state.water += 15;
      state.wood += 15;
      increaseContentment(12, "found supplies");
      return t('The party discovers a cache of supplies hidden away! (+15 🥩, +15 💧, +15 🌲, +12 contentment)');
    },
    type: "positive"
  },
  {
    name: "Harsh Weather",
    effect: (state) => {
      state.wood -= 10;
      decreaseContentment(7, "harsh weather");
      return t('Harsh weather conditions force the party to burn extra wood for warmth and damages morale. (-10 🌲, -7 contentment)');
    },
    type: "negative"
  }
];

export function checkForRandomEvent() {
  const currentTime = gameState.hour + (gameState.day - 1) * 24;

  // Check if it's time for a new event (every 12 hours)
  if (currentTime >= gameState.nextEventTime) {
    // 25% chance for a whisper instead of a regular event
    if (Math.random() < 0.25) {
      const whisper = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
      const translatedWhisper = t(whisper);
      const formattedMessage = t('The Whispers: "{whisper}"', { whisper: translatedWhisper });
      addLogEntry(formattedMessage, 'whisper');
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
      const translatedEventName = t(event.name);
      const formattedMessage = t('Random Event: {eventName}. {message}', { eventName: translatedEventName, message: message });
      addLogEntry(formattedMessage, event.type);
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
  
  // Listen for language change events
  document.addEventListener('languageChanged', () => {
    // Random events don't have a persistent UI to update
    // But we can update any displayed event messages if needed in the future
  });
}