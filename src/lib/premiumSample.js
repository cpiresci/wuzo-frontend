// Fase 13 — fixture ESTÁTICA usada só pelo preview de dev (usePremiumPreview).
// Não é chamada em nenhum fluxo de produção e não bate em nenhum endpoint —
// existe só pra validar visualmente o layout do relatório completo antes de
// ligar o polling real em /api/analyze/premium (isso fica pra próxima fase,
// quando também entra o débito de crédito/Stripe).
import { PREMIUM_REPORT_AGENT_IDS, AGENTS_UI } from "./agents";

const SAMPLE_TEXT_BY_ID = {
  macroeconomia:
    "Cenário macro global neutro a levemente favorável para ativos de risco. Juros americanos estáveis, sem sinal de novo aperto no curto prazo.",
  noticias_realtime:
    "Nenhum evento de risco relevante nas últimas 48h para os ativos listados. Fluxo de notícias predominantemente neutro.",
  sentimento_mercado:
    "Sentimento de mercado em zona neutra (índice de medo/ganância próximo do centro). Sem euforia nem pânico generalizado.",
  criptomoedas:
    "Exposição cripto concentrada em BTC/ETH — perfil consistente com o restante da carteira. Volatilidade dentro do esperado para a classe.",
  acoes_equity: "Boa diversificação setorial nas posições de renda variável. Concentração moderada em tecnologia.",
  renda_fixa: "Parcela em renda fixa abaixo do recomendável para o perfil de risco identificado na carteira.",
  imoveis_fiis: "Sem exposição a FIIs/imóveis identificada. Pode ser uma lacuna de diversificação a considerar.",
  derivativos: "Nenhuma posição em derivativos identificada — perfil sem alavancagem explícita.",
  rwa: "Sem exposição a RWA (Real World Assets tokenizados) identificada na carteira atual.",
  quitacao_dividas: "Nenhuma dívida foi mencionada na descrição da carteira.",
  credito_financiamento: "Sem financiamentos ativos mencionados.",
  planejamento_tributario: "Vale revisar o enquadramento tributário das posições em cripto para o próximo ano-calendário.",
  previdencia_aposentadoria: "Nenhuma posição em previdência privada identificada na carteira descrita.",
  compliance_risco: "Concentração acima de 30% em um único ativo eleva o risco idiossincrático da carteira.",
  auditor_dados: "Dados consistentes entre as fontes consultadas. Nenhuma divergência relevante encontrada.",
};

export const PREMIUM_SAMPLE_VERDICT =
  "**Wuzo Score: 71/100.** Carteira com boa diversificação em renda variável, mas com concentração de risco em um único ativo " +
  "e ausência de renda fixa/FIIs para equilíbrio. Prioridade: reduzir concentração e revisar enquadramento tributário das posições em cripto.";

export function buildPremiumSample() {
  return {
    verdict: PREMIUM_SAMPLE_VERDICT,
    agents: PREMIUM_REPORT_AGENT_IDS.map((id) => {
      const ui = AGENTS_UI.find((a) => a.id === id);
      return { id, emoji: ui?.em, name: ui?.nm, analysis: SAMPLE_TEXT_BY_ID[id] || "" };
    }),
  };
}
