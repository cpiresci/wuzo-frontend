// Fase 12 — port de handleFree()/authHeader()/aborter()/_isAbortError() do
// nexus-main (index.html) contra POST /api/analyze/free + GET /api/job/free/:id
// (wuzo-node-services, Fase 9e-2 — mesmo contrato do Flask legado: sem
// wuzo_score no payload, ver freeAnalysisEngine.js/app.py).
import { BACKEND } from "./marketApi";
import { LS } from "./authApi";

function aborter(ms) {
  const c = new AbortController();
  setTimeout(() => {
    try {
      c.abort(new DOMException(`Request timed out after ${ms}ms`, "AbortError"));
    } catch {
      c.abort();
    }
  }, ms);
  return c.signal;
}

export function isAbortError(e) {
  if (!e) return false;
  if (e.name === "AbortError") return true;
  const m = (e.message || "").toLowerCase();
  return m.includes("abort") || m.includes("timeout") || m.includes("signal") || m.includes("timed out");
}

function authHeader() {
  const token = localStorage.getItem(LS.TOKEN) || "";
  return token
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { "Content-Type": "application/json" };
}

/** POST /api/analyze/free — devolve { job_id } ou lança com .userMessage pronto pra exibir. */
export async function startFreeAnalysis(prompt, language) {
  let res, data;
  try {
    res = await fetch(`${BACKEND}/api/analyze/free`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ prompt, language }),
      signal: aborter(15000),
    });
    data = await res.json().catch(() => ({}));
  } catch (e) {
    if (isAbortError(e)) throw e;
    const err = new Error(e.message);
    err.userMessage = `Erro: ${e.message}`;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(data.error || "Erro na analise.");
    err.userMessage = data.error || "Erro na analise.";
    throw err;
  }
  return data.job_id;
}

/** GET /api/job/free/:id — uma tentativa de polling (status: pending|running|done|error). */
export async function pollFreeJobOnce(jobId) {
  const res = await fetch(`${BACKEND}/api/job/free/${jobId}`, { signal: aborter(8000) });
  return res.json().catch(() => ({}));
}

/**
 * Extrai o Wuzo Score do payload. O backend (Node e Flask, ambos) nunca
 * calcula/devolve wuzo_score pro tier free — só o veredito em texto livre.
 * Port 1:1 da heurística do nexus-main: procura "NN/100" no texto do
 * veredito e cai pra 65 se não achar nada (mesmo comportamento visual de
 * sempre, não é regressão da migração).
 */
export function extractFreeScore(verdict) {
  if (verdict) {
    const m = String(verdict).match(/\b([4-9]\d|100)\/100\b/);
    if (m) return parseInt(m[1], 10);
  }
  return 65;
}
