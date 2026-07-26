// Fase 12 — port de AGENTS_UI (nexus-main index.html). Mesma ordem, mesmos
// emojis e nomes curtos usados no grid do pipeline visual.
export const AGENTS_UI = [
  { id: "macroeconomia", em: "🌐", nm: "Global Macro" },
  { id: "noticias_realtime", em: "📰", nm: "Live Radar" },
  { id: "sentimento_mercado", em: "🧠", nm: "Sentiment" },
  { id: "criptomoedas", em: "₿", nm: "Crypto" },
  { id: "acoes_equity", em: "📈", nm: "Equities" },
  { id: "renda_fixa", em: "💰", nm: "Fixed Inc." },
  { id: "imoveis_fiis", em: "🏢", nm: "REITs" },
  { id: "derivativos", em: "📊", nm: "Derivatives" },
  { id: "rwa", em: "🔗", nm: "RWA" },
  { id: "quitacao_dividas", em: "💳", nm: "Liabilities" },
  { id: "credito_financiamento", em: "🏢", nm: "Credit" },
  { id: "planejamento_tributario", em: "📋", nm: "Tax" },
  { id: "previdencia_aposentadoria", em: "🎯", nm: "Retirement" },
  { id: "compliance_risco", em: "⚠", nm: "Risk" },
  { id: "auditor_dados", em: "🔍", nm: "Auditor" },
  { id: "consultor_senior", em: "🥄", nm: "Senior" },
];

// Agentes que a análise GRATUITA de fato roda (ver freeAnalysisEngine.js no
// backend — só 2 dos 16 participam do preview free; os outros 14 aparecem
// no grid mas nunca saem do estado "pendente" nesta fase).
export const FREE_AGENT_IDS = ["consultor_senior", "macroeconomia"];
