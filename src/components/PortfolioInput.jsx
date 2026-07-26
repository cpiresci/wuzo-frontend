import { useState } from "react";
import { useTranslation } from "react-i18next";

// Fase 12 — port de #card-input / addChip() / #char-count-hint (nexus-main).
// Escopo desta fase: só o botão de análise GRATUITA. btn-premium/btn-buy
// (checkout, créditos) ficam pra próxima fase — não renderizamos botões
// que ainda não fazem nada.
const CHIPS = [
  { label: "+ AAPL", text: "AAPL 50 shares" },
  { label: "+ NVDA", text: "NVDA 30 shares" },
  { label: "+ BTC", text: "BTC 0.5" },
  { label: "+ ETH", text: "ETH 2.0" },
  { label: "+ SPY", text: "SPY ETF $10k" },
  { label: "+ Gold", text: "Gold 5oz" },
  { label: "+ TSLA", text: "TSLA 20 shares" },
  { label: "+ SOL", text: "SOL 15" },
];

export default function PortfolioInput({ prompt, setPrompt, onRun, busy, alert }) {
  const { t } = useTranslation();
  const [charCount, setCharCount] = useState(0);

  function handleChange(e) {
    setPrompt(e.target.value);
    setCharCount(e.target.value.length);
  }

  function addChip(text) {
    const trimmed = prompt.trim();
    const next = trimmed ? `${trimmed}, ${text}` : text;
    setPrompt(next);
    setCharCount(next.length);
  }

  const hintColor = charCount > 1800 ? "rgba(224,82,82,.7)" : charCount > 800 ? "var(--g)" : "var(--dm2)";

  return (
    <div className="card" id="card-input">
      <div className="inp-lbl">{t("inp_lbl")}</div>
      <textarea
        id="txt-input"
        placeholder={t("inp_placeholder")}
        value={prompt}
        onChange={handleChange}
      />
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".5rem",
          textAlign: "right",
          marginTop: 2,
          letterSpacing: ".5px",
          color: hintColor,
        }}
      >
        {charCount} caracteres
      </div>
      <div className="portfolio-hint">
        {CHIPS.map((c) => (
          <span key={c.label} className="ph-chip" onClick={() => addChip(c.text)}>
            {c.label}
          </span>
        ))}
      </div>
      <div className="btn-row">
        <button className="btn btn-free" disabled={busy} onClick={onRun}>
          {t("btn_free_main")}
          <br />
          <span className="btn-sub">{t("btn_free_sub")}</span>
        </button>
      </div>
      {alert && <div className={`alert ${alert.cls}`} style={{ display: "block" }}>{alert.msg}</div>}
    </div>
  );
}
