import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

/**
 * Fase 11c — port de #modal-login/#modal-register + doLogin()/doRegister()/
 * switchModal() do nexus-main. Um componente só alternando entre os dois
 * modos, igual ao par de overlays original mas sem duplicar markup.
 */
export default function AuthModal() {
  const { t } = useTranslation();
  const { modal, closeModal, openLogin, openRegister, login, register } = useAuth();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const passRef = useRef(null);

  const isLogin = modal === "login";
  const isRegister = modal === "register";

  // Reseta o formulário toda vez que o modal muda (abre num modo novo, ou fecha).
  useEffect(() => {
    setEmail("");
    setPass("");
    setErr("");
    setBusy(false);
  }, [modal]);

  if (!modal) return null;

  async function submit() {
    setErr("");
    if (!email.trim() || !pass) {
      setErr(isLogin ? t("err_login_fields") : t("err_reg_fields"));
      return;
    }
    if (isRegister && pass.length < 8) {
      setErr(t("err_reg_pass_len"));
      return;
    }
    setBusy(true);
    try {
      const res = isLogin ? await login(email.trim(), pass) : await register(email.trim(), pass);
      if (!res.ok) {
        // d.error vem do backend em texto puro (sem i18n do lado do servidor) — mesmo
        // comportamento do index.html original; fallback local cobre o caso sem error.
        setErr(res.error || t(isLogin ? "err_login_default" : "err_reg_default"));
      }
    } catch (e) {
      setErr(t("err_no_connection"));
    } finally {
      setBusy(false);
    }
  }

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) closeModal();
  }

  function switchTo(mode) {
    if (mode === "login") openLogin();
    else openRegister();
  }

  // {{link}} nas chaves login_switch/reg_switch é substituído por um sentinel
  // e depois trocado por um <a> real — mantém o texto todo traduzível
  // (inclusive a posição do link) sem precisar de <Trans> com child tags.
  const SENTINEL = "\u0000";
  function renderSwitchLine(key, linkKey, targetMode) {
    const raw = t(key, { link: SENTINEL });
    const [before, after] = raw.split(SENTINEL);
    return (
      <span>
        {before}
        <a onClick={() => switchTo(targetMode)}>{t(linkKey)}</a>
        {after}
      </span>
    );
  }

  return (
    <div className="modal-overlay open" onClick={handleOverlayClick}>
      <div className="modal-box">
        <button className="modal-close" onClick={closeModal} aria-label="close">
          ✕
        </button>
        <div className="modal-title">{isLogin ? t("modal_login_title") : t("modal_reg_title")}</div>

        <input
          className="modal-inp"
          type="email"
          placeholder={t("login_placeholder_email")}
          value={email}
          autoFocus
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") passRef.current?.focus();
          }}
        />
        <input
          ref={passRef}
          className="modal-inp"
          type="password"
          placeholder={isLogin ? t("login_placeholder_pass") : t("reg_placeholder_pass")}
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />

        <button className="modal-submit" onClick={submit} disabled={busy}>
          {busy ? t("btn_sending") : isLogin ? t("btn_login_sub") : t("btn_reg_sub")}
        </button>

        {err ? <div className="modal-err">{err}</div> : null}

        <div className="modal-switch">
          {isLogin
            ? renderSwitchLine("login_switch", "login_switch_link", "register")
            : renderSwitchLine("reg_switch", "reg_switch_link", "login")}
        </div>
      </div>
    </div>
  );
}
