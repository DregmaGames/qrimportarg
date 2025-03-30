import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, Globe } from 'lucide-react';

function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('settings.title')}
        </h2>

        <div className="space-y-8">
          {/* Theme Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('settings.theme.title')}
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  theme === 'light'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <Sun className="w-5 h-5 mr-2" />
                {t('settings.theme.light')}
              </button>
              <button
                onClick={toggleTheme}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <Moon className="w-5 h-5 mr-2" />
                {t('settings.theme.dark')}
              </button>
            </div>
          </div>

          {/* Language Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              {t('settings.language.title')}
            </h3>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleLanguageChange('es')}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  i18n.language === 'es'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <Globe className="w-5 h-5 mr-2" />
                {t('settings.language.spanish')}
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                  i18n.language === 'en'
                    ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <Globe className="w-5 h-5 mr-2" />
                {t('settings.language.english')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;