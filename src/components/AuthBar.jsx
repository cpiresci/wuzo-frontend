import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

/**
 * Fase 11c — port do bloco #auth-out/#auth-in + .credit-badge do nexus-main.
 * Painel admin (#admin-panel) fica de fora de propósito: é conteúdo da
 * Fase 11g (isolado, só usuário admin acessa), aqui só existe o dado
 * (`user.is_admin`) já disponível no context pra quando a 11g chegar.
 */
export default function AuthBar() {
  const { t } = useTranslation();
  const { user, ready, isLoggedIn, openLogin, openRegister, logout } = useAuth();

  // Antes do primeiro GET /me resolver, não pisca "Entrar/Registrar" pra
  // quem já tem sessão válida — evita o flash que o updateUI() original
  // também evitava (o auth-out só existe no HTML depois do primeiro paint,
  // aqui simplesmente não renderiza nada até `ready`).
  if (!ready) return null;

  return (
    <div className="auth-wrap">
      <div className="credit-badge">
        {t("credit_label")} <span>{isLoggedIn ? user.credits ?? 0 : 0}</span>
      </div>
      <div className="auth-bar">
        {isLoggedIn ? (
          <>
            <span id="user-info">{user.email}</span>
            <button className="abtn red" onClick={logout}>
              {t("btn_logout")}
            </button>
          </>
        ) : (
          <>
            <button className="abtn" onClick={openLogin}>
              {t("btn_login")}
            </button>
            <button className="abtn gold" onClick={openRegister}>
              {t("btn_register")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
