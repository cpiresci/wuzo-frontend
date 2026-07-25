import { useTranslation } from "react-i18next";

const LANGS = ["pt", "en", "es"];

/** Fase 11b — port de setLang()/#lang-pt/en/es. Troca via i18next, que já
 * persiste em localStorage("wuzo_lang") pelo detector configurado em i18n/index.js. */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || "pt";

  return (
    <div className="lang-selector">
      {LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          className={"lang-btn" + (current === lng ? " active" : "")}
          onClick={() => i18n.changeLanguage(lng)}
        >
          {lng.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
