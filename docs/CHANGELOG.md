# Changelog

All notable changes to Society Fail will be documented in this file.

## [Unreleased]

## [2024-03-11]

### Added
- Vietnamese translations for party member status indicators:
  - "BUSY" → "BẬN"
  - "RESTING" → "ĐANG NGHỈ"
  - "DEAD" → "ĐÃ CHẾT"
- Vietnamese translation for death message: "has died due to exhaustion" → "đã chết vì kiệt sức"
- Vietnamese translations for farming-related content:
  - Crop names (wheat, carrot, bean)
  - Farming UI elements
  - Planting and harvesting messages
- English translations for party member status indicators and farming content
- Added missing translations for technology module:
  - Technology names and descriptions
  - Technology categories (Survival, Farming, Building, Medicine)
  - Research status messages
  - Research completion message
  - Research error messages

### Changed
- Changed default language from English to Vietnamese
- Updated `party.js` to use translation function for status indicators
- Updated `farming.js` to use translation function for all farming-related text
- Updated `technologies.js` to use translation function for all technology-related text
  - Modified TECHNOLOGIES object to use getters for dynamic translation
  - Updated research functions to use translated messages
- Updated `index.html` to use data-i18n attributes for technology module elements
- Updated documentation in `TRANSLATIONS.md` to reflect recent translation additions 