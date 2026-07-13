/**
 * @os/scaffolder — conteúdo dos arquivos do FRONT (e config comum).
 *
 * Espelha a estrutura provada de `apps/dobro` (full) e `apps/neurovida` (static),
 * parametrizada por slug/preset. Cada função retorna o texto de um arquivo.
 */

import type { Preset } from './types';

export function frontPackageJson(slug: string, preset: Preset, productName: string): string {
  const isFull = preset === 'full';

  const scripts: Record<string, string> = isFull
    ? {
        dev: 'concurrently -n api,web -c blue,magenta "pnpm dev:api" "pnpm dev:web"',
        'dev:web': 'vite',
        'dev:api': 'tsx watch api/server.ts',
        build: 'tsc --noEmit && vite build',
        typecheck: 'tsc --noEmit && tsc -p tsconfig.node.json --noEmit',
        preview: 'vite preview',
        'db:generate': 'drizzle-kit generate',
        'db:migrate': 'tsx db/migrate.ts',
        'db:provision-roles': 'tsx db/provision-roles.ts',
        'db:verify-grants': 'tsx db/verify-grants.ts',
        'auth:create-user': 'tsx api/scripts/create-user.ts',
      }
    : {
        dev: 'vite',
        build: 'tsc --noEmit && vite build',
        typecheck: 'tsc --noEmit',
        preview: 'vite preview',
      };

  const dependencies: Record<string, string> = {
    '@os/blocks': 'workspace:*',
    '@os/core': 'workspace:*',
    'lucide-react': '^1.17.0',
    react: '^19.2.0',
    'react-dom': '^19.2.0',
    ...(isFull
      ? {
          '@hono/node-server': '^2.0.8',
          '@neondatabase/serverless': '^1.1.0',
          'better-auth': '^1.6.23',
          'drizzle-orm': '^0.45.2',
          hono: '^4.12.29',
        }
      : {}),
  };

  const devDependencies: Record<string, string> = {
    '@tailwindcss/vite': '^4.1.18',
    '@types/react': '^19.2.7',
    '@types/react-dom': '^19.2.3',
    '@vitejs/plugin-react': '^5.1.1',
    tailwindcss: '^4.1.18',
    typescript: '~5.9.3',
    vite: '^7.3.1',
    'vite-tsconfig-paths': '^5.1.4',
    ...(isFull
      ? {
          '@types/node': '^22.10.0',
          concurrently: '^10.0.3',
          dotenv: '^17.4.2',
          'drizzle-kit': '^0.31.10',
          tsx: '^4.23.0',
        }
      : {}),
  };

  const pkg = {
    name: `@app/${slug}`,
    version: '0.0.0',
    private: true,
    type: 'module',
    description: `${productName} — gerado pelo criador de OS (Fase 4).`,
    scripts,
    dependencies: sortKeys(dependencies),
    devDependencies: sortKeys(devDependencies),
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

function sortKeys(obj: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

export function indexHtml(productName: string): string {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(productName)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function viteConfig(preset: Preset): string {
  const proxy =
    preset === 'full'
      ? `
  server: {
    // Front e API compartilham a origem no browser: /api → API Hono (porta 8787),
    // para o cookie de sessão (Better Auth) funcionar sem CORS. A connection string
    // da Neon vive SÓ na API (server-side), nunca aqui.
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },`
      : '';

  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// tsconfigPaths resolve @os/core e @os/blocks direto do código-fonte (source):
// HMR atravessa os packages internos. tailwindcss() (Tailwind 4) varre o module
// graph do Vite; como core/blocks entram nele (source), suas classes são detectadas.
export default defineConfig({
  plugins: [react(), tailwindcss(), tsconfigPaths({ root: '../..' })],${proxy}
});
`;
}

export function tsconfigApp(preset: Preset): string {
  const exclude = preset === 'full' ? `,\n  "exclude": ["api", "db", "drizzle.config.ts"]` : '';
  return `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]${exclude}
}
`;
}

export function tsconfigNode(): string {
  return `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["node"],
    "jsx": "react-jsx"
  },
  "include": ["api", "db", "drizzle.config.ts"]
}
`;
}

export function indexCss(): string {
  return `/* Entrada de estilos do app.
   Ordem: (1) fontes do tema do core; (2) Tailwind 4; (3) tema base do @os/core. */

@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300..800;1,400&family=JetBrains+Mono:wght@400;500;700&display=swap');

@import 'tailwindcss';

@import '@os/core/theme/base.css';

/* Reforço explícito do scan do Tailwind sobre core e blocks (consumidos como
   source). Caminho relativo a partir de apps/<cliente>/src/. */
@source '../../../packages/core/src';
@source '../../../packages/blocks/src';
`;
}

export function mainTsx(exportName: string, preset: Preset): string {
  if (preset === 'full') {
    return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OsApp, createOsClient } from '@os/core';
import { ${exportName} } from './manifest';
import { registry } from './registry';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

// Cliente de API do app: fala com a API Hono (/api/query, /api/auth/*) via o
// proxy do Vite. Config vem de \`manifest.dataApi\` (só base URL pública).
const client = createOsClient(${exportName}.dataApi);

createRoot(root).render(
  <StrictMode>
    <OsApp manifest={${exportName}} registry={registry} client={client} />
  </StrictMode>,
);
`;
  }
  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { OsApp } from '@os/core';
import { ${exportName} } from './manifest';
import { registry } from './registry';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

// Protótipo estático: sem backend/auth (dados embutidos no manifesto).
createRoot(root).render(
  <StrictMode>
    <OsApp manifest={${exportName}} registry={registry} />
  </StrictMode>,
);
`;
}

export function registryTs(): string {
  return `/**
 * Montagem do registry de blocos (inversão de controle). O APP registra as
 * implementações; o core só resolve. \`registerDefaultBlocks\` registra todo o
 * catálogo genérico de @os/blocks. Blocos custom deste cliente entrariam DEPOIS.
 */

import { createRegistry } from '@os/core';
import { registerDefaultBlocks } from '@os/blocks';

export const registry = createRegistry();
registerDefaultBlocks(registry);
`;
}

/** SVG placeholder simples (inicial da marca sobre a cor primária). */
export function logoSvg(letter: string, brand: string): string {
  const L = (letter || 'O').charAt(0).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="logo">
  <rect width="64" height="64" rx="14" fill="${brand}" />
  <text x="50%" y="50%" dy="0.35em" text-anchor="middle" font-family="Hanken Grotesk, sans-serif" font-size="34" font-weight="700" fill="#ffffff">${escapeHtml(L)}</text>
</svg>
`;
}

export function drizzleConfig(): string {
  return `/**
 * Configuração do drizzle-kit (geração de migrations a partir de db/schema.ts).
 * A connection string é lida server-side (api/env.ts) — nunca hardcoded aqui.
 */

import { defineConfig } from 'drizzle-kit';
import { getDatabaseUrl } from './api/env';

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  verbose: true,
  strict: true,
});
`;
}

export function envExample(slug: string): string {
  return `# ============================================
# @app/${slug} — variáveis de ambiente
# Copie para .env (NÃO commitar). Segredos ficam SÓ no servidor.
# REGRA DE OURO: nenhum segredo com prefixo VITE_ (o Vite injeta VITE_* no bundle).
# ============================================

# --- Neon (Postgres) OWNER — usado SÓ por scripts admin (migrate/grants/provision) ---
# A connection string canônica pode vir do .env da RAIZ (NEON_DATABASE_URL) ou aqui.
# ⚠️ OWNER lê/escreve/DROP tudo — o RUNTIME da API usa os roles abaixo, não este.
NEON_DATABASE_URL=
DATABASE_URL=

# --- Roles de MENOR PRIVILÉGIO para a API (hardening — doc 05, §4/§6) ---
#   AUTH_DATABASE_URL  → role app_auth  (R/W só nas tabelas do Better Auth)
#   QUERY_DATABASE_URL → role app_query (SELECT só nas views v_*)
# Gere-os com: pnpm db:migrate && pnpm db:provision-roles (grava aqui/no .env da raiz).
# Vazios = fallback OWNER com WARN (aceitável só em DEV).
AUTH_DATABASE_URL=
QUERY_DATABASE_URL=

# --- Better Auth (self-hosted) — server-side ---
# Gere um valor aleatório:
#   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5173

# --- API local (dev) ---
API_PORT=8787
`;
}
