import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import pt from './locales/pt/common.json';
import en from './locales/en/common.json';
import es from './locales/es/common.json';
import fr from './locales/fr/common.json';
import it from './locales/it/common.json';
import zh from './locales/zh/common.json';
import hi from './locales/hi/common.json';

const stored =
  typeof window !== 'undefined'
    ? (localStorage.getItem('lang') as string | null)
    : null;

const browserLang =
  typeof navigator !== 'undefined' && navigator.language
    ? navigator.language.split('-')[0]
    : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
      it: { translation: it },
      zh: { translation: zh },
      hi: { translation: hi },
    },
    lng: stored || browserLang,
    fallbackLng: 'en',
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
