// Fase 11c — port de doLogin/doRegister/updateUI (nexus-main index.html)
// contra /api/auth/{login,register,me} (Node, validado desde a Fase 8).
import { BACKEND } from "./marketApi";

// Mesmas chaves de localStorage do index.html antigo (LS.TOKEN/LS.EMAIL) —
// quem já tinha sessão salva mantém login na migração.
export const LS = {
  TOKEN: "wuzo_token",
  EMAIL: "wuzo_email",
};

function fetchWithTimeout(url, opts = {}, ms = 12000) {
  return Promise.race([
    fetch(url, opts),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

async function parseJsonSafe(r) {
  try {
    return await r.json();
  } catch {
    return {};
  }
}

/**
 * Normaliza a resposta de login/register: os dois endpoints devolvem um
 * objeto `user` no formato de userToDict() (auth.js do Node) — mesmo
 * shape usado por GET /me. Preferir esse objeto em vez dos campos soltos
 * no topo da resposta do /login mantém um único formato de "user" no
 * app inteiro.
 */
function normalizeAuthResponse(d, fallbackEmail) {
  const user = d.user || {
    email: d.email || fallbackEmail,
    credits: d.credits ?? 0,
    is_admin: !!d.is_admin,
  };
  return { token: d.token, user };
}

export async function login(email, password) {
  const r = await fetchWithTimeout(BACKEND + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const d = await parseJsonSafe(r);
  if (r.ok && d.token) return { ok: true, ...normalizeAuthResponse(d, email) };
  return { ok: false, error: d.error || null };
}

export async function register(email, password) {
  const r = await fetchWithTimeout(BACKEND + "/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const d = await parseJsonSafe(r);
  if (r.ok && d.token) return { ok: true, ...normalizeAuthResponse(d, email) };
  return { ok: false, error: d.error || null };
}

/** GET /api/auth/me — lança em caso de token inválido/erro de rede; quem chama decide o que fazer. */
export async function fetchMe(token) {
  const r = await fetchWithTimeout(
    BACKEND + "/api/auth/me",
    { headers: { Authorization: "Bearer " + token } },
    8000
  );
  if (!r.ok) {
    const err = new Error("me " + r.status);
    err.status = r.status;
    throw err;
  }
  return r.json();
}
