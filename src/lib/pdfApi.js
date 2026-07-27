// Fase 11f-1 — porte de baixarRelatorioPDFJS() (nexus-main/wuzo_pdf_download.js,
// v1.2 "HFT Timeout Leak Fix") contra o contrato REAL de
// GET /api/report/pdf/:taskId (wuzo-node-services/pdfReportRoutes.js).
//
// Simplificação deliberada vs o original: wuzo-frontend não usa Capacitor
// (ver package.json — só React/Vite puro), então o caminho window.location.href
// exclusivo pro WebView nativo (bloqueio de CORS em capacitor://) não existe
// aqui — só o caminho web via fetch()+Blob é necessário.
//
// Mantido do original: [C1] checa Content-Type antes de criar o Blob (nunca
// salva JSON de erro como .pdf), [C2] uma única leitura do stream
// (arrayBuffer), [C3] onFinally sempre executado, [C5] aborta um download
// anterior antes de iniciar outro, [C7] timeout via AbortController próprio.
import { BACKEND } from "./marketApi";
import { LS } from "./authApi";

const PDF_TIMEOUT_MS = 90000;
const EXPECTED_MIME = "application/pdf";

let _activePdfController = null;
let _activePdfTimeoutId = null;

function isAbort(err) {
  if (!err) return false;
  if (err.name === "AbortError") return true;
  const m = (err.message || "").toLowerCase();
  return (
    m.includes("abort") || m.includes("timeout") || m.includes("timed out") ||
    m.includes("superseded") || m.includes("signal")
  );
}

function parseErrorFromBuffer(buffer) {
  try {
    const text = new TextDecoder("utf-8").decode(buffer);
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed.error === "string" && parsed.error.length > 0) return parsed.error;
    return null;
  } catch {
    return null;
  }
}

function triggerDownload(buffer, filename) {
  const blob = new Blob([buffer], { type: EXPECTED_MIME });
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(blobUrl), 250);
}

/**
 * downloadPremiumPdf({ analysisId, onFinally, onError, onSuccess })
 *
 * @param {number|string} analysisId - id de analysis_tasks (o mesmo usado no
 *   polling de GET /api/analysis_status/:id — NÃO o `analysis_id` que volta
 *   dentro do payload "done", que é sempre 0/quebrado; ver nota em
 *   usePremiumAnalysis.js).
 * @param {Function} [onFinally] - sempre chamado ao final (libera UI).
 * @param {Function} [onError] - chamado com string de mensagem de erro.
 * @param {Function} [onSuccess] - chamado com { filename, isFallback }.
 */
export async function downloadPremiumPdf({ analysisId, onFinally, onError, onSuccess }) {
  const _onFinally = typeof onFinally === "function" ? onFinally : () => {};
  const _onError = typeof onError === "function" ? onError : () => {};
  const _onSuccess = typeof onSuccess === "function" ? onSuccess : () => {};

  // [C5] Aborta download anterior (se houver) antes de iniciar este.
  if (_activePdfController) {
    try {
      _activePdfController.abort(new DOMException("Superseded by new PDF request", "AbortError"));
    } catch {
      try {
        _activePdfController.abort();
      } catch {
        /* noop */
      }
    }
    _activePdfController = null;
  }
  if (_activePdfTimeoutId !== null) {
    clearTimeout(_activePdfTimeoutId);
    _activePdfTimeoutId = null;
  }

  const ownController = new AbortController();
  _activePdfController = ownController;
  _activePdfTimeoutId = setTimeout(() => {
    try {
      ownController.abort(new DOMException(`PDF request timed out after ${PDF_TIMEOUT_MS}ms`, "AbortError"));
    } catch {
      ownController.abort();
    }
  }, PDF_TIMEOUT_MS);

  const token = localStorage.getItem(LS.TOKEN) || "";
  if (!analysisId) {
    clearTimeout(_activePdfTimeoutId);
    _activePdfTimeoutId = null;
    _activePdfController = null;
    _onError("ID da análise inválido.");
    _onFinally();
    return;
  }
  if (!token) {
    clearTimeout(_activePdfTimeoutId);
    _activePdfTimeoutId = null;
    _activePdfController = null;
    _onError("Sessão expirada. Faça login novamente.");
    _onFinally();
    return;
  }

  const pdfUrl = `${BACKEND}/api/report/pdf/${analysisId}`;
  const filename = `wuzo_relatorio_${analysisId}.pdf`;

  try {
    const response = await fetch(pdfUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: ownController.signal,
    });

    // [C2] leitura única do corpo, independente do status.
    const buffer = await response.arrayBuffer();

    if (!response.ok) {
      let msg = parseErrorFromBuffer(buffer);
      if (!msg) {
        if (response.status === 401) msg = "Sessão expirada. Faça login novamente.";
        else if (response.status === 404) msg = "Relatório não encontrado.";
        else if (response.status === 409) msg = "Relatório ainda não foi concluído.";
        else msg = `Erro HTTP ${response.status} ao gerar o PDF.`;
      }
      _onError(msg);
      return;
    }

    // [C1] valida Content-Type ANTES de criar o Blob.
    const contentType = (response.headers.get("Content-Type") || "").toLowerCase();
    if (!contentType.includes(EXPECTED_MIME)) {
      const mimeMsg = parseErrorFromBuffer(buffer);
      _onError(mimeMsg || `O servidor retornou um arquivo inválido (${contentType || "sem content-type"}). Tente novamente.`);
      return;
    }

    const isFallback = response.headers.get("X-Wuzo-Pdf-Fallback") === "1";
    triggerDownload(buffer, filename);
    _onSuccess({ filename, isFallback });
  } catch (err) {
    if (!isAbort(err)) {
      _onError(`Erro ao baixar PDF: ${err.message || "falha de rede."}`);
    }
  } finally {
    if (_activePdfTimeoutId !== null) {
      clearTimeout(_activePdfTimeoutId);
      _activePdfTimeoutId = null;
    }
    if (_activePdfController === ownController) {
      _activePdfController = null;
    }
    _onFinally();
  }
}
