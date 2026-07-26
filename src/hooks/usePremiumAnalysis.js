import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AGENTS_UI, PREMIUM_AGENT_IDS } from "../lib/agents";
import { startPremiumAnalysis, pollPremiumStatusOnce, isAbortError } from "../lib/premiumApi";
import { useAuth } from "../context/AuthContext";

// Fase 14 — port de runPremiumAnalysis()/startPremiumStatusPolling() do
// nexus-main pra um hook de estado React, contra o contrato REAL do
// wuzo-node-services (ver premiumApi.js). Timeout de 20min / poll a cada
// 4.5s — mesmos números do nexus-main (comentário original: "análise
// completa leva 12-13min sob carga normal"). DÉBITO DE CRÉDITO acontece no
// servidor assim que startPremiumAnalysis() responde com sucesso — não tem
// como desfazer isso do lado do cliente se o usuário fechar a aba depois.

const POLL_INTERVAL_MS = 4500;
const POLL_MAX_MS = 20 * 60 * 1000;
const MAX_TRIES = Math.ceil(POLL_MAX_MS / POLL_INTERVAL_MS);

function nowLabel() {
  return new Date().toLocaleTimeString("pt-BR");
}

export function usePremiumAnalysis() {
  const { t } = useTranslation();
  const { setCredits } = useAuth();

  const [phase, setPhase] = useState("idle"); // idle | pipeline | result
  const [alert, setAlertState] = useState(null);
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [agentStatus, setAgentStatus] = useState({});
  const [pipDone, setPipDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { verdict, agents }
  const [creditsRemaining, setCreditsRemaining] = useState(null);

  const cancelledRef = useRef(false);

  const showAlert = useCallback((cls, msg) => setAlertState({ cls, msg }), []);
  const hideAlert = useCallback(() => setAlertState(null), []);

  const addLog = useCallback((msg, cls) => {
    setLog((prev) => [...prev, { id: prev.length, cls: cls || "", text: `[${nowLabel()}] ${msg}` }]);
  }, []);

  const applyLiveAgents = useCallback((rawAgents) => {
    if (!Array.isArray(rawAgents) || !rawAgents.length) return;
    setAgentStatus((prev) => {
      const next = { ...prev };
      rawAgents.forEach((a) => {
        if (a && a.id) next[a.id] = "done";
      });
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setProgress(0);
    setLog([{ id: 0, cls: "", text: `[${nowLabel()}] ⬁ Iniciando análise premium...` }]);
    setAgentStatus(Object.fromEntries(PREMIUM_AGENT_IDS.map((id) => [id, "thinking"])));
    setPipDone(false);
    setResult(null);
  }, []);

  const run = useCallback(
    async (prompt, language = "pt") => {
      const txt = (prompt || "").trim();
      if (!txt || txt.length < 10) {
        showAlert("alert-info", t("err_describe"));
        return;
      }

      hideAlert();
      reset();
      setPhase("pipeline");
      setBusy(true);

      let analysisId;
      try {
        const started = await startPremiumAnalysis(txt, language);
        analysisId = started.analysisId;
        setCreditsRemaining(started.creditsRemaining);
        if (started.creditsRemaining != null) setCredits(started.creditsRemaining);
        addLog(t("log_fetching"));
      } catch (e) {
        setBusy(false);
        setPhase("idle");
        if (!isAbortError(e)) showAlert("alert-err", e.userMessage || "Erro na análise.");
        return;
      }

      for (let i = 0; i < MAX_TRIES; i++) {
        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
        if (cancelledRef.current) return;

        let httpStatus, data;
        try {
          ({ httpStatus, data } = await pollPremiumStatusOnce(analysisId));
        } catch {
          continue; // mesma tolerância do original: engole erro de rede transitório
        }

        if (data.agents) applyLiveAgents(data.agents);
        if (data.progress_pct != null) setProgress(Math.max(8, Math.min(96, data.progress_pct)));
        if (data.message && i % 4 === 0) addLog(data.message);

        if (httpStatus === 200 && data.status === "done") {
          setProgress(100);
          setAgentStatus(Object.fromEntries(PREMIUM_AGENT_IDS.map((id) => [id, "done"])));
          setPipDone(true);
          addLog(t("log_done") || "Concluído.", "ok");

          const agents = (data.agents || []).filter((a) => a.id !== "consultor_senior");
          setResult({ verdict: data.verdict || "", agents, wuzoScore: data.wuzo_score, analysisId: data.analysis_id });
          setPhase("result");
          setBusy(false);
          return;
        }

        if (httpStatus === 500 || data.status === "error") {
          setBusy(false);
          setPhase("idle");
          showAlert("alert-err", data.error || "Erro no processamento.");
          return;
        }
      }

      setBusy(false);
      setPhase("idle");
      showAlert("alert-err", "Tempo limite de 20 minutos excedido. Tente novamente.");
    },
    [t, showAlert, hideAlert, reset, addLog, applyLiveAgents]
  );

  return {
    phase,
    alert,
    progress,
    log,
    agentStatus,
    pipDone,
    busy,
    result,
    creditsRemaining,
    run,
    agentsUi: AGENTS_UI,
  };
}
