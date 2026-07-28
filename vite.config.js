import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fase 10-pre — base relativo ("./") em vez de absoluto ("/").
// Funciona tanto na URL de teste do GitHub Pages (subpath,
// cpiresci.github.io/wuzo-frontend/) quanto no dominio final
// (wuzo.com.br, raiz) sem precisar reverter nada na hora da virada de DNS.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: {
    port: 5173,
  },
});
