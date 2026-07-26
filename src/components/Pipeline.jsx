import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

// Fase 12 — port de #sec-pipeline / buildGrid() / addLog() / #pip-pill (nexus-main).
export default function Pipeline({ agentsUi, agentStatus, progress, log, done }) {
  const { t } = useTranslation();
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  return (
    <div className="card" id="sec-pipeline">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: ".6rem",
            letterSpacing: "2px",
            color: "rgba(212,168,67,.9)",
          }}
        >
          {t("pipeline_lbl")}
        </span>
        <span className={`pill ${done ? "pill-done" : "pill-run"}`}>{done ? t("pip_done") : t("pip_running")}</span>
      </div>

      <div className="agent-grid">
        {agentsUi.map((a) => {
          const st = agentStatus[a.id]; // undefined | "thinking" | "done"
          return (
            <div key={a.id} className={`ac ${st || ""}`}>
              <div className="ac-em">{a.em}</div>
              <div className="ac-nm">{a.nm}</div>
              <div className="ac-st">{st === "done" ? "✓" : "○"}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".58rem",
          color: "var(--g)",
          letterSpacing: "1px",
          marginBottom: 8,
          minHeight: 14,
        }}
      />

      <div className="prog">
        <div className="prog-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="log" ref={logRef}>
        {log.map((l) => (
          <div key={l.id} className={`ll ${l.cls}`}>
            {l.text}
          </div>
        ))}
      </div>
    </div>
  );
}
