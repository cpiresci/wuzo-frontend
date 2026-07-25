# wuzo-frontend — Fase 11a

Scaffold Vite/React que substitui o mockup antigo (`index.html` de 242 linhas)
por um app React de verdade. Primeira peça funcional: o ticker de mercado ao
vivo, portado 1:1 do `nexus-main` (`_buildTickerItems` / `_renderTicker` /
`updateTicker`) — consumo público de `/api/market/ticker`, com fallback pra
Binance direto e depois `/api/market/crypto`. Sem auth, sem estado de sessão
(isso entra nas subfases 11c em diante).

Tema portado do `nexus-main`: paleta dourado/preto, fonte Outfit +
JetBrains Mono, mesmos tokens de `:root`.

## Rodar no Termux

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

## Build de produção

```bash
npm run build       # gera dist/
npm run preview     # serve o build localmente pra conferir
```

## Configuração

Copie `.env.example` pra `.env` se precisar apontar `VITE_API_BASE` pra outro
ambiente além do padrão (`https://app.wuzo.com.br`).

## Próximas subfases (11b+)

- 11b — i18n (pt/en/es) + layout/shell completo
- 11c — Auth (login/registro) contra `/api/auth/*`
- 11d — Pipeline free (formulário + polling `/analyze/free`)
- 11e — Pipeline premium (polling ou SSE, decisão em aberto)
