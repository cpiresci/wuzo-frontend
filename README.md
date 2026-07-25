# wuzo-frontend — Fase 11b

Scaffold Vite/React que substitui o mockup antigo (`index.html` de 242 linhas)
por um app React de verdade.

**11a** — ticker de mercado ao vivo, portado 1:1 do `nexus-main`
(`_buildTickerItems` / `_renderTicker` / `updateTicker`) — consumo público de
`/api/market/ticker`, com fallback pra Binance direto e depois
`/api/market/crypto`. Tema portado: paleta dourado/preto, fonte Outfit +
JetBrains Mono, mesmos tokens de `:root`.

**11b** — i18n real com `react-i18next` (porte das 47 chaves de
`I18N`/`t()`/`applyTranslations` do `nexus-main` pra pt/en/es em
`src/i18n/locales/`), com **detecção automática de idioma** do
navegador/SO — importante pro Play Store global — e fallback pra pt. Mesma
chave de `localStorage` (`wuzo_lang`) do app antigo, então quem já tinha
idioma salvo mantém a preferência na migração. Header/shell (`Header.jsx`,
`LanguageSwitcher.jsx`) portados de `.hdr`/`.logo`/`.lang-btn`. Ainda sem
auth nem telas de negócio — isso entra na 11c.

> `login_switch`/`reg_switch` foram parametrizados com `{{link}}` em vez do
> HTML com `onclick` inline do original (que dependia de `switchModal()`
> global, que não existe em React) — a 11c consome essas chaves com
> `<Trans>` e um `<button onClick>` de verdade.

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

## Próximas subfases (11c+)

- 11c — Auth (login/registro) contra `/api/auth/*`
- 11d — Pipeline free (formulário + polling `/analyze/free`)
- 11e — Pipeline premium (polling ou SSE, decisão em aberto)
