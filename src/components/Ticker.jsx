import { useEffect, useRef, useState } from "react";
import { fetchTickerItems } from "../lib/marketApi";

const POLL_MS = 30000; // igual ao setInterval(updateTicker, 30000) original

/**
 * Fase 11a — ticker de cripto/mercado.
 * Consumo puro de API pública, sem estado de sessão (por design da 11a).
 * dangerouslySetInnerHTML é usado de propósito aqui: os itens já vêm como
 * spans com classes fixas (ticker-sym/ticker-price/ticker-chg), montados em
 * buildTickerItems a partir de campos numéricos/enums do backend — não há
 * texto livre de usuário nessa peça.
 */
export default function Ticker() {
  const [items, setItems] = useState([]);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    async function tick() {
      const next = await fetchTickerItems();
      if (mounted.current && next.length) setItems(next);
    }

    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      mounted.current = false;
      clearInterval(id);
    };
  }, []);

  // duplica a lista pra loop de scroll contínuo, igual ao _renderTicker original
  const doubled = items.length ? items.concat(items) : [];

  return (
    <div id="crypto-ticker">
      <div className="ticker-track">
        {doubled.length ? (
          doubled.map((item, i) => (
            <div className="ticker-item" key={i} dangerouslySetInnerHTML={{ __html: item.html }} />
          ))
        ) : (
          <div className="ticker-empty">Carregando mercado…</div>
        )}
      </div>
    </div>
  );
}
