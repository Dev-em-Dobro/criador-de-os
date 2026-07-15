import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// tsconfigPaths resolve @os/core e @os/blocks direto do código-fonte; tailwindcss()
// (Tailwind 4) varre o module graph. O proxy leva /api → a API Hono local (que fala
// com a Claude API server-side), então front e API compartilham a origem no browser.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths({ root: '../..' })],
  server: {
    // Porta fixa: o Better Auth valida a origin (BETTER_AUTH_URL=http://localhost:5173).
    // strictPort evita o Vite pular p/ 5174+ quando a 5173 está ocupada — o que faria
    // o login falhar com 401 por mismatch de origin. Melhor falhar explícito.
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
});
