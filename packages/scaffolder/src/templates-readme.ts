/**
 * @os/scaffolder — README.md do app gerado (passos do operador, doc 06, §6).
 */

import type { ClientAnswers } from './types';

export function appReadme(answers: ClientAnswers): string {
  const slug = answers.slug;
  const product = answers.productName ?? `${answers.displayName} OS`;

  if (answers.preset === 'static') {
    return `# ${product}

App gerado pelo **criador de OS** (Fase 4) — preset \`static\` (protótipo, sem backend).

## Rodar

\`\`\`bash
pnpm install                 # na raiz do monorepo (linka o workspace)
pnpm -C apps/${slug} dev     # http://localhost:5173
\`\`\`

Todos os dados são \`kind:'static'\` (embutidos em \`src/manifest.ts\`). Não há Neon,
login nem \`.env\`. Edite \`src/manifest.ts\` para ajustar menus, KPIs, tabelas e textos.

## Promover para dados reais (Neon)

Quando aprovar o protótipo, regenere com o preset \`full\` (ou adicione \`api/\` + \`db/\`
manualmente) para ligar login (Better Auth) e \`/api/query\` sobre uma view read-only.
`;
  }

  return `# ${product}

App gerado pelo **criador de OS** (Fase 4) — preset \`full\` (front + \`api/\` Hono +
\`db/\` Drizzle/Neon + Better Auth).

## Do zero ao ar (fluxo do operador)

\`\`\`text
1. pnpm install                              # na raiz (linka o workspace)
2. Criar o projeto Neon deste cliente        (console Neon) → copiar a DATABASE_URL
3. cp apps/${slug}/.env.example apps/${slug}/.env   # e preencher:
     NEON_DATABASE_URL=...  (owner — só scripts admin)
     BETTER_AUTH_SECRET=... (node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
4. pnpm -C apps/${slug} db:generate           # gera as migrations a partir do schema
5. pnpm -C apps/${slug} db:migrate            # aplica tabelas + views + grants
6. pnpm -C apps/${slug} db:provision-roles    # cria app_auth/app_query e grava no .env
7. pnpm -C apps/${slug} db:verify-grants      # (opcional) prova o isolamento no banco
8. pnpm -C apps/${slug} auth:create-user      # cria o admin (admin@${slug}.local — DEV)
9. pnpm -C apps/${slug} dev                   # API 8787 + Vite 5173 → http://localhost:5173
\`\`\`

## O que já vem pronto

- **Menus \`kpi-dashboard\`** ligados a \`/api/query\` (view read-only \`v_*\` na allowlist).
  A tabela base e a view têm **dados de exemplo/estrutura** — escreva o \`SELECT\` real da
  view em \`db/views.sql\` quando os dados do cliente existirem (a view É o contrato de
  segurança do que o cliente pode ver — doc 05, §4).
- **Demais blocos** (data-table, kanban, etc.) vêm com dados \`kind:'static'\` de exemplo.
  Para dados reais, crie uma view, registre-a na allowlist (\`api/query-allowlist.ts\`) e
  troque o \`dataSource\` do menu no \`src/manifest.ts\`.

## Segurança (não afrouxar)

- Nenhum segredo com prefixo \`VITE_\` (o Vite injeta \`VITE_*\` no bundle).
- A API roda com roles de **menor privilégio** (app_auth / app_query), não como owner.
- \`/api/query\` só lê **views da allowlist**, com colunas conhecidas e SQL parametrizado.

## Blocos sob medida

Telas únicas deste cliente vão em \`src/blocks/\` (registre no \`src/registry.ts\` com
prefixo \`custom:\`) — não no catálogo genérico \`@os/blocks\`.
`;
}
