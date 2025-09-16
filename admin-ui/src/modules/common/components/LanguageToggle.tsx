import React, { useState, useEffect } from 'react';
import { useIntl } from 'react-intl';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import useLocalStorage from '../hooks/useLocalStorage';

const LanguageToggle = ({ narrowNav = false }) => {
  const { locale, formatMessage } = useIntl();
  const [isOpen, setIsOpen] = useState(false);
  const availableLocales = ['en', 'de'];

  const currentLanguage =
    availableLocales.find((loc) => loc === locale) || 'en';
  const [, setPreferredLanguage] = useLocalStorage(
    'preferred-language',
    currentLanguage,
  );

  const getLanguageDisplayName = (langCode: string): string => {
    const languageNames: Record<string, string> = {
      en: 'English',
      de: 'Deutsch',
    };

    return languageNames[langCode] || langCode.toUpperCase();
  };

  const changeLanguage = async (newLocale: string) => {
    try {
      setPreferredLanguage(newLocale);
      window.location.reload();

      setIsOpen(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-language-toggle]')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () =>
        document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" data-language-toggle>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 p-2 text-slate-600 dark:text-sky-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-800"
        title={formatMessage({
          id: 'change_language',
          defaultMessage: 'Change language',
        })}
      >
        <GlobeAltIcon className="h-6 w-6" />
      </button>

      {isOpen && (
        <div
          className={`absolute w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-[9999] ${
            narrowNav
              ? 'left-full ml-2 bottom-0'
              : 'right-0 md:left-full md:ml-2 md:bottom-full md:mb-2 mt-2 md:mt-0'
          }`}
        >
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200 dark:border-slate-700">
              {formatMessage({
                id: 'select_language',
                defaultMessage: 'Select Language',
              })}
            </div>
            {availableLocales.map((langCode) => (
              <button
                key={langCode}
                onClick={() => changeLanguage(langCode)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                  currentLanguage === langCode
                    ? 'bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-100 font-medium'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
                role="menuitem"
              >
                <div className="flex items-center justify-between">
                  <span>{getLanguageDisplayName(langCode)}</span>
                  {currentLanguage === langCode && (
                    <div className="h-2 w-2 rounded-full bg-slate-800"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;
