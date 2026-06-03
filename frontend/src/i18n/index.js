import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import ta from './locales/ta.json';
import ml from './locales/ml.json';
import kn from './locales/kn.json';
import te from './locales/te.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ta: { translation: ta }, ml: { translation: ml },
                 kn: { translation: kn }, te: { translation: te }, hi: { translation: hi }, bn: { translation: bn } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

export default i18n;
