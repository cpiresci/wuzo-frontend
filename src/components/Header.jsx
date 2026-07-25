import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";

/** Fase 11b — port do bloco .hdr do nexus-main. Sem credit-badge nem
 * auth-bar aqui de propósito: entram na 11c junto com login/registro. */
export default function Header() {
  const { t } = useTranslation();
  return (
    <div className="hdr">
      <div>
        <div className="logo">WUZO</div>
        <div className="logo-sub">{t("shell_tagline")}</div>
      </div>
      <div className="hdr-right">
        <LanguageSwitcher />
      </div>
    </div>
  );
}
