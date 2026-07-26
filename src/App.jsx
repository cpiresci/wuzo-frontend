import Ticker from "./components/Ticker";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import PortfolioInput from "./components/PortfolioInput";
import Pipeline from "./components/Pipeline";
import FreeResult from "./components/FreeResult";
import { useFreeAnalysis } from "./hooks/useFreeAnalysis";

// Fase 12 — port do fluxo de análise gratuita (#card-input -> #sec-pipeline
// -> #sec-free) do nexus-main. Premium/checkout/admin ainda não portados.
export default function App() {
  const fa = useFreeAnalysis();

  return (
    <>
      <Ticker />
      <div className="shell">
        <Header />

        <PortfolioInput
          prompt={fa.prompt}
          setPrompt={fa.setPrompt}
          onRun={fa.run}
          busy={fa.busy}
          alert={fa.alert}
        />

        {fa.phase === "pipeline" && (
          <Pipeline
            agentsUi={fa.agentsUi}
            agentStatus={fa.agentStatus}
            progress={fa.progress}
            log={fa.log}
            done={fa.pipDone}
          />
        )}

        {fa.phase === "result" && fa.result && <FreeResult verdict={fa.result.verdict} score={fa.result.score} />}
      </div>
      <AuthModal />
    </>
  );
}
