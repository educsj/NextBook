import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import pt from './pt.json';
import en from './en.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      pt: { translation: pt },
      en: { translation: en },
    },
    lng: 'pt',
    fallbackLng: 'pt',
    interpolation: { escapeValue: false },
  });

AsyncStorage.getItem('@nextbook_language').then((lang) => {
  if (lang && lang !== i18n.language) {
    i18n.changeLanguage(lang);
  }
});

export default i18n;
