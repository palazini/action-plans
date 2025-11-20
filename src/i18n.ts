// src/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt/common.json';
import en from './locales/en/common.json';

const stored =
  typeof window !== 'undefined'
    ? (localStorage.getItem('lang') as 'pt' | 'en' | null)
    : null;

const browserLang =
  typeof navigator !== 'undefined' && navigator.language
    ? navigator.language.startsWith('en')
      ? 'en'
      : 'pt'
    : 'pt';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    lng: stored || browserLang,
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
  })
  .then(() => {
    // noop
  });

i18n.on('languageChanged', (lng) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lang', lng);
  }
});

export default i18n;
