import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { marked } from "marked";
import { downloadPremiumPdf } from "../lib/pdfApi";

// Fase 13 — port de #sec-full / renderFullReport() (nexus-main). Recebe
// { verdict, agents:[{id,emoji,name,analysis}] } já resolvido — não sabe (e
// não precisa saber) se veio do fixture de preview ou de uma análise real.
// Fase 11f-1 — botão de PDF agora chama downloadPremiumPdf() de verdade
// (GET /api/report/pdf/:id). Botão de share (Stories) segue desabilitado —
// o motor de geração de imagem (html2canvas + score ring/gauge/network,
// ~400 linhas em generateShareImage() no nexus-main) é uma subfase própria,
// ainda não portada, pelo mesmo princípio de escopo fechado do resto do
// PROMPT_MASTER.
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

export default function PremiumResult({ verdict, agents, analysisId }) {
  const { t } = useTranslation();
  const sectionRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfMsg, setPdfMsg] = useState(null); // { ok:boolean, text:string }

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  function handleDownloadPdf() {
    if (pdfBusy) return;
    setPdfMsg(null);
    setPdfBusy(true);
    downloadPremiumPdf({
      analysisId,
      onFinally: () => setPdfBusy(false),
      onError: (msg) => setPdfMsg({ ok: false, text: msg }),
      onSuccess: ({ isFallback }) =>
        setPdfMsg({
          ok: true,
          text: isFallback
            ? "PDF baixado (relatório em reprocessamento — nenhum crédito debitado)."
            : "PDF baixado com sucesso!",
        }),
    });
  }

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
        <button
          className="btn btn-pdf"
          style={{ maxWidth: 300, margin: "0 auto" }}
          disabled={pdfBusy || !analysisId}
          onClick={handleDownloadPdf}
        >
          {pdfBusy ? t("btn_pdf_gen") : t("btn_pdf_dl")}
        </button>
        {pdfMsg && (
          <div
            style={{
              marginTop: 8,
              fontSize: ".8rem",
              color: pdfMsg.ok ? "var(--g)" : "#e5484d",
            }}
          >
            {pdfMsg.text}
          </div>
        )}
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
