/**
 * @os/scaffolder — RELATÓRIO DE SEGURANÇA por OS (Markdown, versionado).
 *
 * `securityReport(answers, views)` produz o conteúdo do relatório salvo em
 * `security-reports/<slug>.md` (raiz do monorepo) na criação de cada OS. É a
 * trilha de auditoria "que defesas este OS nasceu com".
 *
 * Regra de honestidade (Constitution, Art. IV — No Invention): o relatório
 * ESPELHA a §6 do doc `docs/security/seguranca-na-criacao-de-os.md` (a lista
 * fiel de controle → arquivo gerado). O conteúdo MUDA com o preset:
 *  - `full`  → lista TODAS as camadas de banco/API que o scaffolder materializa;
 *  - `static`→ deixa explícito que só há front/manifesto e que as camadas de
 *              banco/API NÃO estão presentes (fail-honest — nada de listar
 *              defesa que este OS não tem).
 */

import type { ViewSpec } from './blocks';
import type { ClientAnswers } from './types';

/** Data de emissão (YYYY-MM-DD) — momento em que o OS foi gerado. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Monta o Markdown do relatório de segurança do OS a partir das respostas e das
 * views a materializar. Puro (sem I/O) — o `generate.ts` grava o retorno.
 */
export function securityReport(answers: ClientAnswers, views: ViewSpec[]): string {
  const productName = answers.productName ?? `${answers.displayName} OS`;
  const isFull = answers.preset === 'full';
  const date = today();

  const header = `# Relatório de Segurança — ${answers.displayName}

> Gerado automaticamente pelo **@os/scaffolder** na criação deste OS.
> Este arquivo é a trilha de auditoria das defesas com que \`apps/${answers.slug}\`
> nasceu. Fonte de verdade dos controles: \`docs/security/seguranca-na-criacao-de-os.md\`
> (§6). Nada aqui é inventado — cada camada aponta para um arquivo real deste OS.

| Campo | Valor |
|---|---|
| Cliente | ${answers.displayName} |
| Produto | ${productName} |
| Slug | \`${answers.slug}\` |
| Pasta | \`apps/${answers.slug}\` |
| Preset | \`${answers.preset}\` |
| Data de emissão | ${date} |
`;

  return isFull ? renderFull(answers, views, header) : renderStatic(answers, header);
}

// ------------------------------------------------------------
// Preset `full` — todas as camadas de banco/API aplicadas
// ------------------------------------------------------------

function renderFull(answers: ClientAnswers, views: ViewSpec[], header: string): string {
  const slug = answers.slug;
  const viewCount = views.length;
  const viewList =
    viewCount > 0
      ? views.map((v) => `\`${v.view}\` (colunas: ${v.exposed.join(', ')})`).join('; ')
      : 'nenhuma view de negócio no manifesto ainda (nenhum menu `kind:\'query\'`)';

  const summary = `## Resumo executivo

Este OS nasce com a postura de segurança padrão da fábrica (preset \`full\`): banco
isolado por cliente (um projeto Neon dedicado), a API nunca conecta como owner (usa
roles de menor privilégio \`app_auth\` e \`app_query\`), \`SELECT\` de \`PUBLIC\` revogado com
grants granulares, leitura de dados de negócio só via allowlist fechada de ${viewCount}
view(s) read-only com SQL parametrizado, autenticação obrigatória (fail-closed) antes
de tocar no banco, credenciais dos roles provisionadas com senha forte e o boot
**fail-closed em produção** se elas faltarem. Segredos que o cliente salva
(\`app_settings\`, modelo BYOK) ficam cifrados em repouso com AES-256-GCM.
`;

  const table = `## Camadas de segurança aplicadas

| Camada | O que protege | Arquivo neste OS |
|---|---|---|
| Isolamento multitenant (um Neon por cliente) | Impede que a query de um cliente alcance o banco de outro (isolamento físico, sem \`tenant_id\`) | \`apps/${slug}/db/client.ts\` (connection string só server-side) |
| Roles de menor privilégio (\`app_auth\`, \`app_query\`) | A API nunca conecta como owner; cada caminho enxerga só o que precisa | \`apps/${slug}/db/grants.sql\`, \`apps/${slug}/db/client.ts\` |
| \`REVOKE SELECT ... FROM PUBLIC\` + grants granulares | Anula o \`SELECT\` que o Neon dá a \`PUBLIC\`; só os grants explícitos valem | \`apps/${slug}/db/grants.sql\` |
| Views read-only (contrato de exposição) | A API lê a view, nunca a tabela crua; a view roda com privilégio do owner dela | \`apps/${slug}/db/views.sql\` |
| Provisioning de senha forte + rotação idempotente | Senha \`randomBytes(24)\` por role; segredo nunca impresso; re-rodar rotaciona | \`apps/${slug}/db/provision-roles.ts\` |
| Prova de isolamento por role (\`verify-grants\`) | Teste executável que assume cada role e falha (exit 1) se um grant vazar | \`apps/${slug}/db/verify-grants.ts\` |
| Allowlist fechada de views | View fora da lista → 403; coluna fora da view → 400 | \`apps/${slug}/api/query-allowlist.ts\` |
| SQL parametrizado + validação de op/dir/limit | Valores sempre como bind param; \`op\`/\`dir\` em conjunto fechado; \`limit\` com teto | \`apps/${slug}/api/query-builder.ts\` |
| Auth-first + \`/api/query\` executando como \`app_query\` | Sessão válida ou 401 antes de tocar no banco; runtime como role de menor privilégio | \`apps/${slug}/api/app.ts\` |
| Better Auth (Drizzle adapter, \`dbAuth\`) | Login e sessões no banco do próprio cliente, via role \`app_auth\` | \`apps/${slug}/api/auth.ts\` |
| Env server-side + fail-closed em produção | Segredos só server-side (sem \`VITE_\`); sem \`AUTH_/QUERY_DATABASE_URL\` em produção, o boot aborta | \`apps/${slug}/api/env.ts\` |
| Cifragem AES-256-GCM de \`app_settings\` (BYOK) | Segredos do cliente cifrados em repouso; valor em claro nunca volta ao browser | \`apps/${slug}/api/env.ts\` (\`getSettingsEncKey\`) → \`packages/server/src/settings.ts\` |
`;

  const blocks = `## Detalhe por área

### Isolamento multitenant
Cada OS tem seu **próprio projeto Neon (Postgres)** — não há tabela compartilhada nem
coluna \`tenant_id\`. É impossível uma query de um cliente cruzar para o banco de outro.
A connection string vive só server-side (\`apps/${slug}/api/env.ts\`, sem prefixo \`VITE_\`).

### Banco — roles, REVOKE de PUBLIC, grants
\`apps/${slug}/db/grants.sql\` cria dois roles de menor privilégio (\`app_auth\`, \`app_query\`)
como \`NOLOGIN\`, **zera** privilégios amplos (\`REVOKE ALL ... FROM <role>\`), **revoga o
\`SELECT\` que o Neon concede a \`PUBLIC\`** e concede de forma granular: \`app_auth\` faz CRUD
só nas tabelas do Better Auth (+ capacidades de fábrica), \`app_query\` faz \`SELECT\` só nas
views \`v_*\`. Views deste OS: ${viewList}.

### Credenciais — provisioning, rotação e fail-closed
\`apps/${slug}/db/provision-roles.ts\` gera senha forte (\`randomBytes(24)\`, só-hex), aplica
\`ALTER ROLE ... LOGIN PASSWORD\`, testa a conexão real do role e grava a connection string
no \`.env\` — **sem nunca imprimir o segredo**. Re-rodar rotaciona a senha (idempotente).
Em produção, \`apps/${slug}/api/env.ts\` é **fail-closed**: sem \`AUTH_DATABASE_URL\` /
\`QUERY_DATABASE_URL\`, o boot **aborta** em vez de cair no owner (em DEV, cai no owner com WARN).
\`apps/${slug}/db/verify-grants.ts\` prova o isolamento assumindo cada role e falha (exit 1)
se algum grant não estiver como esperado.

### API — allowlist, query-builder, auth-first
\`/api/query\` (\`apps/${slug}/api/app.ts\`) tem três defesas: (1) auth-first — sessão válida
ou 401 antes de tocar no banco; (2) allowlist fechada de views (\`apps/${slug}/api/query-allowlist.ts\`)
— view fora da lista → 403, coluna fora da view → 400, leitura de tabela crua → 403; (3) SQL
sempre parametrizado (\`apps/${slug}/api/query-builder.ts\`) — valores como bind param, \`op\`/\`dir\`
em conjunto fechado, \`limit\` com teto de 1000. No runtime, o endpoint executa como \`app_query\`.

### Cifragem de segredos do cliente
Os segredos que o cliente salva em Configurações (\`app_settings\`, modelo BYOK) são cifrados
em repouso com **AES-256-GCM** (IV aleatório por gravação; tag de autenticação detecta
adulteração), herdado de \`@os/server\` (\`packages/server/src/settings.ts\`). Só chaves do
registro fechado \`KNOWN_SETTINGS\` são aceitas, e o valor em claro **nunca** volta ao browser
(só um hint mascarado \`••••<4 últimos>\`). A chave de cifra vem de \`getSettingsEncKey\`
(\`apps/${slug}/api/env.ts\`).
`;

  return [header, summary, table, blocks, operatorSection(slug, true), footer()].join('\n');
}

// ------------------------------------------------------------
// Preset `static` — só front/manifesto; sem banco/API
// ------------------------------------------------------------

function renderStatic(answers: ClientAnswers, header: string): string {
  const slug = answers.slug;

  const summary = `## Resumo executivo

Este OS foi gerado no preset **\`static\`**: só o front (React + manifesto config-driven),
com dados de exemplo embutidos e **sem** camada de banco (\`db/\`) ou de API (\`api/\`).
Roda com \`pnpm dev\` sem Neon — é o formato de protótipo/aprovação. Como não há backend
nem banco, as camadas de segurança de banco/API **não se aplicam a este OS**.
`;

  const warning = `## ⚠️ Preset enxuto (\`static\`) — camadas de banco/API não aplicadas neste OS

Para ser honesto sobre a postura real: este OS **não tem** as defesas de banco e de API
que o preset \`full\` gera. Não estão presentes (porque não há \`db/\` nem \`api/\`):

- Roles de menor privilégio (\`app_auth\`/\`app_query\`), \`REVOKE PUBLIC\` e grants granulares.
- Views read-only e allowlist fechada de views (\`/api/query\`).
- SQL parametrizado / query-builder.
- Autenticação Better Auth (fail-closed) — no \`static\`, \`auth\` fica \`false\` no manifesto.
- Provisioning de credenciais, fail-closed em produção e prova de isolamento por role.
- Cifragem AES-256-GCM de \`app_settings\` (não há \`app_settings\` sem backend).

O que existe neste OS é a camada de **front/manifesto**:

| Camada | O que protege | Arquivo neste OS |
|---|---|---|
| Sem segredos no bundle | O front não carrega connection string nem segredo (regra "sem \`VITE_\`" de segredo) | \`apps/${slug}/src/manifest.ts\` (só config pública) |
| Dados de exemplo embutidos | Não há acesso a dado real de cliente — o preview usa amostras genéricas | \`apps/${slug}/src/manifest.ts\` (\`dataSource: { kind: 'static' }\`) |

> **Se este OS for promovido para dados reais**, regenere-o (ou migre-o) para o preset
> \`full\` — aí sim as camadas de banco/API acima passam a valer, e este relatório será
> reemitido com a lista completa.
`;

  return [header, summary, warning, operatorSection(slug, false), footer()].join('\n');
}

// ------------------------------------------------------------
// Blocos compartilhados
// ------------------------------------------------------------

function operatorSection(slug: string, isFull: boolean): string {
  if (!isFull) {
    return `## Responsabilidade do operador (não automatizado)

Para o preset \`static\` não há passos de banco. O operador só precisa:

1. \`pnpm install\` e \`pnpm -C apps/${slug} dev\` para o preview.

Se for promover para produção com dados reais, migre para o preset \`full\` e siga o
checklist de banco (roles, \`.env\`, migrations). Sobre backup e postura operacional, ver
\`docs/operations/backup-neon.md\`.
`;
  }
  return `## Responsabilidade do operador (não automatizado)

O scaffolder gera as defesas, mas alguns passos dependem do operador para que elas fiquem
de fato ativas:

1. **Criar o projeto Neon** dedicado deste cliente (o scaffolder não cria o projeto Neon).
2. Preencher \`apps/${slug}/.env\` (ou o \`.env\` da raiz) com \`DATABASE_URL\`/\`NEON_DATABASE_URL\`
   e \`BETTER_AUTH_SECRET\` — nunca com prefixo \`VITE_\`.
3. \`pnpm -C apps/${slug} db:migrate\` (aplica migrations + views + grants).
4. \`pnpm -C apps/${slug} db:provision-roles\` (cria LOGIN dos roles e grava \`AUTH_DATABASE_URL\`/\`QUERY_DATABASE_URL\`).
5. **Garantir \`NODE_ENV=production\` no ambiente de deploy** — o gate fail-closed depende dessa var.
6. (Recomendado) \`pnpm -C apps/${slug} db:verify-grants\` no checklist de deploy.
7. Configurar backup do banco — ver \`docs/operations/backup-neon.md\`.
`;
}

function footer(): string {
  return `---

Documento completo dos controles e das lacunas: \`docs/security/seguranca-na-criacao-de-os.md\`.
Postura de backup: \`docs/operations/backup-neon.md\`.
`;
}
