// Fase 11f-2 — porte de generateShareImage() (nexus-main/index.html).
//
// Simplificação deliberada vs o original, seguindo o mesmo princípio de
// pdfApi.js (Fase 11f-1): wuzo-frontend não usa Capacitor nem WebView
// Android (ver package.json — só React/Vite puro), então os caminhos
// _isCapacitor / Capacitor.Share / window.Android.shareImage do original
// não existem aqui — só os dois caminhos web ficam: navigator.share (com
// arquivo, quando suportado) e, como último fallback, um overlay com a
// imagem e um link de download.
//
// Mantido do original: o card dourado renderizado fora da tela (score
// ring, gauge de risco, rede de 16 agentes, todos canvas 2D desenhados à
// mão), captura via html2canvas com re-injeção dos canvases via onclone
// (porque html2canvas não sabe renderizar <canvas> dinâmico sozinho), e a
// extração dos 4 módulos de texto a partir dos agentes/veredito reais.

import html2canvas from "html2canvas";

function shareIsAgentHeader(line) {
  const t = line.trim();
  if (!t || t.length < 5) return true;
  return (
    / — /.test(t) ||
    /^[^a-záàâãéêíóôõúç\d]{1,8}$/i.test(t) ||
    /^(Consultor|Analista|Especialista|Agente|Auditor|Veredito)/i.test(t) ||
    /^#{1,4}\s/.test(t) ||
    /\*{2,}/.test(t) ||
    /^[-=]{3,}$/.test(t) ||
    /WUZO\s*$/.test(t) ||
    /Integrado WUZO/i.test(t) ||
    /^(Justificativa|O que está|O que precisa|Atenção|Recomendação|Resumo|Conclusão|Diagnóstico|Nota|Observação|Aviso|Veredicto|Final|Síntese)\s*:/i.test(t)
  );
}

function extractRiskFromScore(score) {
  const s = score || 65;
  if (s <= 35) return { label: "BAIXO", sub: "Conservador" };
  if (s <= 70) return { label: "MOD", sub: "Moderado" };
  return { label: "ALTO", sub: "Arrojado" };
}

function extractModulesForCard({ agents, verdict }) {
  const agentsMap = {};
  (agents || []).forEach((a) => {
    agentsMap[a.id] = a.analysis || "";
  });
  const LABELS = ["ALERTA DE VOLATILIDADE", "ECONOMIA BRASILEIRA", "IMPACTO DE TAXAS", "CRIPTOATIVOS"];
  const AGENTS = [
    ["macroeconomia", "consultor_senior"],
    ["noticias_realtime", "sentimento_mercado"],
    ["renda_fixa", "compliance_risco"],
    ["criptomoedas"],
  ];
  const FALLBACKS = [
    "Cenário macro exige posicionamento defensivo estratégico.",
    "Tendências de mercado identificadas. Oportunidade tática no curto prazo.",
    "Selic alta pode drenar rentabilidade. Revisão de portfólio é imperativa.",
    "Volatilidade ativa. Alocação em ativos de baixo risco é mandatória.",
  ];

  function parseLine(text) {
    if (!text) return "";
    const lines = text.split(/\n+/);
    for (let i = 0; i < lines.length; i++) {
      let raw = lines[i]
        .replace(/^#{1,4}\s+/, "")
        .replace(/^\s*[-•]\s*/, "")
        .trim();
      if (raw.length < 32) continue;
      if (/\?/.test(raw.slice(0, 70))) continue;
      if (/^(O que|Com os|Qual |Como |Se |Para |Dado |Usando |Considerando |Avalie |Identifique )/i.test(raw)) continue;
      const clean = raw.replace(/\*{1,2}([^*]+)\*{1,2}/g, "$1");
      if (shareIsAgentHeader(clean)) continue;
      raw = raw.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
      raw = raw.replace(/^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,45}):\s/, (m, k) => `<strong>${k.trim()}:</strong> `);
      return raw.length > 140 ? raw.slice(0, 137) + "…" : raw;
    }
    return "";
  }

  return AGENTS.map((ids, idx) => {
    let raw = "";
    for (let i = 0; i < ids.length; i++) {
      raw = agentsMap[ids[i]] || "";
      if (raw) break;
    }
    if (!raw && idx === 0) raw = verdict || "";
    let desc = parseLine(raw) || FALLBACKS[idx];
    if (desc.indexOf("<strong>") === -1) {
      desc = `<strong>${LABELS[idx]}:</strong> ${desc}`;
    }
    return desc;
  });
}

const CARD_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;800;900&family=Raleway:wght@400;500;600;700;800;900&family=Orbitron:wght@400;500;600;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
#_wc{width:430px;background:linear-gradient(170deg,#0a1428 0%,#070f1e 25%,#060b18 55%,#040910 100%);border-radius:20px;overflow:visible;position:relative;border:1px solid rgba(180,140,55,.32);box-shadow:0 0 0 1px rgba(255,255,255,.04),0 50px 120px rgba(0,0,5,.92),inset 0 1px 0 rgba(255,255,255,.07),inset 0 0 100px rgba(5,15,50,.55);}
#_wc::before{content:"";position:absolute;inset:0;border-radius:20px;pointer-events:none;z-index:0;background:radial-gradient(ellipse 75% 38% at 28% 7%,rgba(18,48,148,.52) 0%,transparent 65%),radial-gradient(ellipse 55% 45% at 78% 95%,rgba(38,12,78,.48) 0%,transparent 58%),radial-gradient(ellipse 90% 60% at 50% 50%,rgba(5,10,28,.7) 0%,transparent 100%);}
#_wc::after{content:"";position:absolute;inset:0;border-radius:20px;pointer-events:none;z-index:0;background-image:linear-gradient(rgba(180,140,55,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(180,140,55,.022) 1px,transparent 1px);background-size:30px 30px;}
.oc{position:absolute;z-index:3;}
.oc-tl{top:11px;left:11px;border-top:2px solid rgba(201,162,39,.65);border-left:2px solid rgba(201,162,39,.65);width:18px;height:18px;}
.oc-tr{top:11px;right:11px;border-top:2px solid rgba(201,162,39,.65);border-right:2px solid rgba(201,162,39,.65);width:18px;height:18px;}
.oc-bl{bottom:11px;left:11px;border-bottom:2px solid rgba(201,162,39,.65);border-left:2px solid rgba(201,162,39,.65);width:18px;height:18px;}
.oc-br{bottom:11px;right:11px;border-bottom:2px solid rgba(201,162,39,.65);border-right:2px solid rgba(201,162,39,.65);width:18px;height:18px;}
.ci{position:relative;z-index:1;padding:22px 20px 20px;}
.hdr{text-align:center;padding-bottom:16px;}
.hdr-eye{font-family:"Raleway",sans-serif;font-size:8px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:rgba(201,162,39,.52);margin-bottom:4px;}
.hdr-logo{font-family:"Cinzel",serif;font-size:70px;font-weight:900;letter-spacing:18px;line-height:1;color:#e8c860;filter:drop-shadow(0 3px 16px rgba(201,162,39,.55));text-align:center;}
.hdr-url{font-family:"Raleway",sans-serif;font-size:10px;font-weight:500;letter-spacing:2.5px;color:rgba(201,162,39,.48);margin-bottom:14px;}
.hdr-div{display:flex;align-items:center;gap:10px;}
.hdr-div-l{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(201,162,39,.7),rgba(201,162,39,.5),transparent);}
.hdr-div-d{width:6px;height:6px;background:#c9a227;transform:rotate(45deg);flex-shrink:0;box-shadow:0 0 10px rgba(201,162,39,.7);}
.top-row{display:grid;grid-template-columns:1.18fr 1fr;gap:11px;margin-top:15px;margin-bottom:13px;}
.gp{background:linear-gradient(145deg,rgba(255,255,255,.034),rgba(255,255,255,.008));border:1px solid rgba(180,140,55,.24);border-radius:15px;position:relative;overflow:hidden;}
.gp::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent 8%,rgba(255,255,255,.16) 50%,transparent 92%);}
.pt-row{display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:8px;}
.pt{font-family:"Raleway",sans-serif;font-size:8px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(201,162,39,.55);}
.shield-ic svg{width:10px;height:10px;}
.sp{padding:14px 10px 10px;display:flex;flex-direction:column;align-items:center;}
.ring-wrap{position:relative;width:156px;height:156px;margin-bottom:9px;flex-shrink:0;}
.ring-wrap canvas{position:absolute;inset:0;width:100%;height:100%;}
.ring-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;}
.sc-num{font-family:"Cinzel",serif;font-size:52px;font-weight:900;line-height:1;color:#e8c860;filter:drop-shadow(0 0 14px rgba(201,162,39,.58));}
.sc-den{font-family:"Raleway",sans-serif;font-size:13px;font-weight:700;color:rgba(201,162,39,.52);letter-spacing:1px;margin-top:-3px;}
.sc-cat{font-family:"Raleway",sans-serif;font-size:7.5px;font-weight:700;letter-spacing:2.5px;color:rgba(201,162,39,.38);text-transform:uppercase;margin-top:3px;}
.trust-bdg{display:flex;align-items:center;gap:5px;padding:3px 10px 3px 8px;background:rgba(201,162,39,.07);border:1px solid rgba(201,162,39,.24);border-radius:20px;margin-bottom:5px;}
.trust-bdg svg{width:11px;height:11px;flex-shrink:0;}
.trust-txt{font-family:"Raleway",sans-serif;font-size:7px;font-weight:700;letter-spacing:1.5px;color:rgba(201,162,39,.68);text-transform:uppercase;}
.sc-footer{font-family:"Raleway",sans-serif;font-size:7px;font-weight:600;letter-spacing:2px;color:rgba(201,162,39,.3);text-transform:uppercase;}
.rc{display:flex;flex-direction:column;gap:11px;}
.rp{padding:10px 10px 8px;display:flex;flex-direction:column;align-items:center;}
.gauge-wrap{width:100%;height:88px;position:relative;margin-bottom:3px;}
.gauge-wrap canvas{width:100%;height:100%;display:block;}
.gauge-rd{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:1px;}
.g-badge{background:linear-gradient(135deg,rgba(201,162,39,.18),rgba(201,162,39,.07));border:1px solid rgba(201,162,39,.45);border-radius:5px;padding:2px 9px;font-family:"Orbitron",sans-serif;font-size:11px;font-weight:700;letter-spacing:1.5px;color:#c9a227;box-shadow:0 0 12px rgba(201,162,39,.18),inset 0 1px 0 rgba(255,255,255,.08);}
.g-sub{font-family:"Raleway",sans-serif;font-size:9px;font-weight:600;letter-spacing:1.5px;color:rgba(201,162,39,.48);text-transform:uppercase;}
.ap{flex:1;padding:9px 10px 8px;display:flex;flex-direction:column;align-items:center;}
.ap-title{font-family:"Raleway",sans-serif;font-size:7.5px;font-weight:700;letter-spacing:1.8px;color:rgba(201,162,39,.5);text-transform:uppercase;text-align:center;line-height:1.55;margin-bottom:5px;}
.net-wrap{width:100%;flex:1;min-height:62px;position:relative;}
.net-wrap canvas{position:absolute;inset:0;width:100%;height:100%;}
.ag-row{display:flex;align-items:baseline;gap:5px;margin-top:5px;}
.ag-num{font-family:"Cinzel",serif;font-size:36px;font-weight:900;line-height:1;color:#c9a227;filter:drop-shadow(0 0 9px rgba(201,162,39,.42));}
.ag-sub{font-family:"Raleway",sans-serif;font-size:7.5px;font-weight:700;letter-spacing:1.5px;color:rgba(201,162,39,.5);text-transform:uppercase;max-width:55px;line-height:1.35;}
.diag-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;}
.diag-title{font-family:"Raleway",sans-serif;font-size:8.5px;font-weight:800;letter-spacing:4px;color:rgba(201,162,39,.52);text-transform:uppercase;white-space:nowrap;}
.diag-ln{flex:1;height:1px;background:linear-gradient(90deg,rgba(201,162,39,.48),transparent);}
.mod{background:linear-gradient(135deg,rgba(180,140,50,.05),rgba(180,140,50,.01));border:1px solid rgba(180,140,55,.2);border-radius:10px;padding:8px 12px 8px 16px;margin-bottom:8px;position:relative;overflow:hidden;}
.mod::before{content:"";position:absolute;top:10px;bottom:10px;left:0;width:3px;border-radius:0 3px 3px 0;background:linear-gradient(180deg,rgba(201,162,39,.9),rgba(201,162,39,.25));}
.mod::after{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,162,39,.22),transparent);}
.mc-tl,.mc-br{position:absolute;width:9px;height:9px;}
.mc-tl{top:6px;left:6px;border-top:1px solid rgba(201,162,39,.45);border-left:1px solid rgba(201,162,39,.45);}
.mc-br{bottom:6px;right:6px;border-bottom:1px solid rgba(201,162,39,.45);border-right:1px solid rgba(201,162,39,.45);}
.mod-n{font-family:"Orbitron",sans-serif;font-size:7px;font-weight:500;color:rgba(201,162,39,.35);letter-spacing:1px;margin-bottom:1px;}
.mod-lbl{font-family:"Raleway",sans-serif;font-size:8px;font-weight:600;letter-spacing:1.5px;color:rgba(201,162,39,.44);text-transform:uppercase;font-style:italic;margin-bottom:4px;}
.mod-txt{font-family:"Raleway",sans-serif;font-size:11px;font-weight:500;color:rgba(218,228,248,.84);line-height:1.46;}
.mod-txt strong{font-weight:800;color:#c9a227;}
.mod.urg::before{background:linear-gradient(180deg,#00ddb8,#009980);}
.mod.urg{border-color:rgba(0,200,180,.22);}
.mod.urg .mod-txt strong{color:#00d4b0;}
.mod.urg .mc-tl,.mod.urg .mc-br{border-color:rgba(0,200,180,.42);}
.mod.cta{text-align:center;border-color:rgba(201,162,39,.32);background:linear-gradient(135deg,rgba(201,162,39,.08),rgba(201,162,39,.02));padding:11px 14px;border-radius:10px;margin-bottom:0;}
.mod.cta::before{display:none;}
.cta-lbl{font-family:"Raleway",sans-serif;font-size:7.5px;font-weight:700;letter-spacing:2.5px;color:rgba(201,162,39,.48);text-transform:uppercase;font-style:italic;margin-bottom:4px;}
.cta-body{font-family:"Raleway",sans-serif;font-size:10.5px;font-weight:500;color:rgba(218,228,248,.8);margin-bottom:6px;line-height:1.45;}
.cta-body strong{color:#f0d060;font-weight:800;}
.cta-url{font-family:"Cinzel",serif;font-size:20px;font-weight:900;letter-spacing:2.5px;color:#e8c860;filter:drop-shadow(0 0 12px rgba(201,162,39,.48));}
.card-ft{display:flex;justify-content:flex-end;align-items:center;gap:6px;margin-top:12px;padding-top:9px;border-top:1px solid rgba(201,162,39,.1);}
.auth-seal{display:flex;align-items:center;gap:5px;background:rgba(201,162,39,.07);border:1px solid rgba(201,162,39,.24);border-radius:20px;padding:3px 10px 3px 7px;}
.auth-ic{width:15px;height:15px;border-radius:50%;background:rgba(201,162,39,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.auth-txt{font-family:"Raleway",sans-serif;font-size:7px;font-weight:700;letter-spacing:1.5px;color:rgba(201,162,39,.5);text-transform:uppercase;}
`;

function buildCardHtml(scoreVal, riskInfo, modules) {
  return `
<div id="_wc" style="position:absolute;left:-9999px;top:0;">
<style>${CARD_CSS}</style>
<div class="oc oc-tl"></div><div class="oc oc-tr"></div>
<div class="oc oc-bl"></div><div class="oc oc-br"></div>
<div class="ci">
  <div class="hdr">
    <div class="hdr-eye">Análise por Inteligência Artificial</div>
    <div class="hdr-logo">WUZO</div>
    <div class="hdr-url">Wuzo.com.br</div>
    <div class="hdr-div"><div class="hdr-div-l"></div><div class="hdr-div-d"></div><div class="hdr-div-l"></div></div>
  </div>
  <div class="top-row">
    <div class="gp sp">
      <div class="pt-row">
        <div class="pt">Wuzo Score</div>
        <div class="shield-ic"><svg viewBox="0 0 12 14" fill="none"><path d="M6 1L1 3.5V7c0 2.8 2 5.3 5 6 3-0.7 5-3.2 5-6V3.5L6 1z" fill="rgba(201,162,39,0.55)"/><path d="M4 7l1.5 1.5L8 5.5" stroke="rgba(240,220,130,0.9)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      </div>
      <div class="ring-wrap">
        <canvas id="_wcScoreC" width="312" height="312"></canvas>
        <div class="ring-center">
          <div class="sc-num">${scoreVal}</div>
          <div class="sc-den">/100</div>
          <div class="sc-cat">Financeira</div>
        </div>
      </div>
      <div class="trust-bdg">
        <svg viewBox="0 0 12 14" fill="none"><path d="M6 1L1 3.5V7c0 2.8 2 5.3 5 6 3-0.7 5-3.2 5-6V3.5L6 1z" fill="rgba(201,162,39,0.7)"/><path d="M4 7l1.5 1.5L8 5.5" stroke="rgba(248,235,160,1)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span class="trust-txt">Badge de Confiança</span>
      </div>
      <div class="sc-footer">Wuzo Score</div>
    </div>
    <div class="rc">
      <div class="gp rp">
        <div class="pt-row"><div class="pt">Perímetro de Risco</div></div>
        <div class="gauge-wrap"><canvas id="_wcGaugeC" width="180" height="120"></canvas></div>
        <div class="gauge-rd">
          <div class="g-badge">${riskInfo.label}</div>
          <div class="g-sub">${riskInfo.sub}</div>
        </div>
      </div>
      <div class="gp ap">
        <div class="ap-title">Rede de Consenso<br>de 16 Agentes</div>
        <div class="net-wrap" style="height:62px;">
          <canvas id="_wcNetC" width="180" height="80" style="position:absolute;inset:0;width:100%;height:100%;"></canvas>
        </div>
        <div class="ag-row">
          <div class="ag-num">16</div>
          <div class="ag-sub">Agentes<br>Especialistas</div>
        </div>
      </div>
    </div>
  </div>
  <div class="diag-hdr"><div class="diag-title">Diagnóstico Executivo</div><div class="diag-ln"></div></div>
  <div class="mod"><div class="mc-tl"></div><div class="mc-br"></div>
    <div class="mod-n">01</div>
    <div class="mod-lbl">Módulo "Síntese de Carteira"</div>
    <div class="mod-txt">${modules[0]}</div>
  </div>
  <div class="mod"><div class="mc-tl"></div><div class="mc-br"></div>
    <div class="mod-n">02</div>
    <div class="mod-lbl">Módulo "Vetores de Valor Tático"</div>
    <div class="mod-txt">${modules[1]}</div>
  </div>
  <div class="mod"><div class="mc-tl"></div><div class="mc-br"></div>
    <div class="mod-n">03</div>
    <div class="mod-lbl">Módulo "Vetores de Risco Crítico"</div>
    <div class="mod-txt">${modules[2]}</div>
  </div>
  <div class="mod urg"><div class="mc-tl"></div><div class="mc-br"></div>
    <div class="mod-n">04</div>
    <div class="mod-lbl">Módulo "Ações Imediatas de Alta Prioridade"</div>
    <div class="mod-txt">${modules[3]}</div>
  </div>
  <div class="mod cta"><div class="mc-tl"></div><div class="mc-br"></div>
    <div class="cta-lbl">Módulo "Ação do Usuário"</div>
    <div class="cta-body"><strong>ACESSO À INTELIGÊNCIA:</strong> Descubra o SEU Wuzo Score <strong>Gratuitamente</strong> agora mesmo:</div>
    <div class="cta-url">WUZO.COM.BR</div>
  </div>
  <div class="card-ft">
    <div class="auth-seal">
      <div class="auth-ic"><svg width="9" height="10" viewBox="0 0 12 14" fill="none"><path d="M6 1L1 3.5V7c0 2.8 2 5.3 5 6 3-0.7 5-3.2 5-6V3.5L6 1z" fill="rgba(201,162,39,0.75)"/><path d="M4 7l1.5 1.5L8 5.5" stroke="rgba(248,235,160,1)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="auth-txt">Autenticidade de IA</div>
    </div>
  </div>
</div>
</div>`;
}

function drawScoreRing(el, scoreVal) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  const SZ = 156;
  el.width = SZ * dpr;
  el.height = SZ * dpr;
  el.style.width = SZ + "px";
  el.style.height = SZ + "px";
  const ctx = el.getContext("2d");
  ctx.scale(dpr, dpr);
  const cx = SZ / 2,
    cy = SZ / 2;
  const SA = (225 * Math.PI) / 180;
  const SW = (270 * Math.PI) / 180;
  const EA = SA + SW;
  const scorePct = Math.max(0, Math.min(100, scoreVal)) / 100;
  const SCORE_A = SA + SW * scorePct;
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    const isMaj = i % 5 === 0;
    const r1 = isMaj ? 74 : 75;
    const r2 = 77;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.strokeStyle = `rgba(201,162,39,${isMaj ? 0.4 : 0.15})`;
    ctx.lineWidth = isMaj ? 1.2 : 0.6;
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, 77, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(180,140,55,0.1)";
  ctx.lineWidth = 0.7;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 14;
  ctx.stroke();
  let bevel = ctx.createLinearGradient(cx - 70, cy - 70, cx + 70, cy + 70);
  bevel.addColorStop(0, "rgba(22,38,90,1)");
  bevel.addColorStop(0.4, "rgba(14,24,58,1)");
  bevel.addColorStop(1, "rgba(8,14,36,1)");
  ctx.beginPath();
  ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.strokeStyle = bevel;
  ctx.lineWidth = 13;
  ctx.stroke();
  let hiB = ctx.createLinearGradient(cx - 60, cy - 60, cx + 20, cy + 20);
  hiB.addColorStop(0, "rgba(255,255,255,0.07)");
  hiB.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(cx, cy, 70, 0, Math.PI * 2);
  ctx.strokeStyle = hiB;
  ctx.lineWidth = 5;
  ctx.stroke();
  let trackGrad = ctx.createLinearGradient(cx - 65, cy - 65, cx + 65, cy + 65);
  trackGrad.addColorStop(0, "rgba(18,28,70,1)");
  trackGrad.addColorStop(1, "rgba(10,16,42,1)");
  ctx.beginPath();
  ctx.arc(cx, cy, 63, SA, EA);
  ctx.strokeStyle = trackGrad;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 63, SA, EA);
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 10;
  ctx.lineCap = "butt";
  ctx.stroke();
  let sG = ctx.createLinearGradient(cx - 60, cy + 40, cx + 60, cy - 50);
  sG.addColorStop(0, "#6a4008");
  sG.addColorStop(0.2, "#b88a1a");
  sG.addColorStop(0.4, "#c9a227");
  sG.addColorStop(0.62, "#f0da6a");
  sG.addColorStop(0.8, "#d4a830");
  sG.addColorStop(1, "#9a7010");
  ctx.save();
  ctx.shadowColor = "rgba(201,162,39,0.7)";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, 63, SA, SCORE_A);
  ctx.strokeStyle = sG;
  ctx.lineWidth = 11;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, 63, SA, SCORE_A);
  ctx.strokeStyle = sG;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.stroke();
  let rimG = ctx.createLinearGradient(cx - 60, cy - 60, cx + 30, cy);
  rimG.addColorStop(0, "rgba(255,248,180,0.5)");
  rimG.addColorStop(0.5, "rgba(240,210,90,0.18)");
  rimG.addColorStop(1, "rgba(180,130,20,0)");
  ctx.beginPath();
  ctx.arc(cx, cy, 66.5, SA, SCORE_A);
  ctx.strokeStyle = rimG;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();
  for (let j = 0; j <= 10; j++) {
    const at = SA + (SW / 10) * j;
    const isMj = j % 5 === 0;
    const rr1 = isMj ? 55 : 57;
    const rr2 = isMj ? 60 : 59;
    const inside = at < SCORE_A;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(at) * rr1, cy + Math.sin(at) * rr1);
    ctx.lineTo(cx + Math.cos(at) * rr2, cy + Math.sin(at) * rr2);
    ctx.strokeStyle = inside
      ? `rgba(201,162,39,${isMj ? 0.6 : 0.28})`
      : `rgba(201,162,39,${isMj ? 0.22 : 0.1})`;
    ctx.lineWidth = isMj ? 1.5 : 0.8;
    ctx.stroke();
  }
  const ex = cx + Math.cos(SCORE_A) * 63,
    ey = cy + Math.sin(SCORE_A) * 63;
  let dGr = ctx.createRadialGradient(ex, ey, 0, ex, ey, 8);
  dGr.addColorStop(0, "rgba(255,245,160,0.95)");
  dGr.addColorStop(0.45, "rgba(201,162,39,0.55)");
  dGr.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(ex, ey, 8, 0, Math.PI * 2);
  ctx.fillStyle = dGr;
  ctx.fill();
  let cG = ctx.createRadialGradient(cx, cy - 10, 4, cx, cy, 50);
  cG.addColorStop(0, "rgba(22,40,105,0.98)");
  cG.addColorStop(0.45, "rgba(12,22,65,1)");
  cG.addColorStop(1, "rgba(5,10,32,1)");
  ctx.beginPath();
  ctx.arc(cx, cy, 52, 0, Math.PI * 2);
  ctx.fillStyle = cG;
  ctx.fill();
  [52, 43, 34].forEach((r, ii) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(180,140,55,${0.1 - ii * 0.025})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  });
  ctx.save();
  ctx.setLineDash([2, 5]);
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(180,140,55,0.06)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawGauge(el, scoreVal) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  el.width = 180 * dpr;
  el.height = 120 * dpr;
  el.style.width = "100%";
  el.style.height = "88px";
  const ctx = el.getContext("2d");
  ctx.scale(dpr, dpr);
  const cx = 90,
    cy = 90,
    R = 62;
  const SA = (165 * Math.PI) / 180;
  const EA = (15 * Math.PI) / 180;
  ctx.beginPath();
  ctx.arc(cx, cy, R, SA, EA);
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  ctx.lineWidth = 16;
  ctx.lineCap = "butt";
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, R + 9, SA, EA);
  ctx.strokeStyle = "rgba(180,140,55,0.1)";
  ctx.lineWidth = 1;
  ctx.stroke();
  let aG = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
  aG.addColorStop(0, "#28a85a");
  aG.addColorStop(0.28, "#8ab818");
  aG.addColorStop(0.5, "#c9a227");
  aG.addColorStop(0.72, "#d46818");
  aG.addColorStop(1, "#be2c28");
  ctx.save();
  ctx.shadowColor = "rgba(201,162,39,0.35)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, R, SA, EA);
  ctx.strokeStyle = aG;
  ctx.lineWidth = 12;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, R, SA, EA);
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = 8;
  ctx.lineCap = "butt";
  ctx.globalAlpha = 0.35;
  ctx.stroke();
  ctx.globalAlpha = 1;
  const TSW = (210 * Math.PI) / 180;
  for (let i = 0; i <= 10; i++) {
    const a = SA + (TSW / 10) * i;
    const isMaj = i % 2 === 0;
    const r1 = R - (isMaj ? 9 : 6);
    const r2 = R - 16;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.strokeStyle = `rgba(201,162,39,${isMaj ? 0.45 : 0.2})`;
    ctx.lineWidth = isMaj ? 1.5 : 0.8;
    ctx.stroke();
  }
  // Ângulo contínuo baseado no score numérico (arco 165°→375°, 210° de vão)
  const nA = ((165 + (scoreVal / 100) * 210) * Math.PI) / 180;
  ctx.font = "700 7.5px 'Raleway',sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillText("LOW", cx + Math.cos(SA) * (R + 18), cy + Math.sin(SA) * (R + 18) + 4);
  ctx.fillText("HIGH", cx + Math.cos(EA) * (R + 18), cy + Math.sin(EA) * (R + 18) + 4);
  ctx.fillStyle = "rgba(201,162,39,0.72)";
  const modA = (270 * Math.PI) / 180;
  ctx.fillText("MOD", cx + Math.cos(modA) * (R + 16), cy + Math.sin(modA) * (R + 16) + 4);
  const modX = cx + Math.cos(modA) * R,
    modY = cy + Math.sin(modA) * R;
  let dGr = ctx.createRadialGradient(modX, modY, 0, modX, modY, 6);
  dGr.addColorStop(0, "rgba(255,235,100,0.98)");
  dGr.addColorStop(0.4, "rgba(201,162,39,0.7)");
  dGr.addColorStop(1, "transparent");
  ctx.beginPath();
  ctx.arc(modX, modY, 6, 0, Math.PI * 2);
  ctx.fillStyle = dGr;
  ctx.fill();
  const nLen = R - 5;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 2;
  let nG2 = ctx.createLinearGradient(cx, cy, cx + Math.cos(nA) * nLen, cy + Math.sin(nA) * nLen);
  nG2.addColorStop(0, "#b88a18");
  nG2.addColorStop(0.6, "#e8c860");
  nG2.addColorStop(1, "#f8e890");
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(nA) * nLen, cy + Math.sin(nA) * nLen);
  ctx.strokeStyle = nG2;
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();
  let bG2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
  bG2.addColorStop(0, "#f5e080");
  bG2.addColorStop(0.5, "#c9a227");
  bG2.addColorStop(1, "#7a5010");
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = bG2;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = "#faf0d8";
  ctx.fill();
}

function drawNetwork(el) {
  const dpr = Math.min(window.devicePixelRatio || 1, 3);
  el.width = 180 * dpr;
  el.height = 80 * dpr;
  const ctx = el.getContext("2d");
  ctx.scale(dpr, dpr);
  const W = 180,
    H = 80;
  const pts = [
    [0.07, 0.3], [0.18, 0.72], [0.27, 0.18], [0.37, 0.58], [0.49, 0.82],
    [0.54, 0.28], [0.63, 0.68], [0.72, 0.18], [0.82, 0.52], [0.47, 0.1],
    [0.13, 0.52], [0.3, 0.42], [0.65, 0.83], [0.78, 0.38], [0.4, 0.73], [0.9, 0.68],
  ];
  const nodes = pts.map(([x, y]) => ({ x: x * W, y: y * H }));
  const conns2 = [
    [0, 2], [0, 10], [1, 10], [1, 3], [2, 9], [2, 5], [3, 5], [3, 6],
    [4, 6], [4, 12], [5, 7], [6, 7], [6, 13], [7, 8], [8, 13], [9, 5],
    [10, 1], [10, 11], [12, 6], [14, 3], [15, 8], [11, 3], [9, 6], [7, 13],
  ];
  conns2.forEach(([a, b]) => {
    let g = ctx.createLinearGradient(nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y);
    g.addColorStop(0, "rgba(201,162,39,0.28)");
    g.addColorStop(0.5, "rgba(240,200,80,0.18)");
    g.addColorStop(1, "rgba(201,162,39,0.28)");
    ctx.strokeStyle = g;
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    ctx.moveTo(nodes[a].x, nodes[a].y);
    ctx.lineTo(nodes[b].x, nodes[b].y);
    ctx.stroke();
  });
  const baseY = H * 0.88;
  ctx.strokeStyle = "rgba(201,162,39,0.35)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(W, baseY);
  ctx.stroke();
  ctx.strokeStyle = "rgba(201,162,39,0.65)";
  ctx.lineWidth = 1.2;
  ctx.shadowColor = "rgba(201,162,39,0.5)";
  ctx.shadowBlur = 3;
  const waveX = W * 0.45;
  const ecgPts = [[0, 0], [8, 0], [12, -6], [15, 10], [19, -18], [23, 18], [27, -5], [32, 0], [60, 0]];
  ctx.beginPath();
  ecgPts.forEach(([dx, dy], i) => {
    const x = waveX + dx,
      y = baseY + dy;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.shadowBlur = 0;
  nodes.forEach((n) => {
    let g2 = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 6);
    g2.addColorStop(0, "rgba(240,200,80,0.6)");
    g2.addColorStop(0.5, "rgba(201,162,39,0.25)");
    g2.addColorStop(1, "transparent");
    ctx.fillStyle = g2;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(250,226,138,0.95)";
    ctx.beginPath();
    ctx.arc(n.x, n.y, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function showFallbackOverlay(dataURL) {
  const ov = document.createElement("div");
  ov.id = "wuzo-share-overlay";
  ov.style.cssText =
    "position:fixed;inset:0;z-index:9999;background:rgba(3,3,2,.97);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;gap:14px;";
  const imgEl = document.createElement("img");
  imgEl.src = dataURL;
  imgEl.style.cssText = "max-width:100%;max-height:65vh;border-radius:20px;box-shadow:0 0 60px rgba(201,162,39,.3);display:block;";
  const hint = document.createElement("div");
  hint.style.cssText = "color:rgba(240,204,112,.85);font-size:.72rem;font-family:'JetBrains Mono',monospace;letter-spacing:1px;text-align:center;";
  hint.textContent = "Clique com botão direito → Salvar imagem";
  const link2 = document.createElement("a");
  link2.href = dataURL;
  link2.download = "wuzo_stories.png";
  link2.style.cssText =
    "padding:10px 24px;border-radius:50px;border:1px solid rgba(201,162,39,.4);background:rgba(201,162,39,.1);color:#f0cc70;font-family:'Outfit',sans-serif;font-weight:700;font-size:.8rem;text-decoration:none;";
  link2.textContent = "⬇ Baixar imagem";
  const closeBtn = document.createElement("button");
  closeBtn.style.cssText =
    "padding:9px 24px;border-radius:50px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(192,184,158,.6);font-family:'Outfit',sans-serif;font-size:.75rem;cursor:pointer;";
  closeBtn.innerHTML = "&#10005; Fechar";
  closeBtn.onclick = () => {
    const el = document.getElementById("wuzo-share-overlay");
    if (el) document.body.removeChild(el);
  };
  ov.append(imgEl, hint, link2, closeBtn);
  document.body.appendChild(ov);
}

/**
 * generateShareImage({ agents, verdict, wuzoScore })
 *
 * Monta o card fora da tela, desenha os 3 canvases (score ring, gauge de
 * risco, rede de agentes), captura com html2canvas e compartilha via
 * navigator.share (com arquivo) ou, se não suportado, mostra um overlay
 * com a imagem e um link de download.
 *
 * @returns {Promise<{ shared: boolean }>} shared=true se o share nativo foi
 *   usado; shared=false se caiu no overlay de fallback (o usuário ainda
 *   pode salvar a imagem manualmente — não é um erro).
 */
export async function generateShareImage({ agents, verdict, wuzoScore }) {
  const scoreVal = wuzoScore || 65;
  const riskInfo = extractRiskFromScore(scoreVal);
  const modules = extractModulesForCard({ agents, verdict });

  const wrapper = document.createElement("div");
  wrapper.innerHTML = buildCardHtml(scoreVal, riskInfo, modules);
  const cardEl = wrapper.firstElementChild;
  document.body.appendChild(cardEl);

  try {
    drawScoreRing(document.getElementById("_wcScoreC"), scoreVal);
    drawGauge(document.getElementById("_wcGaugeC"), scoreVal);
    drawNetwork(document.getElementById("_wcNetC"));

    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 600));

    const scoreSnap = document.getElementById("_wcScoreC")?.toDataURL("image/png") || null;
    const gaugeSnap = document.getElementById("_wcGaugeC")?.toDataURL("image/png") || null;
    const netSnap = document.getElementById("_wcNetC")?.toDataURL("image/png") || null;

    const canvas = await html2canvas(cardEl, {
      scale: 3,
      backgroundColor: "#060b18",
      useCORS: true,
      logging: false,
      allowTaint: true,
      imageTimeout: 0,
      onclone(doc) {
        function restoreCanvas(id, snap) {
          if (!snap) return;
          const c = doc.getElementById(id);
          if (!c) return;
          const x = c.getContext("2d");
          const im = new Image();
          im.onload = () => x.drawImage(im, 0, 0);
          im.src = snap;
        }
        restoreCanvas("_wcScoreC", scoreSnap);
        restoreCanvas("_wcGaugeC", gaugeSnap);
        restoreCanvas("_wcNetC", netSnap);
      },
    });

    document.body.removeChild(cardEl);
    const dataURL = canvas.toDataURL("image/png");

    if (navigator.share) {
      try {
        const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        const file = new File([blob], "wuzo_stories.png", { type: "image/png" });
        const payload =
          navigator.canShare && navigator.canShare({ files: [file] })
            ? { title: "Minha Análise WUZO", text: "\uD83D\uDE80 wuzo.com.br", files: [file] }
            : { title: "Minha Análise WUZO", text: "\uD83D\uDE80 Análise financeira por IA! wuzo.com.br", url: "https://wuzo.com.br" };
        await navigator.share(payload);
        return { shared: true };
      } catch (se) {
        if (se.name === "AbortError") return { shared: false, cancelled: true };
        // cai pro overlay abaixo se o share falhar por outro motivo
      }
    }

    showFallbackOverlay(dataURL);
    return { shared: false };
  } catch (err) {
    if (cardEl.parentNode) document.body.removeChild(cardEl);
    throw err;
  }
}
