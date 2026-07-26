import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { marked } from "marked";

// Fase 13 — port de #sec-full / renderFullReport() (nexus-main). Recebe
// { verdict, agents:[{id,emoji,name,analysis}] } já resolvido — não sabe (e
// não precisa saber) se veio do fixture de preview ou de uma análise real.
// PDF/share ficam como botões desabilitados: a ação em si (downloadPDF/
// generateShareImage) é a Fase 11f, fora de escopo aqui.
function formatBold(line) {
  const parts = line.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : part));
}

function formatVerdict(verdict) {
  return (verdict || "")
    .split("\n")
    .map((line, i) => (
      <span key={i}>
        {i > 0 && <br />}
        {formatBold(line)}
      </span>
    ));
}

function AgentBlock({ agent }) {
  const body = (agent.analysis || "").trim();
  const html = body
    ? marked.parse(body)
    : '<span style="color:var(--dm2)">Análise indisponível para este especialista.</span>';
  return (
    <div className="agent-block">
      <div className="agent-block-title">
        {agent.emoji} {agent.name}
      </div>
      <div className="agent-block-body" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

export default function PremiumResult({ verdict, agents }) {
  const { t } = useTranslation();
  const sectionRef = useRef(null);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div id="sec-full" ref={sectionRef}>
      <div className="verdict-card">
        <div className="verdict-title">{t("verdict_full_title")}</div>
        <div className="vline" />
        <div className="verdict-body">{formatVerdict(verdict)}</div>
      </div>

      <div id="agent-blocks-box">
        {(agents || []).map((a) => (
          <AgentBlock key={a.id} agent={a} />
        ))}
      </div>

      <div className="card" style={{ textAlign: "center", padding: 24 }}>
        <div style={{ color: "var(--g)", fontWeight: 800, fontSize: "1rem", marginBottom: 8 }}>{t("pdf_title")}</div>
        <div style={{ color: "var(--dm)", fontSize: ".82rem", marginBottom: 10 }}>{t("pdf_sub")}</div>
        <button className="btn btn-pdf" style={{ maxWidth: 300, margin: "0 auto" }} disabled title="Fase 11f">
          {t("btn_pdf_dl")}
        </button>
        <button
          className="btn btn-share"
          style={{
            maxWidth: 300,
            margin: "12px auto 0",
            background: "linear-gradient(135deg,#1a1a2e,#6a0dad)",
            color: "#fff",
          }}
          disabled
          title="Fase 11f"
        >
          📸 COMPARTILHAR NOS STORIES
        </button>
      </div>
    </div>
  );
}
