import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import idTranslations from './locales/id.json';
import enTranslations from './locales/en.json';

const savedLng = localStorage.getItem('i18nextLng') || 'id';

i18n.use(initReactI18next).init({
  resources: {
    id: { translation: idTranslations },
    en: { translation: enTranslations },
  },
  lng: savedLng,
  fallbackLng: 'id',
  interpolation: {
    escapeValue: false,
  },
});

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
});

export default i18n;
