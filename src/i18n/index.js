import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import pt from "./locales/pt.json";
import en from "./locales/en.json";
import es from "./locales/es.json";

// Fase 11b — porte do sistema I18N/t()/applyTranslations do nexus-main pra
// react-i18next. Mesma chave de localStorage ("wuzo_lang") usada pelo
// index.html antigo, então quem já tinha idioma salvo mantém a preferência
// na migração. Play Store é global: detecção automática por idioma do
// navegador/SO entra como segunda opção, antes do fallback pt.
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      en: { translation: en },
      es: { translation: es },
    },
    fallbackLng: "pt",
    supportedLngs: ["pt", "en", "es"],
    nonExplicitSupportedLngs: true, // "en-US" -> "en", "es-AR" -> "es" etc.
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "wuzo_lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false, // React já escapa por padrão
    },
  });

export default i18n;
