import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import AuthBar from "./AuthBar";

/** Fase 11b — port do bloco .hdr do nexus-main.
 * Fase 11c — credit-badge + auth-bar (login/registro/sessão) chegam aqui,
 * como já estava planejado no comentário original desta função. */
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
        <AuthBar />
      </div>
    </div>
  );
}
