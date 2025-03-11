# Translation Guide for Society Game

## Overview
This document explains how to update and manage translations for the Society game. The game currently supports English (en) and Vietnamese (vi) languages, with Vietnamese set as the default language.

## Translation File Structure
The translation files are located in the `javascript/translations` directory:
- `en.js` - English translations
- `vi.js` - Vietnamese translations
- `index.js` - Translation system configuration

## Recent Updates

The following sections have been recently translated:

### Random Events (March 2024)
- Added translations for all random event names and messages
- Added translations for whispers
- Updated the random events system to use the translation function

### Tutorial Messages (March 2024)
- Added translations for all tutorial messages
- Updated the tutorial system to use the translation function

### Farming System (March 2024)
- Added translations for crop names (wheat, carrot, bean)
- Added translations for farming-related messages
- Updated the farming UI to display translated crop names and messages

### Technology System (March 2024)
- Added translations for technology names and descriptions
- Added translations for technology categories (Survival, Farming, Building, Medicine)
- Added translations for research status messages
- Added translations for research completion messages
- Updated the technology UI to display translated content

## How to Add or Update Translations

### 1. File Structure
Each translation file (`en.js` and `vi.js`) exports an object containing all the text strings used in the game. The structure includes:

```javascript
export default {
  // Game title and core elements
  gameTitle: "Society Fail",
  
  // Difficulty levels
  difficulty: {
    easy: "Easy",
    normal: "Normal",
    hard: "Hard"
  },
  
  // Resources
  resources: {
    food: "Food",
    water: "Water",
    // ...
  },
  
  // Actions
  actions: {
    gather: "Gather",
    hunt: "Hunt",
    // ...
  },
  
  // Party member status
  partyStatus: {
    busy: "Busy",
    resting: "Resting",
    // ...
  },
  
  // Technologies
  technologies: {
    improvedTools: "Improved Tools",
    waterPurification: "Water Purification",
    // ...
  },
  
  // Random events
  randomEvents: {
    // Event titles and descriptions
  },
  
  // Specializations
  specializations: {
    // Specialization names and descriptions
  },
  
  // Farming
  farming: {
    // Crop names and farming-related messages
  }
}
```

### 2. Adding New Translations

1. Open the relevant language file (`en.js` or `vi.js`)
2. Locate the appropriate section for your new text
3. Add your new translation key-value pair
4. Ensure you add the same key to ALL language files to maintain consistency

Example:
```javascript
// In en.js
export default {
  resources: {
    existingResource: "Existing Resource",
    newResource: "New Resource"  // New addition
  }
}

// In vi.js
export default {
  resources: {
    existingResource: "Tài nguyên hiện có",
    newResource: "Tài nguyên mới"  // New addition
  }
}
```

### 3. Updating Existing Translations

1. Find the text you want to update in the language files
2. Update the value while keeping the key the same
3. Make sure to update all language files to maintain consistency

### 4. Best Practices

1. **Maintain Structure**: Keep the same structure and keys across all language files
2. **Use Clear Keys**: Make translation keys descriptive and use camelCase
3. **Test Changes**: After updating translations, test the game in all supported languages
4. **Comments**: Add comments for complex or context-dependent translations
5. **Avoid Hard-coding**: Never hard-code text in the game code; always use translation keys
6. **Use Parameters**: For messages with variables, use the parameter format: `'Message with {variable}'` and pass the variable as a parameter to the translation function

### 5. Adding a New Language

To add support for a new language:

1. Create a new file in `javascript/translations` (e.g., `fr.js` for French)
2. Copy the structure from `en.js`
3. Translate all values while keeping the keys identical
4. Update `index.js` to include the new language

## Testing Translations

1. Run the game locally
2. Switch between different languages
3. Verify all text is properly translated
4. Check for missing translations
5. Ensure text fits within UI elements
6. Test special characters and different text lengths

## Common Issues and Solutions

1. **Missing Translations**: If a translation is missing, the game will fall back to English
2. **Text Overflow**: If translated text is too long, consider using abbreviations or adjusting the UI
3. **Special Characters**: Ensure proper encoding for special characters
4. **Parameter Formatting**: When using parameters in translations, make sure they are properly formatted in all language files

## Need Help?

If you encounter any issues or need assistance with translations:
1. Check existing translations for similar patterns
2. Review the game code where the translation is used
3. Create an issue in the project repository

Remember to commit your changes and push them to the appropriate branch after updating translations. 