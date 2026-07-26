// Fase 14 — port de runPremiumAnalysis()/startPremiumStatusPolling() do
// nexus-main contra o contrato REAL do wuzo-node-services (lido direto de
// premiumAnalyzeRoutes.js + analysisStore.js/buildAnalysisStatusPayload,
// não da normalização defensiva do nexus-main, que existia pra tolerar o
// payload mais solto do Flask legado). Mais simples que o original porque
// o Node já devolve status/phase/agents/verdict/wuzo_score num formato
// único e estável.
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

/**
 * POST /api/analyze/premium — DEBITA 1 CRÉDITO NA HORA (atômico, servidor).
 * Não existe variante "de teste" sem custo: toda chamada bem-sucedida
 * consome crédito real, mesmo em dev. 402 = sem créditos (checkout ainda
 * não portado — Fase 11f — por isso vira erro amigável, não crash).
 */
export async function startPremiumAnalysis(prompt, language) {
  let res, data;
  try {
    res = await fetch(`${BACKEND}/api/analyze/premium`, {
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
  if (res.status === 402) {
    const err = new Error(data.error || "Sem creditos.");
    err.userMessage = "Você não tem créditos premium. A compra de créditos ainda não foi portada nesta versão.";
    err.noCredits = true;
    throw err;
  }
  if (!res.ok) {
    const err = new Error(data.error || "Erro ao iniciar análise premium.");
    err.userMessage = data.error || "Erro ao iniciar análise premium.";
    throw err;
  }
  return { analysisId: data.analysis_id, creditsRemaining: data.credits_remaining };
}

/**
 * GET /api/analysis_status/:id — uma tentativa de polling. Contrato real
 * (buildAnalysisStatusPayload): 202 enquanto roda (status ausente, só
 * `phase`/`message`/`agents` parciais), 200 com status:"done" ao concluir,
 * 500 com status:"error".
 */
export async function pollPremiumStatusOnce(analysisId) {
  const res = await fetch(`${BACKEND}/api/analysis_status/${analysisId}`, {
    headers: authHeader(),
    signal: aborter(10000),
  });
  const data = await res.json().catch(() => ({}));
  return { httpStatus: res.status, data };
}
