# 08 — Riscos e Decisões em Aberto

> Riscos técnicos com mitigação, e decisões que precisam do dono antes de codar. Honestidade acima de otimismo.
>
> **Revisado (2026-07-12): Firebase → NeonDB.** Três decisões antes em aberto foram **RESOLVIDAS pelo dono** (forma de acesso = backend/API por app; auth = Better Auth obrigatória; topologia = 1 projeto Neon por cliente). R-5 foi reescrito (o segredo agora é a `DATABASE_URL` — mais crítico). Novos riscos: **R-8** (segurança do endpoint de query genérico), **R-9** (ausência de realtime) e **R-10** (superfície de ops do backend por app). D-4 (hospedagem) reavaliado para o novo cenário.

## Parte 1 — Riscos técnicos

### R-1 · Seções muito acopladas resistem à generalização · Severidade: Média
O Dobro OS é ~70% código específico (Scudo, Curseduca, lançamentos, financeiro). Tentar generalizar tudo é caro e sem retorno.
- **Mitigação:** classificar em 3 baldes (doc 01) e **só generalizar após 2 casos reais**. O específico vira `custom:` block dentro de `apps/dobro`, não bloco genérico. O manifesto continua sendo a fonte de navegação mesmo para telas custom, então nada é "gambiarra fora do sistema".
- **Sinal de alerta:** se na Fase 3 um menu do Dobro não couber no manifesto/adapter, é sinal de que o schema precisa de mais um `kind`/escape hatch — ajustar o core, não forçar o bloco.

### R-2 · Custo de N projetos Neon · Severidade: Média (cresce com escala)
Um projeto Neon por cliente é ótimo para poucos clientes premium, mas o custo operacional (criar projeto Neon, rodar migrations, provisionar admin, configurar `DATABASE_URL`, deploy da API) cresce linear com N.
- **Mitigação de curto prazo:** scaffolder automatiza a geração do app; documentar/automatizar o setup Neon (`neonctl` / API da Neon) e as migrations (`drizzle-kit`). Neon tem **scale-to-zero**, então projetos ociosos custam quase nada.
- **Ponto de reavaliação:** a partir de ~algumas dezenas de clientes, avaliar modelo alternativo (multi-tenant num único Postgres com `tenant_id` + RLS, ou um projeto Neon com um database por cliente). Isso é uma **decisão futura**, não agora — o isolamento simples vence enquanto o volume é baixo. Documentado como D-2.

### R-3 · Versionamento do core quando um cliente diverge · Severidade: Média
Todos herdam o `@os/core` do workspace. Se um cliente precisar congelar numa versão antiga (ou o core mudar algo que quebre um cliente), o modelo "todos na mesma versão" tensiona.
- **Mitigação:** manter o contrato do core estável (blocos e manifesto versionados — `manifest.version`); mudanças breaking do core exigem bump de `manifest.version` + migração. Evitar breaking changes; preferir aditivo.
- **Decisão relacionada:** D-3.

### R-4 · Refactor da camada de dados toca muitos arquivos · Severidade: Média
Trocar os ~50 hooks Firestore por chamadas ao cliente de API (`/api/query`) mexe em muitos arquivos, e cada tela ganha uma **view read-only** correspondente no Neon. Risco de regressão silenciosa e de comportamento diferente (realtime→refresh).
- **Mitigação:** a Fase 3 migra o Dobro em paralelo e valida "sem perda de capacidade" menu a menu. Migração por menu: criar a view, apontar o `dataSource` para ela, validar o dado. Não migrar tudo de uma vez — só os menus que entram no manifesto. Validar explicitamente a troca realtime→refresh como comportamento esperado.

### R-5 · Segurança: a `DATABASE_URL` é segredo real e não pode vazar · Severidade: **Alta → Crítica** (se ignorada)
No modelo anterior, a `apiKey` do Firebase ia para o bundle e **não era segredo** (a segurança vinha de auth+rules). **Agora é o oposto:** a **connection string da Neon (`DATABASE_URL`) dá acesso total e irrestrito ao Postgres do cliente** — é segredo de verdade. Se vazar (bundle, log, repositório, prefixo `VITE_` por engano), o cliente está comprometido por completo.
- **Mitigação (prioridade máxima):**
  - `DATABASE_URL` e `BETTER_AUTH_SECRET` vivem **só** no `.env` server-side, lidos apenas pelas funções `api/`. **Nunca** com prefixo `VITE_` (o Vite injeta `VITE_*` no bundle). Grep de CI bloqueia qualquer `VITE_*` com valor sensível.
  - `.env` fora do git (`.env.example` com placeholders versionado).
  - No hosting, `DATABASE_URL` é env de **servidor** (não de build exposto ao client).
  - Auth (Better Auth) validada **antes** de qualquer query; sem sessão → 401. A conexão ao banco só acontece server-side, após auth.
  - Tokens de APIs externas (Scudo/Curseduca) também server-side, atrás das rotas `api/`.
- **Flag de segurança:** nenhum cliente entra em produção sem: (a) grep de CI confirmando zero segredo com `VITE_`; (b) auth validada end-to-end; (c) allowlist do `/api/query` ativa (ver R-8).

### R-6 · Manifesto editado por não-dev quebra o app · Severidade: Baixa-Média
O valor do sistema é o operador editar o manifesto sem dev. Um manifesto malformado pode dar tela branca.
- **Mitigação:** validação zod no load (fail-fast com mensagem clara), comando `pnpm os validate`, e o scaffolder gerando manifestos já válidos. Erros de config viram mensagem legível, não crash.

### R-7 · Deriva de escopo na extração (over-engineering do core) · Severidade: Média
Risco de transformar o core numa plataforma genérica demais antes de ter clientes.
- **Mitigação:** seguir o plano faseado; o core só ganha capacidade quando um caso real (Dobro ou piloto) precisa. Time-box na Fase 1; POC do piloto (Fase 3) antes de formalizar mais blocos.

### R-8 · Segurança do endpoint de query genérico (SQL injection / acesso a tabela arbitrária) · Severidade: **Alta**
O `/api/query` recebe um `dataSource` declarativo do front (que qualquer um pode forjar) e o transforma em SQL. Um design ingênuo permitiria: (a) **SQL injection** (concatenar valores na string), ou (b) **acesso arbitrário** (ler qualquer tabela/coluna, ex.: a tabela `user` do Better Auth, ou dados de outro escopo). Este é o risco mais sério introduzido pelo novo modelo.
- **Mitigação (3 defesas em camadas, todas obrigatórias — doc 05 §4):**
  1. **Auth-first (fail-closed):** valida a sessão Better Auth **antes** de tocar no banco; sem sessão → 401.
  2. **Allowlist por views read-only:** o manifesto só pode referenciar **views** explicitamente permitidas (`v_<menu>`), nunca tabelas cruas. A view **é** o contrato de exposição (colunas, filtros, agregações). `view`/colunas fora da allowlist → 403/400. `GRANT SELECT` só nas views (não nas tabelas base) reforça no nível do banco: o role do `DATABASE_URL` da API **não consegue** ler tabelas fora das views.
  3. **SQL sempre parametrizado (bind):** todo `value` de filtro vira bind param (`$1`...) via query builder (Drizzle/Kysely), nunca concatenado. Identificadores (view/coluna/dir) só entram se casarem com o schema/allowlist. `op` num conjunto fechado; `limit` com teto.
- **Sinal de alerta:** qualquer PR que faça o `/api/query` aceitar SQL cru, nome de tabela livre, ou string interpolada → **bloquear**. Teste de segurança obrigatório: tentar ler `user`/`session` e uma view não-permitida deve retornar 403.

### R-9 · Ausência de realtime (Postgres não tem `onSnapshot`) · Severidade: Baixa-Média
O Firestore atualizava a tela sozinho quando o dado mudava. Postgres, no caminho HTTP serverless, não. Telas que "piscavam ao vivo" no Dobro OS passam a depender de polling/refresh.
- **Mitigação:** `dataSource.refetch` (`manual` | `interval`) por tela (doc 05 §8); default `manual`, `interval` de 30–60s para KPI/board. Para dashboards de gestão isso é adequado — o dado não muda a cada segundo.
- **Escape futuro (só sob demanda):** `LISTEN/NOTIFY` do Postgres via WebSocket próprio, ou pub/sub. Não é requisito inicial.
- **Sinal de alerta:** se um cliente tiver um caso genuíno de tempo real (ex.: monitoramento operacional segundo a segundo), reavaliar — mas não construir preventivamente.

### R-10 · Backend por app amplia a superfície de ops/deploy vs SPA estático · Severidade: Média
Antes cada app era um SPA estático (deploy trivial, sem runtime). Agora cada app tem **funções serverless** (runtime, env de servidor, cold starts, versão de Node/runtime, migrations a rodar). Mais partes móveis por cliente = mais pontos de falha operacional.
- **Mitigação:** padronizar via scaffolder (mesmo esqueleto `api/`/`db/` para todos); Hono roda igual em Vercel/Cloudflare/Node (portabilidade reduz lock-in); migrations versionadas e idempotentes (`drizzle-kit`); observabilidade mínima por cliente (log de erros no `/api/query`). Documentar o runbook de deploy no README gerado.
- **Trade-off honesto:** é o custo de mover o segredo (connection string) para fora do bundle. Vale a pena — a alternativa (banco acessível do client) é insegura por construção. Mas o dono deve saber que "criar um cliente" agora inclui operar um backend, não só publicar arquivos estáticos.

---

## Parte 2 — Decisões

> **D-1, D-2 e a forma de acesso a dados foram RESOLVIDAS pelo dono** (premissas desta revisão). Ficam registradas como decididas. As demais seguem com recomendação da Aria.

| ID | Decisão | Opções | Status / Recomendação da Aria |
|---|---|---|---|
| **D-1** | Auth é obrigatória? | (a) sempre obrigatória; (b) opcional por cliente | ✅ **RESOLVIDA: (a) obrigatória, via Better Auth (self-hosted).** Toda requisição de dados exige sessão. `settings.auth.enabled: false` só para demo local. |
| **D-2** | Modelo de tenancy | (a) 1 projeto Neon por cliente; (b) multi-tenant num Postgres único | ✅ **RESOLVIDA: (a) 1 projeto Neon por cliente.** Reavaliar (b) em ~dezenas de clientes (RLS + `tenant_id`), decisão futura. Não construir (b) preventivamente. |
| **D-3** | Política de versão do core quando um cliente diverge | (a) todos na mesma versão (default); (b) "pin" por app; (c) feature-flags no manifesto | **(a) + (c)**: todos herdam o core; diferenças por cliente saem via config/flags no manifesto, não por fork. Evitar (b) — vira N cores para manter. **Em aberto.** |
| **D-4** | Hospedagem dos apps (front + funções serverless) | (a) Vercel por cliente; (b) Cloudflare Pages+Workers; (c) Netlify | **(a) Vercel na v1** — front + Serverless Functions no mesmo deploy, first-class com Hono e Neon, env de servidor por projeto. **(b) Cloudflare como plano B** se custo/latência em escala pedirem. A Neon (dados) é separada do hosting. **Decisão do dono.** *(Reavaliado: antes era Firebase Hosting — não serve mais, pois agora há backend.)* |
| **D-5** | Forma do scaffolder na v1 | (a) template git + script; (b) CLI interativo desde já | **(a) primeiro** (mais rápido), evoluir para (b) quando o volume justificar. **Em aberto.** |
| **D-6** | O scaffolder cria o projeto Neon automaticamente? | (a) manual (console Neon) na v1; (b) automatizar via `neonctl`/API da Neon | **(a) na v1**, README documenta os passos; automatizar (b) só se a criação manual virar gargalo. **Em aberto.** |
| **D-7** | Ferramenta de monorepo | (a) pnpm workspaces + Turborepo; (b) só pnpm workspaces; (c) Nx | **(a)**, Turbo entra quando houver 2+ apps. pnpm workspaces é o mínimo. **Em aberto.** |
| **D-8** | Query builder do backend | (a) Drizzle; (b) Kysely | **(a) Drizzle** — adapter oficial do Better Auth + migrations integradas (`drizzle-kit`) + schema-as-code (dá a allowlist de graça). Kysely é ótimo builder, mas exigiria colar auth+migrations por fora. Para o `/api/query`, o que protege é allowlist+bind, não a marca. **Recomendação; decisão do dono.** |
| **D-9** | Estratégia de atualização de tela (sem realtime) | (a) polling/interval; (b) refresh manual; (c) misto por tela | **(c) misto**, configurável via `dataSource.refetch` — default `manual`, `interval` 30–60s em KPI/board. Realtime real (LISTEN/NOTIFY) só sob demanda futura. **Recomendação.** |

---

## Parte 3 — O que está fora do escopo deste blueprint (não decidido de propósito)

- Testes automatizados do core/blocos (estratégia de teste é da fase de implementação — a skill Architect-First exige plano de teste antes de codar cada peça **G**).
- Observabilidade/logs em produção por cliente.
- Migração de dados existentes do Firebase do Dobro (fora do escopo de arquitetura; é operação).
- i18n (todos os clientes em pt-BR por enquanto; o manifesto já externaliza textos, então é evolução barata depois).

---

## Nota final da arquiteta

Este blueprint é **pragmático e honesto**: o material verdadeiramente reutilizável do Dobro OS é ~30% (chassi + primitivos + 2 arquétipos que já se repetem), e é exatamente aí que a alavancagem por extração é alta. Os outros ~70% são específicos e devem migrar como `custom:` blocks **sem** generalização prematura.

Com a troca **Firebase → NeonDB**, o maior valor de engenharia — e o maior risco — passou a se concentrar em **quatro peças**: (1) **ManifestRouter** (config-driven), (2) **OsClient de API + DataAdapter** (o front nunca mais fala com banco), (3) o **endpoint de query genérico seguro** (`/api/query` com as 3 defesas — este é o novo coração, e o novo risco: se ele for ingênuo, todo o resto rui) e (4) **Better Auth** como porteiro obrigatório antes de qualquer dado.

A mudança conceitual mais importante para o dono: **antes a `apiKey` do Firebase ia no bundle e não era segredo; agora a `DATABASE_URL` da Neon É segredo de verdade e vive só no servidor.** Isso encarece um pouco a operação (backend por app, R-10) e remove o realtime (R-9), mas em troca ganhamos a força do Postgres (JOINs/agregações para KPI, antes uma fraqueza) e uma superfície de segurança bem mais defensável — desde que o `/api/query` seja construído com allowlist de views + bind params, e que nenhum segredo escape com prefixo `VITE_`. Acertar essas quatro peças é o que transforma um OS interno acoplado numa fábrica de OSs segura. Errar no `/api/query` ou vazar a connection string é o que faz o projeto travar — ou pior, expor um cliente.
```
