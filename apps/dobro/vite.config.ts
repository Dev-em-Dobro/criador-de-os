import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// tsconfigPaths resolve @os/core e @os/blocks direto do código-fonte (tsconfig.base.json),
// então os packages internos são consumidos como source — HMR atravessa os packages.
// tailwindcss() (Tailwind 4) varre o module graph do Vite; como o core entra nesse
// grafo (source), suas classes utilitárias são detectadas. Reforço adicional via
// @source no CSS base do core (packages/core/src/theme/base.css).
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths({ root: '../..' })],
  server: {
    // Front e API compartilham a origem no browser: /api → API Hono (porta 8787).
    // Isso faz o cookie de sessão (Better Auth, HttpOnly, SameSite) funcionar sem
    // CORS. A connection string da Neon vive SÓ na API (server-side), nunca aqui.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
