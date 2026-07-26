import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AGENTS_UI, FREE_AGENT_IDS } from "../lib/agents";
import { startFreeAnalysis, pollFreeJobOnce, extractFreeScore, isAbortError } from "../lib/freeAnalysisApi";

// Fase 12 — port de handleFree()/resetPipeline()/animateProg()/addLog()/
// finishGrid()/renderFreeResult() do nexus-main pra um hook de estado React.
// Mesma lógica de polling (3s entre tentativas, 40 tentativas = 120s timeout),
// mesma barra de progresso "falsa" (sobe até 90% enquanto espera, pula pra
// 100% quando o job termina).

const MAX_TRIES = 40;
const POLL_INTERVAL_MS = 3000;
const PROGRESS_TICK_MS = 600;
const PROGRESS_STEP = 0.2;
const PROGRESS_CAP = 90;

function nowLabel() {
  return new Date().toLocaleTimeString("pt-BR");
}

export function useFreeAnalysis() {
  const { t } = useTranslation();

  const [phase, setPhase] = useState("idle"); // idle | pipeline | result
  const [prompt, setPrompt] = useState("");
  const [alert, setAlertState] = useState(null); // { cls, msg } | null
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [agentStatus, setAgentStatus] = useState({}); // id -> "thinking" | "done"
  const [pipDone, setPipDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { verdict, score }

  const progressTimerRef = useRef(null);
  const cancelledRef = useRef(false);

  const showAlert = useCallback((cls, msg) => setAlertState({ cls, msg }), []);
  const hideAlert = useCallback(() => setAlertState(null), []);

  const addLog = useCallback((msg, cls) => {
    setLog((prev) => [...prev, { id: prev.length, cls: cls || "", text: `[${nowLabel()}] ${msg}` }]);
  }, []);

  const stopProgressAnim = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgressAnim = useCallback(() => {
    stopProgressAnim();
    let pct = 0;
    progressTimerRef.current = setInterval(() => {
      pct = Math.min(pct + PROGRESS_STEP, PROGRESS_CAP);
      setProgress(pct);
    }, PROGRESS_TICK_MS);
  }, [stopProgressAnim]);

  const resetPipeline = useCallback(() => {
    cancelledRef.current = false;
    setProgress(0);
    setLog([{ id: 0, cls: "", text: "⬁ Iniciando..." }]);
    setAgentStatus({});
    setPipDone(false);
    setResult(null);
  }, []);

  const run = useCallback(async () => {
    const txt = prompt.trim();
    if (!txt) {
      showAlert("alert-info", t("err_describe"));
      return;
    }
    if (txt.length < 10) {
      showAlert("alert-info", t("err_describe"));
      return;
    }

    hideAlert();
    resetPipeline();
    setPhase("pipeline");
    setBusy(true);
    addLog(t("log_starting"));

    setAgentStatus(Object.fromEntries(FREE_AGENT_IDS.map((id) => [id, "thinking"])));
    startProgressAnim();

    let jobId;
    try {
      jobId = await startFreeAnalysis(txt, "pt");
      addLog(t("log_fetching"));
    } catch (e) {
      stopProgressAnim();
      setBusy(false);
      if (!isAbortError(e)) showAlert("alert-err", e.userMessage || "Erro na analise.");
      return;
    }

    for (let i = 0; i < MAX_TRIES; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      if (cancelledRef.current) return;

      let pd;
      try {
        pd = await pollFreeJobOnce(jobId);
      } catch {
        continue; // mesma tolerância do original: engole erro de rede e tenta de novo
      }

      if (pd.status === "done") {
        stopProgressAnim();
        setProgress(100);
        setAgentStatus(Object.fromEntries(FREE_AGENT_IDS.map((id) => [id, "done"])));
        setPipDone(true);
        addLog(t("log_done"), "ok");

        const score = extractFreeScore(pd.verdict);
        setResult({ verdict: pd.verdict || "", score });
        setPhase("result");
        setBusy(false);
        return;
      }

      if (pd.status === "error") {
        stopProgressAnim();
        setBusy(false);
        showAlert("alert-err", pd.message || "Erro.");
        return;
      }

      if (i % 4 === 0) addLog(`${t("log_processing")} (${(i + 1) * 3}s)`);
    }

    stopProgressAnim();
    setBusy(false);
    showAlert("alert-err", "Timeout. Tente novamente.");
  }, [prompt, t, showAlert, hideAlert, resetPipeline, addLog, startProgressAnim, stopProgressAnim]);

  return {
    phase,
    prompt,
    setPrompt,
    alert,
    progress,
    log,
    agentStatus,
    pipDone,
    busy,
    result,
    run,
    agentsUi: AGENTS_UI,
  };
}
