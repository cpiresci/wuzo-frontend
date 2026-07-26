import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";

// Fase 12 — port de #sec-free / renderFreeResult() (nexus-main). O CTA de
// lock abre o cadastro (já portado na Fase 11c) quando não logado.
// Fase 14 — quando logado, chama onRequestPremium(prompt) de verdade
// (POST /api/analyze/premium — debita crédito no servidor). O checkout de
// créditos (Stripe) em si continua fora de escopo — isso é a Fase 11f.
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

function formatBold(line) {
  const parts = line.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => (i % 2 === 1 ? <b key={i}>{part}</b> : part));
}

function tagFor(score) {
  if (score < 40) return { cls: "svt-critico", text: "⚠ CARTEIRA EM RISCO" };
  if (score < 65) return { cls: "svt-atencao", text: "⚡ ATENÇÃO — PONTOS CRÍTICOS" };
  return { cls: "svt-bom", text: "✓ BOM — OTIMIZAÇÕES POSSÍVEIS" };
}

export default function FreeResult({ verdict, score, prompt, onRequestPremium }) {
  const { t } = useTranslation();
  const { isLoggedIn, openRegister } = useAuth();
  const [displayScore, setDisplayScore] = useState(0);
  const sectionRef = useRef(null);

  useEffect(() => {
    const duration = 1200;
    const step = 16;
    const inc = Math.ceil(score / (duration / step));
    let start = 0;
    const counter = setInterval(() => {
      start = Math.min(start + inc, score);
      setDisplayScore(start);
      if (start >= score) clearInterval(counter);
    }, step);
    return () => clearInterval(counter);
  }, [score]);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const tag = tagFor(score);
  const numCriticos = score < 40 ? 5 : score < 65 ? 3 : 2;
  const lockSub =
    score < 65
      ? `Seu Wuzo Score é <strong style='color:var(--g2)'>${score}/100</strong>. Os 14 especialistas restantes identificaram onde exatamente você está perdendo dinheiro — renda fixa, alocação, custos ocultos e oportunidades com dados de hoje.`
      : `Seu Wuzo Score é <strong style='color:var(--g2)'>${score}/100</strong>. Há otimizações relevantes identificadas pelos 14 especialistas restantes — alternativas com melhor rendimento nos seus ativos específicos, com dados ao vivo.`;

  function handlePremiumClick() {
    if (!isLoggedIn) {
      openRegister();
      return;
    }
    // Fase 14 — chamada real. Debita 1 crédito no servidor se der certo;
    // se não tiver crédito, onRequestPremium mostra o erro amigável (a
    // compra em si — Stripe checkout — ainda é a Fase 11f).
    onRequestPremium?.(prompt);
  }

  return (
    <div id="sec-free" ref={sectionRef}>
      <div className="verdict-card">
        <div className="verdict-title">{t("verdict_title")}</div>
        <div className="vline" />
        <div className="verdict-body">{formatVerdict(verdict)}</div>
      </div>

      <div className="score-reveal">
        <div>
          <span className="score-big">{displayScore}</span>
          <span className="score-denom">/100</span>
        </div>
        <div className="score-lbl">WUZO SCORE · SUA CARTEIRA</div>
        <div className="score-track">
          <div className="score-fill" style={{ width: `${score}%` }} />
        </div>
        <div className="score-range">
          <span>0 · crítico</span>
          <span>50 · atenção</span>
          <span>100 · ótimo</span>
        </div>
        <div className={`score-verdict-tag ${tag.cls}`}>{tag.text}</div>
      </div>

      <div className="lock-card">
        <div className="lock-icon">🔍</div>
        <div className="lock-title">Encontramos {numCriticos} pontos críticos na sua carteira</div>
        <div className="lock-sub" dangerouslySetInnerHTML={{ __html: lockSub }} />
        <button className="btn btn-premium" style={{ maxWidth: 400, margin: "0 auto" }} onClick={handlePremiumClick}>
          <span>{t("lock_btn")}</span>
        </button>
      </div>
    </div>
  );
}
