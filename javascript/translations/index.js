// Import all language files
import { en } from './en.js';
import { vi } from './vi.js';
import { createLucideIcons } from '../utils.js';

// Available languages
export const languages = {
  en,
  vi
};

// Default language
let currentLanguage = 'en';

// Try to load language preference from localStorage
try {
  const savedLanguage = localStorage.getItem('language');
  if (savedLanguage && languages[savedLanguage]) {
    currentLanguage = savedLanguage;
  }
} catch (e) {
  console.error('Error loading language preference:', e);
}

/**
 * Get translation for a key
 * @param {string} key - The translation key
 * @returns {string} - The translated text
 */
export function t(key) {
  const translations = languages[currentLanguage];
  return translations[key] || languages.en[key] || key;
}

/**
 * Change the current language
 * @param {string} lang - Language code (e.g., 'en', 'vi')
 */
export function setLanguage(lang) {
  if (languages[lang]) {
    currentLanguage = lang;
    try {
      localStorage.setItem('language', lang);
    } catch (e) {
      console.error('Error saving language preference:', e);
    }
    // Trigger a custom event that components can listen for
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
    return true;
  }
  return false;
}

/**
 * Get the current language code
 * @returns {string} - Current language code
 */
export function getCurrentLanguage() {
  return currentLanguage;
}

/**
 * Apply translations to the entire page
 */
export function applyTranslations() {
  // Update all elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = t(key);
  });
}

// Export a function to initialize language selector
export function initLanguageSelector() {
  // Create language selector if it doesn't exist
  if (!document.getElementById('language-selector')) {
    const selector = document.createElement('div');
    selector.id = 'language-selector';
    selector.className = 'language-selector';
    
    // Add globe icon instead of text label
    const icon = document.createElement('i');
    icon.setAttribute('data-lucide', 'globe');
    icon.className = 'icon';
    selector.appendChild(icon);
    
    // Create dropdown menu
    const dropdown = document.createElement('select');
    dropdown.className = 'language-dropdown';
    dropdown.title = t('language'); // Add tooltip
    
    // Add language options
    Object.keys(languages).forEach(langCode => {
      const option = document.createElement('option');
      option.value = langCode;
      option.textContent = langCode.toUpperCase(); // Just show language code
      option.selected = langCode === currentLanguage;
      dropdown.appendChild(option);
    });
    
    // Add change event listener
    dropdown.addEventListener('change', (e) => {
      if (setLanguage(e.target.value)) {
        applyTranslations();
      }
    });
    
    selector.appendChild(dropdown);
    
    // Add to the page - in the header next to the time module
    const timeModule = document.querySelector('.time-module');
    if (timeModule) {
      timeModule.parentNode.insertBefore(selector, timeModule);
    }

    // Create Lucide icons
    createLucideIcons();
  }
}

// Listen for language change events
document.addEventListener('languageChanged', () => {
  applyTranslations();
}); 