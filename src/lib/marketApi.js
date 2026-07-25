// Fase 11a — port de _tickerFetch / _fetchBinanceDirect / updateTicker (nexus-main index.html)
// Backend Node (wuzo-node-services). Sobrescrever via VITE_API_BASE no .env se precisar
// apontar pra outro ambiente (ex: preview/staging).
export const BACKEND = import.meta.env.VITE_API_BASE || "https://app.wuzo.com.br";

function fetchWithTimeout(url, ms = 10000) {
  return Promise.race([
    fetch(url),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]);
}

function fmtPrice(price, prefix = "US$") {
  if (price >= 100) return prefix + price.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (price >= 1) return prefix + price.toFixed(4);
  return prefix + price.toFixed(8);
}

function chgSpan(chg) {
  const arrow = chg >= 0 ? "▲" : "▼";
  const cls = chg >= 0 ? "ticker-up" : "ticker-dn";
  return { arrow, cls };
}

/**
 * Constrói os itens do ticker a partir do payload de /api/market/ticker.
 * Port 1:1 de _buildTickerItems, mantendo a ordem: fear&greed, status de
 * mercado (NYSE/B3), índices, ações, cripto.
 */
export function buildTickerItems(data) {
  const items = [];

  if (data.fear_greed) {
    const fg = data.fear_greed;
    const cls = (fg.cls || "").toLowerCase();
    const color = cls.includes("extreme fear")
      ? "#e05252"
      : cls.includes("fear")
      ? "#e08060"
      : cls.includes("extreme greed")
      ? "#4aaf78"
      : cls.includes("greed")
      ? "#a0e060"
      : "var(--g)";
    items.push({
      html:
        `<span class="ticker-sym" style="color:${color}">${fg.emoji || "📊"} FEAR&GREED</span> ` +
        `<span class="ticker-price" style="color:${color}">${fg.price}/100</span> ` +
        `<span class="ticker-chg" style="color:${color}">${fg.cls}</span>`,
    });
  }

  const ms = data.market_status || {};
  const usCol = ms.us_session === "ABERTO" ? "#4aaf78" : "var(--dm2)";
  const brCol = ms.br_session === "ABERTO" ? "#4aaf78" : "var(--dm2)";
  items.push({
    html:
      `<span class="ticker-sym">MERCADOS</span> ` +
      `<span style="color:${usCol};font-size:.62rem">NYSE ${ms.us_session || "--"}</span> ` +
      `<span style="color:var(--dm2);font-size:.55rem"> | </span>` +
      `<span style="color:${brCol};font-size:.62rem">B3 ${ms.br_session || "--"}</span>`,
  });

  (data.indices || []).forEach((idx) => {
    const chg = parseFloat(idx.chg) || 0;
    const { arrow, cls } = chgSpan(chg);
    const price = parseFloat(idx.price);
    const pfmt =
      price >= 1000
        ? price.toLocaleString("en-US", { maximumFractionDigits: 0 })
        : price.toLocaleString("en-US", { maximumFractionDigits: 2 });
    items.push({
      html:
        `<span class="ticker-sym">${idx.label}</span> ` +
        `<span class="ticker-price">${pfmt}</span> ` +
        `<span class="${cls} ticker-chg">${arrow}${Math.abs(chg).toFixed(2)}%</span>`,
    });
  });

  (data.stocks || []).forEach((s) => {
    const chg = parseFloat(s.chg) || 0;
    const { arrow, cls } = chgSpan(chg);
    const price = parseFloat(s.price);
    const pfmt = fmtPrice2dec(price);
    items.push({
      html:
        `<span class="ticker-sym">${s.label}</span> ` +
        `<span class="ticker-price">${pfmt}</span> ` +
        `<span class="${cls} ticker-chg">${arrow}${Math.abs(chg).toFixed(2)}%</span>`,
    });
  });

  (data.crypto || []).forEach((c) => {
    const chg = parseFloat(c.chg) || 0;
    const { arrow, cls } = chgSpan(chg);
    const price = parseFloat(c.price);
    items.push({
      html:
        `<span class="ticker-sym">${c.label}</span> ` +
        `<span class="ticker-price">${fmtPrice(price)}</span> ` +
        `<span class="${cls} ticker-chg">${arrow}${Math.abs(chg).toFixed(2)}%</span>`,
    });
  });

  return items;
}

function fmtPrice2dec(price) {
  return "US$" + price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const BINANCE_MAP = {
  BTCUSDT: "BTC",
  ETHUSDT: "ETH",
  SOLUSDT: "SOL",
  BNBUSDT: "BNB",
  XRPUSDT: "XRP",
  DOGEUSDT: "DOGE",
  ADAUSDT: "ADA",
  AVAXUSDT: "AVAX",
  LINKUSDT: "LINK",
  MATICUSDT: "MATIC",
  TONUSDT: "TON",
  SHIBUSDT: "SHIB",
};

/** Fallback direto na Binance pública, sem passar pelo backend. Port de _fetchBinanceDirect. */
async function fetchBinanceDirect() {
  const syms = JSON.stringify(Object.keys(BINANCE_MAP));
  const r = await fetchWithTimeout(
    "https://api.binance.com/api/v3/ticker/24hr?symbols=" + encodeURIComponent(syms),
    6000
  );
  if (!r.ok) throw new Error("Binance " + r.status);
  const data = await r.json();
  return data
    .filter((d) => BINANCE_MAP[d.symbol])
    .map((d) => {
      const sym = BINANCE_MAP[d.symbol];
      const price = parseFloat(d.lastPrice);
      const chg = parseFloat(d.priceChangePercent);
      const { arrow, cls } = chgSpan(chg);
      return {
        html:
          `<span class="ticker-sym">${sym}</span> ` +
          `<span class="ticker-price">${fmtPrice(price)}</span> ` +
          `<span class="${cls} ticker-chg">${arrow}${Math.abs(chg).toFixed(2)}%</span>`,
      };
    });
}

const CRYPTO_PRIORITY = ["BTC", "ETH", "SOL", "BNB", "DOGE", "XRP", "ADA", "AVAX", "LINK"];

/** Fallback final: /api/market/crypto do backend. */
async function fetchCryptoFallback() {
  const r = await fetchWithTimeout(BACKEND + "/api/market/crypto", 8000);
  if (!r.ok) throw new Error("crypto fallback " + r.status);
  const d = await r.json();
  if (!(d.BTC && d.BTC.usd > 100)) return [];
  return CRYPTO_PRIORITY.filter((sym) => d[sym]).map((sym) => {
    const price = d[sym].usd || 0;
    const chg = d[sym].chg24h || 0;
    const { arrow, cls } = chgSpan(chg);
    return {
      html:
        `<span class="ticker-sym">${sym}</span> ` +
        `<span class="ticker-price">${fmtPrice(price)}</span> ` +
        `<span class="${cls} ticker-chg">${arrow}${Math.abs(chg).toFixed(2)}%</span>`,
    };
  });
}

/**
 * Port de updateTicker(): tenta /api/market/ticker (backend Node), cai pra
 * Binance direto, e por fim /api/market/crypto. Mesma cadeia, mesma ordem.
 * Retorna a lista de itens (nunca lança — cada etapa engole seu próprio erro,
 * igual ao original).
 */
export async function fetchTickerItems() {
  try {
    const r = await fetchWithTimeout(BACKEND + "/api/market/ticker", 12000);
    if (r.ok) {
      const data = await r.json();
      const items = buildTickerItems(data);
      if (items.length) return items;
    }
  } catch (e) {
    /* segue pro fallback, igual ao original */
  }

  try {
    const items = await fetchBinanceDirect();
    if (items.length) return items;
  } catch (e) {
    /* segue pro próximo fallback */
  }

  try {
    return await fetchCryptoFallback();
  } catch (e) {
    return [];
  }
}
