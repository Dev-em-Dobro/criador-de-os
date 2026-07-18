# Regras de Segurança aplicadas na criação de um OS novo

> Como os **dados dos clientes** ficam protegidos — na camada de **aplicação** e na de
> **banco de dados** — no momento em que um OS/cliente novo nasce na fábrica.
>
> Autora: Dara (@data-engineer) · Público: técnico (dono do produto + devs).
>
> **Regra de honestidade (Constitution, Art. IV — No Invention):** cada afirmação
> abaixo rastreia a um arquivo real do repositório (formato `arquivo:linha`). Tudo
> que depende de configuração externa que **não** dá para confirmar pelo código
> (ex.: Console do Neon, provedor de deploy) está marcado com **⚠️ A VERIFICAR /
> RECOMENDAÇÃO**. Onde algo **ainda não é enforçado**, está na seção 7 (Lacunas),
> sem maquiagem.

---

## 1. Resumo executivo — por que os dados dos clientes estão seguros

1. **Isolamento físico por cliente:** cada OS tem seu **próprio projeto Neon (Postgres)**. Não há tabela compartilhada nem coluna `tenant_id` — é impossível uma query de um cliente cruzar para o banco de outro (`docs/architecture/05-dados-auth-multitenant.md:20-35`).
2. **A API nunca conecta como dono do banco.** Ela usa **roles de menor privilégio** (`app_auth`, `app_query`) que só enxergam o que precisam. Mesmo um bug na aplicação não expõe tabela crua (`apps/dobro/db/grants.sql`, `apps/dobro/api/env.ts:57-96`).
3. **Segredos do cliente ficam cifrados em repouso** com **AES-256-GCM**; o valor em claro nunca volta ao navegador (`packages/server/src/settings.ts:62-80`).
4. **Autenticação obrigatória (fail-closed):** toda leitura de dados exige sessão válida do Better Auth; sem sessão, `401` antes de tocar no banco (`apps/dobro/api/app.ts:367-372`).
5. **O endpoint de dados é uma allowlist fechada de views + SQL parametrizado** — sem SQL livre, sem acesso arbitrário a tabelas (`apps/dobro/api/query-builder.ts`, `apps/dobro/api/query-allowlist.ts`).

E o mais importante para a fábrica: **tudo isso já vem por padrão em cada OS novo**, porque o **scaffolder** gera esses mesmos controles automaticamente (seção 6).

---

## 2. Modelo de isolamento multitenant (um banco por cliente)

A decisão de arquitetura é **um projeto Neon por cliente**, cada um com sua própria
connection string:

```text
Projeto Neon "dobro-os"         → apps/dobro
Projeto Neon "neurovida"        → apps/neurovida
Projeto Neon "cliente-y"        → apps/cliente-y
```

Fonte: `docs/architecture/05-dados-auth-multitenant.md:20-35`.

**Por que isso é o controle de segurança mais forte que temos:**

- **Isolamento físico, não lógico.** Bancos Postgres separados. Diferente de um modelo multitenant com `tenant_id` (onde uma query sem filtro vaza dados entre clientes), aqui **não existe** o dado de outro cliente no mesmo banco para vazar (`05:31`).
- **O segredo de acesso vive só no servidor.** A `DATABASE_URL`/`NEON_DATABASE_URL` é um **segredo real** (quem a tem tem acesso total ao Postgres do cliente) e **nunca** vai para o bundle do navegador (`docs/architecture/05-dados-auth-multitenant.md:216-229`; regra de ouro: nenhum segredo com prefixo `VITE_`).
- **Os usuários (login) de cada cliente vivem no banco do próprio cliente** (tabelas `user`/`session`/`account`/`verification` — Better Auth), reforçando o isolamento também na identidade (`apps/dobro/api/auth.ts:20-29`; `05:196-197`).

Os usuários de autenticação são modelados em `apps/dobro/db/schema.ts:30-84` (tabelas
`user`, `session`, `account`, `verification`), e cada connection string é lida
**apenas server-side** em `apps/dobro/api/env.ts:26-31` (precedência: `.env` do app →
`.env` da raiz → `process.env`; a connection string nunca é logada — `env.ts:12`).

> **⚠️ A VERIFICAR no Console Neon:** a *criação* do projeto Neon por cliente é hoje
> um **passo manual** (o scaffolder não cria o projeto Neon na v1 —
> `docs/architecture/06-scaffolder.md:90`). O isolamento só existe de fato se cada
> cliente receber um **projeto Neon distinto** (não apenas um database/branch dentro
> do mesmo projeto). Isso precisa ser garantido no processo de onboarding.

---

## 3. Controles no BANCO DE DADOS (roles, grants, REVOKE de PUBLIC, sequências)

O núcleo do hardening de banco está em `apps/dobro/db/grants.sql` (e no equivalente
do neurovida, `apps/neurovida/db/grants.sql`). O arquivo é **idempotente** (aplicado
por `db/migrate.ts`) e cuida **só de privilégios** — versionável e não-secreto. O
login/senha de cada role é provisionado à parte (seção 5).

O modelo é **dois roles de menor privilégio, um por caminho da API** (least privilege
por caminho — `apps/dobro/db/grants.sql:1-10`):

| Role | Usado por | Pode | Não pode |
|---|---|---|---|
| `app_auth` | Better Auth (`/api/auth/*`) | `SELECT/INSERT/UPDATE/DELETE` **só** nas tabelas de auth (e capacidades de fábrica no scaffolder) | ler views de negócio, ler tabela crua de métricas |
| `app_query` | `/api/query` | `SELECT` **só** nas views `v_*` | ler tabela crua, ler tabelas de auth |

### 3.1 Bloco a bloco — o PORQUÊ de cada REVOKE/GRANT

Referência: `apps/dobro/db/grants.sql:21-72`.

**(1) Cria os roles como `NOLOGIN`** (`grants.sql:24-33`). O role existe só para
carregar privilégios; ele **não consegue logar** até o provisioning adicionar
`LOGIN PASSWORD`. Assim o arquivo versionado nunca contém segredo.

**(2) `REVOKE ALL ... FROM <role>`** no schema `public` (`grants.sql:36-39`). Zera
qualquer privilégio amplo herdado antes de conceder granularmente. Começa de "nada
pode" e só abre o necessário — o princípio do menor privilégio na prática.

**(3) `REVOKE SELECT ON <tabela> FROM PUBLIC`** (`grants.sql:44-49`). **Este é o bloco
crítico.** O Neon, por padrão, concede `SELECT` ao pseudo-role `PUBLIC` (todo mundo).
Sem revogar isso, **qualquer role leria todas as tabelas** — anulando os grants
granulares. O arquivo revoga `PUBLIC` de todas as tabelas base (auth + negócio) **e da
view**, para que só os `GRANT` explícitos abaixo valham.

**(4) `GRANT USAGE ON SCHEMA public`** para ambos (`grants.sql:52-53`). Sem `USAGE` no
schema, o role não enxerga objeto nenhum — é a permissão mínima para "ver que o schema
existe".

**(5) `app_auth`: CRUD só nas tabelas do Better Auth** (`grants.sql:57-60`:
`user`, `session`, `account`, `verification`). O caminho de login **jamais** alcança
dados de negócio.

**(6) `app_query`: `SELECT` só na view de exposição** (`grants.sql:65`:
`GRANT SELECT ON v_visao_geral TO app_query`). Detalhe de segurança elegante: a view
roda com o privilégio do **owner dela** para ler a tabela base, então `app_query` lê o
KPI **sem ter acesso à tabela crua** `metricas_visao_geral` (`grants.sql:62-65`).

**(7) `GRANT app_auth/app_query TO <owner>`** (`grants.sql:70-71`). Permite ao owner
assumir cada role (`SET ROLE`) **apenas para testar** a defesa — ver 3.3.

No neurovida, além das tabelas de auth, o `app_auth` também tem CRUD em
`app_settings`, `lead_source_rows`, `leads`, `invoices`, `invoice_items`,
`hotmart_metrics` (capacidades de fábrica: Configurações/BYOK, leads, faturas) —
`apps/neurovida/db/grants.sql:39-48`.

### 3.2 Colunas IDENTITY e sequências

Tabelas com coluna `IDENTITY` (ex.: `lead_source_rows.id`, `invoice_items.id`) usam
sequências Postgres. Sem `USAGE` na sequência, um `INSERT` falharia. Por isso:
`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_auth`
(`apps/neurovida/db/grants.sql:50`; scaffolder: `packages/scaffolder/src/templates-db.ts:260`).

### 3.3 A defesa é PROVADA por código, não só declarada

`apps/dobro/db/verify-grants.ts` assume cada role (`SET ROLE`) e verifica o isolamento
por caminho, com resultados esperados explícitos (`verify-grants.ts:54-73`):

- `app_query` → **PERMITIDO** ler a view `v_visao_geral`; **NEGADO** ler a tabela crua
  `metricas_visao_geral` e a tabela `user`.
- `app_auth` → **PERMITIDO** ler `user`; **NEGADO** ler a tabela crua e a view de negócio.

O comando `pnpm db:verify-grants` falha com exit code 1 se qualquer grant não estiver
como esperado (`verify-grants.ts:73`). É um teste executável da postura de segurança do
banco.

---

## 4. Controles na APLICAÇÃO (auth, cifragem, allowlist, SQL parametrizado)

### 4.1 Autenticação obrigatória (fail-closed) — Better Auth

- **Toda requisição a `/api/query` valida a sessão ANTES de qualquer coisa.** Sem
  sessão → `401`, sem tocar no banco (`apps/dobro/api/app.ts:367-372`, Defesa 1).
- Config do Better Auth: e-mail + senha, adapter Drizzle (provider `pg`) sobre o Neon
  do cliente, usando o role `app_auth` (`apps/dobro/api/auth.ts:15-37`; `dbAuth` =
  role `app_auth`, `apps/dobro/db/client.ts` via scaffolder `templates-db.ts:29`).
- O segredo que assina as sessões (`BETTER_AUTH_SECRET`) é **obrigatório** e
  server-side; a aplicação **lança erro claro se ele faltar**, sem vazar o valor
  (`apps/dobro/api/env.ts:34-43,99-101`).

> **⚠️ Observação honesta:** `requireEmailVerification: false` no piloto
> (`apps/dobro/api/auth.ts:31-33`) — os usuários são provisionados pelo operador, então
> não há verificação de e-mail. Aceitável para o modelo atual (poucos usuários
> internos por cliente), mas é um ponto a revisitar se o cadastro virar self-service.

### 4.2 Cifragem das configurações do cliente (`app_settings`) em repouso

Onde: `packages/server/src/settings.ts`.

- **Algoritmo:** `AES-256-GCM` (`settings.ts:62-68`), um modo autenticado (a tag de
  autenticação detecta adulteração — `settings.ts:73-76`).
- **Chave:** derivada por `SHA-256` do segredo do app (`settings.ts:60`), injetada como
  `encKey` na fábrica `makeSettings(db, encKey)` (`settings.ts:59`).
- **IV aleatório por gravação:** `randomBytes(12)` (`settings.ts:63`) — dois valores
  iguais nunca produzem o mesmo ciphertext.
- **O que é protegido:** apenas chaves do **registro fechado** `KNOWN_SETTINGS`
  (`settings.ts:22-41`): `anthropic_api_key`, `hotmart_client_id`,
  `hotmart_client_secret`. Nenhuma outra chave é aceita (allowlist de configurações).
- **O valor em claro nunca retorna ao browser:** o front só recebe um **hint
  mascarado** `••••<4 últimos>` (`settings.ts:80,97-103`). O valor decifrado só existe
  server-side, quando a API vai usar a credencial (`settings.ts:110-118`).

Isso é exatamente o que o DPA promete ("segredos com cifragem AES-256-GCM; o valor em
claro nunca retorna à interface" — `docs/legal/acordo-tratamento-dados-dpa.md:70-72`).

### 4.3 Endpoint de dados seguro — allowlist de views + bind params (as 3 defesas)

O `/api/query` é o único caminho de leitura de dados de negócio, e tem **três defesas
em camadas** (todas obrigatórias — `docs/architecture/05-dados-auth-multitenant.md:108-128`):

**Defesa 1 — auth-first:** sessão válida ou `401` (`apps/dobro/api/app.ts:367-372`).

**Defesa 2 — allowlist fechada de views** (`apps/dobro/api/query-allowlist.ts`): o
manifesto **nunca** referencia tabela crua; só uma view `v_*` explicitamente listada,
com um **conjunto fechado de colunas conhecidas**. View fora da lista → `403`; coluna
fora da view → `400` (`query-builder.ts:224-234,217-222`). Tentativa de ler tabela crua
(`req.table`) é rejeitada com `403` (`query-builder.ts:225-230`).

**Defesa 3 — SQL sempre parametrizado (bind), nunca concatenado**
(`apps/dobro/api/query-builder.ts`):

- Valores (`where[].value`, `limit`) sempre entram como **bind param** via o template
  `sql` do Drizzle (`query-builder.ts:224-284`).
- Identificadores (view/coluna) não podem ser bind → passam pela allowlist e são citados
  via `sql.identifier(...)`, nunca interpolados crus (`query-builder.ts:240-245`).
- `op` validado contra conjunto fechado (`=,!=,>,>=,<,<=,in,like` — `query-builder.ts:164,203-208`).
- `dir` só aceita `asc|desc` (`query-builder.ts:210-215`).
- `limit` com coerção numérica + teto de `1000` para evitar exfiltração em massa
  (`query-builder.ts:167,278-281`).

E no runtime esse endpoint executa como `app_query` (`dbQuery`), reforçando a Defesa 2
no banco (`apps/dobro/api/app.ts:390-392`).

### 4.4 SSRF / allowlist de rede — estado real

Busca por `ssrf` no código: **não há SSRF-guard próprio** na API do app. As ocorrências
de "allowlist" no app referem-se à **allowlist de views** (Defesa 2), não a proteção
contra requisições a hosts internos. A API do app faz chamadas externas conhecidas
(Anthropic, Hotmart via `@os/server`), não a URLs fornecidas pelo usuário, então a
superfície de SSRF é hoje baixa. Registrado como item de atenção na seção 7.

---

## 5. Provisionamento seguro de credenciais (rotação, segredos)

Scripts: `apps/dobro/db/provision-roles.ts` e `apps/neurovida/db/provision-roles.ts`.
O gerado pelo scaffolder é `packages/scaffolder/src/templates-db.ts:272-349`.

Fluxo (roda **como owner**, uma vez que os grants já criaram os roles `NOLOGIN`):

1. **Senha forte gerada localmente:** `randomBytes(24).toString('hex')` — 24 bytes de
   entropia, só-hex (URL-safe) (`provision-roles.ts:44` no neurovida; `:68` no dobro).
2. **`ALTER ROLE <role> LOGIN PASSWORD '...'`** dá login ao role
   (`provision-roles.ts:45` neurovida; `:69` dobro). A senha é gerada por nós (não é
   input externo) e só-hex, então interpolá-la no DDL é seguro — `ALTER ROLE` não aceita
   bind param para senha (`dobro/db/provision-roles.ts:65-67`).
3. **Connection string isolada por role:** troca só `user:senha` na URL do owner
   (mesmo host/db) (`buildRoleUrl`, `provision-roles.ts:23-28` neurovida).
4. **Teste de conexão REAL:** conecta com o role recém-criado e roda um smoke test
   (ex.: `SELECT count(*) FROM "user"`) para provar que o Neon roteia o role
   (`provision-roles.ts:48-49` neurovida; `dobro:74-76`).
5. **Grava a connection string no `.env`** (`AUTH_DATABASE_URL` / `QUERY_DATABASE_URL`)
   — **nunca imprime o segredo** (`provision-roles.ts:51-54` neurovida; `dobro:78-84`).
6. **Rotação idempotente:** re-rodar o script rotaciona a senha e reescreve o `.env`
   (`provision-roles.ts:8` neurovida; `dobro:13-14`).

> **Nuance de onde grava:** o script do **neurovida grava no `.env` do próprio app**
> (`apps/neurovida/.env`, isolamento por cliente — `apps/neurovida/db/provision-roles.ts:19-21`);
> o do **dobro** e o gerado pelo scaffolder gravam no **`.env` da raiz** do monorepo
> (`apps/dobro/db/provision-roles.ts:25-27`; `templates-db.ts:291-293`). Ambos são
> server-side e fora do git; a diferença é só de localização do arquivo.

**Fallback de DEV (importante entender):** se `AUTH_DATABASE_URL` / `QUERY_DATABASE_URL`
não estiverem definidas, a API **cai no owner** e **avisa uma vez** (WARN) que a defesa
de role não está ativa (`apps/dobro/api/env.ts:66-118`). Esse fallback **só existe em
desenvolvimento**: desde a correção da lacuna 7.1, quando `NODE_ENV=production` a ausência
de qualquer uma dessas vars **aborta o boot** (fail-closed) em vez de cair no owner — a
defesa do banco não pode ser desativada silenciosamente em produção. Ver seção 7.1.

---

## 6. Checklist — o que acontece automaticamente quando um OS novo nasce

O scaffolder (`packages/scaffolder/src/generate.ts`) materializa, para cada OS novo do
preset `full`, **todos os controles de segurança acima** — não é opcional, vem por
padrão:

| Controle gerado | Arquivo gerado | Fonte no scaffolder |
|---|---|---|
| Roles de menor privilégio + REVOKE PUBLIC + grants granulares | `apps/<slug>/db/grants.sql` | `generate.ts:119` → `templates-db.ts:203-270` |
| Views read-only (contrato de exposição) | `apps/<slug>/db/views.sql` | `generate.ts:118` → `templates-db.ts:182-201` |
| Provisioning de senha forte + rotação idempotente | `apps/<slug>/db/provision-roles.ts` | `generate.ts:120` → `templates-db.ts:272-349` |
| Prova de isolamento por role (`verify-grants`) | `apps/<slug>/db/verify-grants.ts` | `generate.ts:121` → `templates-db.ts:351-427` |
| Allowlist fechada de views | `apps/<slug>/api/query-allowlist.ts` | `generate.ts:110` → `templates-api.ts:288-324` |
| SQL parametrizado + validação de op/dir/limit | `apps/<slug>/api/query-builder.ts` | `generate.ts:109` → `templates-api.ts:151-286` |
| Auth-first + `/api/query` executando como `app_query` | `apps/<slug>/api/app.ts` | `generate.ts:111` → `templates-api.ts:326-404` |
| Better Auth (Drizzle adapter, `dbAuth`) | `apps/<slug>/api/auth.ts` | `generate.ts:108` → `templates-api.ts:114-148` |
| Env server-side, regra "sem `VITE_`", segredos obrigatórios | `apps/<slug>/api/env.ts` | `generate.ts:107` → `templates-api.ts:13-112` |
| Três clients Drizzle por papel (owner/auth/query) | `apps/<slug>/db/client.ts` | `generate.ts:115` → `templates-db.ts:13-37` |
| Cifragem AES-256-GCM de `app_settings` | herdado de `@os/server` (`mountApi`) | `templates-api.ts:348-353` → `packages/server/src/settings.ts` |
| `.env.example` sem segredos com `VITE_` | `apps/<slug>/.env.example` | `generate.ts:106` |

Fluxo do operador (o que ainda é manual): criar o **projeto Neon**, preencher `.env`,
rodar `db:migrate` (aplica migrations + views + grants), `db:provision-roles`,
`create-admin`, deploy (`docs/architecture/06-scaffolder.md:95-111`). O scaffolder
**não** cria o projeto Neon nem preenche o `SELECT` das views na v1
(`06-scaffolder.md:88-93`).

---

## 7. ⚠️ Lacunas e recomendações (o que AINDA não é enforçado)

Ordenadas por risco. Nenhuma destas invalida os controles acima — são o próximo nível.

### 7.1 (✅ RESOLVIDO) Roles de menor privilégio dependem de config manual; sem eles, a API rodava como OWNER

**Status:** corrigido. Antes, o código tinha **fallback silencioso para o owner** com
apenas um WARN: se `AUTH_DATABASE_URL`/`QUERY_DATABASE_URL` não fossem provisionadas em
produção, **toda a defesa de banco (seção 3) ficava inativa** e a API operava com
privilégio total, sem nenhum gate bloqueando o boot.

**O que mudou:** os getters de role agora são **fail-closed em produção**. Quando
`NODE_ENV=production` e a var do role está ausente, o boot **lança erro e aborta** em vez
de cair no owner (`apps/dobro/api/env.ts` — `getAuthDatabaseUrl`/`getQueryDatabaseUrl`;
`apps/neurovida/api/env.ts` — `getAuthDatabaseUrl`). Em desenvolvimento o fallback com
WARN foi preservado, para não atrapalhar o dev local. A correção também foi aplicada no
**template do scaffolder** (`packages/scaffolder/src/templates-api.ts`), então **todo OS
novo já nasce fail-closed**.

**Recomendação remanescente:** incluir `pnpm db:verify-grants` no checklist de deploy e
garantir `NODE_ENV=production` no ambiente de deploy (o gate depende dessa var).

### 7.2 (ALTO) Ausência de RLS (Row-Level Security) por linha

O isolamento aqui é **por banco** (multitenant físico) e **por role/view** (least
privilege). **Não há RLS por linha** dentro do banco de um cliente — não há
`ENABLE ROW LEVEL SECURITY` em lugar nenhum do repo. Para o modelo atual (um banco por
cliente, poucos usuários internos, todos veem os mesmos KPIs), isso é **coerente e
aceitável**. Vira lacuna **se** um cliente precisar de segregação de dados **entre
usuários do mesmo cliente** (ex.: vendedor A não vê os leads do vendedor B). Hoje
qualquer sessão válida lê todas as views permitidas
(`docs/architecture/05-dados-auth-multitenant.md:212`).
**Recomendação:** documentar que autorização fina por papel/linha é evolução sob
demanda; quando surgir, o ponto natural é a view + checagem de `session.user.role` no
handler, e/ou RLS na tabela base.

### 7.3 (MÉDIO) Cifragem de `app_settings` usa, por padrão, a MESMA chave que assina as sessões

`getSettingsEncKey()` cai em `getAuthSecret()` (o `BETTER_AUTH_SECRET`) quando
`SETTINGS_ENC_KEY` não é definida (`apps/neurovida/api/env.ts:93-95`;
`apps/dobro`/scaffolder idem — `templates-api.ts:97-98`). Isso acopla dois segredos de
propósitos distintos: um vazamento do segredo de sessão também comprometeria a cifra das
credenciais BYOK do cliente, e **rotacionar** `BETTER_AUTH_SECRET` tornaria os segredos
já cifrados indecifráveis.
**Recomendação:** definir `SETTINGS_ENC_KEY` **própria e distinta** por app em
produção (a var já existe no `.env.example` — `apps/neurovida/.env.example:26`), e
documentar o procedimento de rotação (re-cifrar os segredos ao trocar a chave).

### 7.4 (MÉDIO) Cifragem em repouso do banco depende do Neon, não do app

O app cifra **campos sensíveis específicos** (as credenciais em `app_settings`), mas os
**demais dados de negócio** (leads, faturas, métricas) são gravados em claro no
Postgres. A cifragem "at rest" do storage inteiro é responsabilidade da plataforma Neon.
**⚠️ A VERIFICAR no Console Neon:** confirmar que o encryption-at-rest do Neon está
ativo para os projetos dos clientes (é padrão na plataforma, mas não é confirmável pelo
código). Para dados especialmente sensíveis, avaliar cifragem em nível de campo com
chave sob controle do cliente — opção inclusive já prevista no DPA
(`docs/legal/acordo-tratamento-dados-dpa.md:59-61`).

### 7.5 (MÉDIO) Sem rotação automática de segredos e sem verificação de e-mail

- A rotação de senha dos roles é **manual e idempotente** (re-rodar `provision-roles`),
  mas **não há agendamento automático** (`apps/dobro/db/provision-roles.ts:13-14`).
- `requireEmailVerification: false` no piloto (`apps/dobro/api/auth.ts:31-33`).
**Recomendação:** definir uma cadência de rotação (ex.: trimestral) no runbook
operacional; e reavaliar a verificação de e-mail se o cadastro deixar de ser
provisionado só pelo operador.

### 7.6 (BAIXO) Sem SSRF-guard e sem rate limiting explícitos na API

Não há guard de SSRF nem rate limiting no código do app (busca por `ssrf`/`rate` não
retorna nada no app). A superfície de SSRF é baixa (a API só chama hosts externos
conhecidos, não URLs do usuário), mas o `/api/auth/*` e o `/api/query` não têm rate
limiting próprio — dependem do provedor de hosting.
**⚠️ A VERIFICAR no provedor de deploy (ex.: Vercel):** confirmar proteção de
edge/rate limiting. Considerar rate limiting no Better Auth para o login.

---

## Apêndice — mapa rápido de evidências

| Controle | Arquivo(s) chave |
|---|---|
| Isolamento por banco | `docs/architecture/05-dados-auth-multitenant.md:20-35` |
| Roles + REVOKE PUBLIC + grants | `apps/dobro/db/grants.sql`, `apps/neurovida/db/grants.sql` |
| Prova de isolamento por role | `apps/dobro/db/verify-grants.ts` |
| Provisioning de credenciais | `apps/dobro/db/provision-roles.ts`, `apps/neurovida/db/provision-roles.ts` |
| Cifragem AES-256-GCM | `packages/server/src/settings.ts:62-118` |
| Auth-first + query seguro | `apps/dobro/api/app.ts:367-402` |
| Allowlist de views | `apps/dobro/api/query-allowlist.ts` |
| SQL parametrizado (bind) | `apps/dobro/api/query-builder.ts` |
| Env server-side / sem `VITE_` | `apps/dobro/api/env.ts` |
| Geração automática no OS novo | `packages/scaffolder/src/generate.ts`, `packages/scaffolder/src/templates-db.ts`, `packages/scaffolder/src/templates-api.ts` |
| Contexto legal (LGPD) | `docs/legal/acordo-tratamento-dados-dpa.md` |
