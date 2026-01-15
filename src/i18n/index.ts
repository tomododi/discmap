import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import pl from './pl.json';

const resources = {
  en: { translation: en },
  pl: { translation: pl },
};

// Try to get the persisted language from localStorage
function getInitialLanguage(): string {
  try {
    const stored = localStorage.getItem('discmap-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings.state?.language) {
        return settings.state.language;
      }
    }
  } catch {
    // Ignore errors, use default
  }
  return 'pl'; // Default to Polish
}

i18n.use(initReactI18next).init({
  resources,
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
