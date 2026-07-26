import Ticker from "./components/Ticker";
import Header from "./components/Header";
import AuthModal from "./components/AuthModal";
import PortfolioInput from "./components/PortfolioInput";
import Pipeline from "./components/Pipeline";
import FreeResult from "./components/FreeResult";
import { useFreeAnalysis } from "./hooks/useFreeAnalysis";
import DevPremiumPreview from "./components/DevPremiumPreview";

// Fase 12 — port do fluxo de análise gratuita (#card-input -> #sec-pipeline
// -> #sec-free) do nexus-main.
// Fase 13 — <DevPremiumPreview> some do bundle de produção (`npm run
// build`), pois só renderiza quando import.meta.env.DEV é true (`npm run
// dev`). Existe só pra validar visualmente o grid+relatório premium — não
// chama nenhum endpoint, não mexe em crédito/Stripe. O botão de premium
// real ("QUERO O RELATÓRIO COMPLETO") continua igual, sem mudança de
// comportamento pro usuário.
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

        {import.meta.env.DEV && <DevPremiumPreview />}
      </div>
      <AuthModal />
    </>
  );
}
