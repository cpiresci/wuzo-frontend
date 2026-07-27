import Ticker from "./components/Ticker";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import PortfolioInput from "./components/PortfolioInput";
import Pipeline from "./components/Pipeline";
import FreeResult from "./components/FreeResult";
import PremiumResult from "./components/PremiumResult";
import { useFreeAnalysis } from "./hooks/useFreeAnalysis";
import { usePremiumAnalysis } from "./hooks/usePremiumAnalysis";
import DevPremiumPreview from "./components/DevPremiumPreview";

// Fase 12 — port do fluxo de análise gratuita (#card-input -> #sec-pipeline
// -> #sec-free) do nexus-main.
// Fase 14 — quando o usuário pede o relatório completo a partir do
// FreeResult, o fluxo premium (pa) assume a tela: esconde o resultado free
// e mostra o pipeline/relatório premium por cima, igual ao
// runPremiumAnalysis() do nexus-main (que também escondia #sec-free e
// #sec-full antes de mostrar #sec-pipeline de novo).
// <DevPremiumPreview> (Fase 13) continua só em dev — sem fetch, sem custo.
export default function App() {
  const fa = useFreeAnalysis();
  const pa = usePremiumAnalysis();

  const premiumActive = pa.phase !== "idle";

  return (
    <>
      <Ticker />
      <div className="shell">
        <Header />

        <PortfolioInput
          prompt={fa.prompt}
          setPrompt={fa.setPrompt}
          onRun={fa.run}
          busy={fa.busy || pa.busy}
          alert={premiumActive ? pa.alert : fa.alert}
        />

        {!premiumActive && fa.phase === "pipeline" && (
          <Pipeline
            agentsUi={fa.agentsUi}
            agentStatus={fa.agentStatus}
            progress={fa.progress}
            log={fa.log}
            done={fa.pipDone}
          />
        )}

        {!premiumActive && fa.phase === "result" && fa.result && (
          <FreeResult verdict={fa.result.verdict} score={fa.result.score} prompt={fa.prompt} onRequestPremium={pa.run} />
        )}

        {pa.phase === "pipeline" && (
          <Pipeline agentsUi={pa.agentsUi} agentStatus={pa.agentStatus} progress={pa.progress} log={pa.log} done={pa.pipDone} />
        )}

        {pa.phase === "result" && pa.result && (
          <PremiumResult verdict={pa.result.verdict} agents={pa.result.agents} analysisId={pa.result.analysisId} />
        )}

        {import.meta.env.DEV && <DevPremiumPreview />}
      </div>
      <AuthModal />
    </>
  );
}
