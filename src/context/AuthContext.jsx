import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { LS, login as apiLogin, register as apiRegister, fetchMe } from "../lib/authApi";

/**
 * Fase 11c — port de updateUI()/openModal()/closeModal()/switchModal()/logout()
 * do nexus-main pra um context React. Sem gate: a home continua acessível
 * sem login, igual ao index.html atual — esta fase só prova que
 * login/registro funcionam e a sessão persiste entre reloads.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false); // igual ao "primeiro updateUI() já rodou"
  const [modal, setModal] = useState(null); // null | "login" | "register"

  // Boot: valida o token salvo contra GET /me, igual ao updateUI() original.
  useEffect(() => {
    const token = localStorage.getItem(LS.TOKEN);
    if (!token) {
      setReady(true);
      return;
    }
    let cancelled = false;
    fetchMe(token)
      .then((d) => {
        if (cancelled) return;
        setUser(d);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e.status) {
          // resposta do servidor veio (401/403/etc) — token realmente inválido, desloga.
          localStorage.removeItem(LS.TOKEN);
          localStorage.removeItem(LS.EMAIL);
          setUser(null);
        } else {
          // erro de rede/timeout — mantém sessão local, igual ao catch do updateUI original,
          // só sem o "user-info" com e-mail cacheado (não temos credits/is_admin aqui pra fingir).
          setUser({ email: localStorage.getItem(LS.EMAIL) || "", credits: 0, is_admin: false, offline: true });
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await apiLogin(email, password);
    if (res.ok) {
      localStorage.setItem(LS.TOKEN, res.token);
      localStorage.setItem(LS.EMAIL, res.user.email || email);
      setUser(res.user);
      setModal(null);
    }
    return res;
  }, []);

  const register = useCallback(async (email, password) => {
    const res = await apiRegister(email, password);
    if (res.ok) {
      localStorage.setItem(LS.TOKEN, res.token);
      localStorage.setItem(LS.EMAIL, res.user.email || email);
      setUser(res.user);
      setModal(null);
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(LS.TOKEN);
    localStorage.removeItem(LS.EMAIL);
    setUser(null);
  }, []);

  // Fase 14 — POST /api/analyze/premium debita crédito no servidor e devolve
  // credits_remaining na resposta; isso atualiza o badge sem precisar
  // refazer GET /me. Não busca nada sozinho — só aceita o número que quem
  // chamou já tem em mãos.
  const setCredits = useCallback((n) => {
    setUser((prev) => (prev ? { ...prev, credits: n } : prev));
  }, []);

  const value = {
    user,
    ready,
    isLoggedIn: !!user,
    modal,
    openLogin: () => setModal("login"),
    openRegister: () => setModal("register"),
    closeModal: () => setModal(null),
    login,
    register,
    logout,
    setCredits,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth() precisa estar dentro de <AuthProvider>");
  return ctx;
}
