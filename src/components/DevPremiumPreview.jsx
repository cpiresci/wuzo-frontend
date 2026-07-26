import Pipeline from "./Pipeline";
import PremiumResult from "./PremiumResult";
import { usePremiumPreview } from "../hooks/usePremiumPreview";

// Fase 13 — só existe pra você validar no navegador o grid de 16 agentes +
// o relatório completo (layout, markdown, blocos) ANTES de ligar o polling
// real em /api/analyze/premium. Sem fetch, sem crédito, sem Stripe.
export default function DevPremiumPreview() {
  const pv = usePremiumPreview();

  return (
    <div
      style={{
        marginTop: 24,
        border: "1px dashed rgba(201,168,76,.35)",
        borderRadius: 8,
        padding: 12,
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: ".6rem",
          letterSpacing: "1.5px",
          color: "rgba(201,168,76,.7)",
          marginBottom: 8,
        }}
      >
        🔧 DEV ONLY — Preview Premium (Fase 13, dados fictícios, sem rede)
      </div>

      {pv.phase === "idle" && (
        <button className="btn btn-premium" style={{ maxWidth: 340 }} onClick={pv.start}>
          Rodar preview do relatório completo
        </button>
      )}

      {pv.phase === "pipeline" && (
        <>
          <Pipeline
            agentsUi={pv.agentsUi}
            agentStatus={pv.agentStatus}
            progress={pv.progress}
            log={pv.log}
            done={pv.pipDone}
          />
        </>
      )}

      {pv.phase === "result" && pv.sample && (
        <>
          <PremiumResult verdict={pv.sample.verdict} agents={pv.sample.agents} />
          <button className="abtn" style={{ marginTop: 12 }} onClick={pv.reset}>
            ↺ Resetar preview
          </button>
        </>
      )}
    </div>
  );
}
