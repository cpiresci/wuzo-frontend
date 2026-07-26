import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AGENTS_UI, PREMIUM_AGENT_IDS } from "../lib/agents";
import { buildPremiumSample } from "../lib/premiumSample";

// Fase 13 — preview DEV-ONLY do grid+relatório premium. Não chama nenhum
// endpoint: anima o grid localmente (setTimeout escalonado, ~4.5s) e depois
// entrega o fixture de src/lib/premiumSample.js pro PremiumResult. Serve só
// pra validar visualmente o layout antes de ligar /api/analyze/premium de
// verdade (Fase 11e) — essa fase real ainda vai precisar do polling/SSE e
// do débito de crédito, que não existem aqui de propósito.

const STAGGER_MS = 260; // tempo entre cada agente virar "done"

function nowLabel() {
  return new Date().toLocaleTimeString("pt-BR");
}

export function usePremiumPreview() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState("idle"); // idle | pipeline | result
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [agentStatus, setAgentStatus] = useState({});
  const [pipDone, setPipDone] = useState(false);
  const [sample, setSample] = useState(null);

  const timersRef = useRef([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const addLog = useCallback((msg, cls) => {
    setLog((prev) => [...prev, { id: prev.length, cls: cls || "", text: `[${nowLabel()}] ${msg}` }]);
  }, []);

  const start = useCallback(() => {
    clearTimers();
    setPhase("pipeline");
    setProgress(0);
    setPipDone(false);
    setLog([{ id: 0, cls: "", text: `[${nowLabel()}] ⬁ Preview local — nenhuma chamada de rede.` }]);
    setAgentStatus(Object.fromEntries(PREMIUM_AGENT_IDS.map((id) => [id, "thinking"])));

    PREMIUM_AGENT_IDS.forEach((id, i) => {
      const tm = setTimeout(() => {
        setAgentStatus((prev) => ({ ...prev, [id]: "done" }));
        setProgress(Math.round(((i + 1) / PREMIUM_AGENT_IDS.length) * 100));
      }, STAGGER_MS * (i + 1));
      timersRef.current.push(tm);
    });

    const doneTm = setTimeout(() => {
      setPipDone(true);
      addLog(t("log_done") || "Concluído.", "ok");
      setSample(buildPremiumSample());
      setPhase("result");
    }, STAGGER_MS * (PREMIUM_AGENT_IDS.length + 2));
    timersRef.current.push(doneTm);
  }, [addLog, clearTimers, t]);

  const reset = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setSample(null);
  }, [clearTimers]);

  return { phase, progress, log, agentStatus, pipDone, sample, agentsUi: AGENTS_UI, start, reset };
}
