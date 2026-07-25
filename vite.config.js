import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fase 11a — scaffold Vite/React do WUZO frontend.
// base "/" por padrão; se o deploy final for GitHub Pages num subpath,
// ajustar aqui antes do build (ex: base: "/wuzo-frontend/").
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
