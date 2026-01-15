import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { useSettingsStore, type Language } from '../../stores/settingsStore';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
        title={currentLang.label}
      >
        <Globe size={16} />
        <span className="text-xs font-medium">{currentLang.flag}</span>
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={`
              w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors
              ${language === lang.code
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-700 hover:bg-gray-50'
              }
            `}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
