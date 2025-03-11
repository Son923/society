// Import all language files
import { en } from './en.js';
import { vi } from './vi.js';

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
    
    const label = document.createElement('span');
    label.textContent = t('language') + ': ';
    selector.appendChild(label);
    
    // Add language options
    Object.keys(languages).forEach(langCode => {
      const langButton = document.createElement('button');
      langButton.textContent = t(langCode === 'en' ? 'english' : 'vietnamese');
      langButton.className = langCode === currentLanguage ? 'active' : '';
      langButton.onclick = () => {
        if (setLanguage(langCode)) {
          // Update active class
          document.querySelectorAll('#language-selector button').forEach(btn => {
            btn.className = btn.textContent === langButton.textContent ? 'active' : '';
          });
          // Apply translations
          applyTranslations();
        }
      };
      selector.appendChild(langButton);
    });
    
    // Add to the page - in the header next to the time module
    const timeModule = document.querySelector('.time-module');
    if (timeModule) {
      timeModule.parentNode.insertBefore(selector, timeModule);
    }
  }
}

// Listen for language change events
document.addEventListener('languageChanged', () => {
  applyTranslations();
}); 