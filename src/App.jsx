import Ticker from "./components/Ticker";

export default function App() {
  return (
    <>
      <Ticker />
      <div className="wz-shell">
        <div className="wz-logo">WUZO</div>
        <p className="wz-note">
          Scaffold Vite/React da Fase 11a. Tema portado do <code>nexus-main</code> (paleta
          dourado/preto, fonte Outfit, tokens de <code>:root</code>) e o ticker de mercado ao vivo
          já funcional acima, consumindo <code>/api/market/ticker</code> com fallback pra Binance e
          <code> /api/market/crypto</code>. Sem auth, sem estado de sessão — isso entra na 11c.
        </p>
      </div>
    </>
  );
}
