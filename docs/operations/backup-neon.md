# Backup do site e do banco de dados (Neon)

> Como garantir que **nada se perde** — do banco de cada cliente e da aplicação —
> quando cada OS roda com seu próprio projeto Neon.
>
> Autora: Dara (@data-engineer) · Público: técnico (dono do produto + devs).
>
> **Regra de honestidade (Constitution, Art. IV — No Invention):** o que existe hoje
> no repositório está descrito como existe (seção 1). O funcionamento do Neon está
> descrito com base em conhecimento sólido da plataforma, mas tudo que depende de
> **plano/configuração da conta Neon** — que não dá para confirmar pelo código —
> está marcado com **⚠️ A VERIFICAR no Console Neon**.

---

## 1. Resumo executivo — situação atual do backup

**Não existe nenhuma automação de backup própria neste repositório.** Verifiquei:

- **Nenhum script** de `pg_dump` / `pg_restore` / backup em `apps/*` ou na raiz (busca
  por `pg_dump|pg_restore|backup|snapshot|pitr` em `apps/` e no `package.json` retorna
  vazio).
- **Nenhum workflow de CI/CD** — a pasta `.github/workflows/` não existe (nenhum
  `*.yml`), logo não há job agendado de backup.
- **Scripts de banco disponíveis** (via `pnpm`) são só de setup/operação, não de
  backup: `db:migrate`, `db:provision-roles`, `db:verify-grants`, `create-admin`
  (`docs/architecture/06-scaffolder.md:98-111`). O `package.json` da raiz só tem
  `dev`, `build`, `typecheck`, `lint`, `create-client`, `os`
  (`package.json:10-17`).

**Conclusão honesta:** hoje, a proteção contra perda de dados depende **inteiramente do
mecanismo nativo do Neon** (history retention + Point-in-Time Restore, seção 2). Não há
uma segunda cópia independente da plataforma. Se a conta Neon de um cliente for perdida,
apagada ou tiver retention insuficiente, **não há backup externo para restaurar**. As
recomendações da seção 3 fecham essa lacuna.

O **código** da aplicação (o "site"), por outro lado, **está versionado no git** — esse
é o backup da parte de aplicação (seção 4). O que **não** está no git são os **segredos**
(`.env`), e é aí que mora o risco real do lado da aplicação.

---

## 2. Como o Neon protege os dados nativamente

O Neon **não faz "backups" clássicos** (dumps periódicos) por padrão. O mecanismo é
diferente e, bem configurado, mais poderoso:

### 2.1 History retention + Point-in-Time Restore (PITR)

O storage do Neon é **copy-on-write** e mantém um **histórico de alterações (WAL)** por
uma **janela de retenção** configurável. Enquanto uma alteração estiver dentro dessa
janela, é possível **restaurar o banco para qualquer instante** dentro dela (Point-in-Time
Restore) — inclusive para "1 minuto antes do `DELETE` acidental".

- **Como restaurar:** cria-se um **branch** do banco a partir de um **timestamp** ou
  **LSN** dentro da janela de retenção. O branch é uma cópia lógica instantânea
  (copy-on-write) daquele momento — barata e rápida.
- **⚠️ A VERIFICAR no Console Neon:** o **tamanho da janela de retenção** varia por
  **plano** (do free tier a planos pagos, a janela vai de poucas horas/dias a até 30
  dias). Confirme, para cada projeto de cliente, qual a janela ativa. **Este é o
  parâmetro que define quanto tempo você tem para reagir a uma perda de dados.**

### 2.2 Branching como snapshot lógico

Cada branch é uma cópia isolada (copy-on-write) do banco num ponto no tempo. Isso serve
tanto para PITR (restaurar) quanto para criar **snapshots nomeados** periódicos (ex.: um
branch `snapshot-2026-07-17`) que ficam guardados independentemente da janela de
retenção do branch principal.

### 2.3 Limites honestos do mecanismo nativo

- **PITR só cobre a janela de retenção.** Um `DELETE` descoberto **depois** da janela
  expirar **não é recuperável** por PITR. Por isso um dump externo (2ª cópia) importa.
- **Tudo vive dentro da conta Neon.** Se a conta/projeto for excluída (erro operacional,
  problema de billing, comprometimento da conta), o PITR vai junto. Um dump em storage
  **externo** é a única proteção contra esse cenário.
- **⚠️ A VERIFICAR no Console Neon:** política de proteção contra exclusão de projeto e
  quem tem acesso administrativo à conta.

---

## 3. Backup do BANCO por cliente — opções concretas

Cada cliente tem sua **connection string isolada** (owner: `NEON_DATABASE_URL`/
`DATABASE_URL`, lida por `getDatabaseUrl()` em `apps/<slug>/api/env.ts:53-55`). Qualquer
estratégia de backup usa essa string por cliente.

> **Nota de segurança:** para `pg_dump` use a connection string **OWNER** (ela lê tudo);
> ela é segredo real e vive só server-side (`apps/dobro/api/env.ts:45-55`). Nunca a
> exponha em logs nem no bundle. Os roles `app_query`/`app_auth` **não** servem para
> dump completo (leem só parte).

### Opção (a) — Confiar no PITR do Neon com retention adequado

**O que é:** não fazer dump; garantir uma janela de retenção grande o suficiente e usar
PITR quando preciso.
**Prós:** zero manutenção, zero código, restauração point-in-time granular.
**Contras:** não protege contra exclusão da conta/projeto; limitado à janela de
retenção; não é uma cópia independente.
**Quando basta:** enquanto o número de clientes é pequeno e a janela do plano cobre o
tempo de reação desejado.
**⚠️ A VERIFICAR:** aumentar a janela de retenção no plano de cada cliente.

### Opção (b) — `pg_dump` agendado para storage externo (RECOMENDADA como 2ª cópia)

**O que é:** um job periódico que roda `pg_dump` de cada banco e envia o arquivo cifrado
para storage fora do Neon (S3/R2/Backblaze). É a única opção que gera uma **cópia
independente da plataforma**.

Como não há CI/CD hoje (`.github/workflows/` não existe), aqui vai um **exemplo concreto**
de GitHub Action agendada para criar. As connection strings de cada cliente ficam em
**GitHub Secrets** (uma por cliente), nunca no repo:

```yaml
# .github/workflows/backup-neon.yml   (A CRIAR — não existe hoje)
name: Backup Neon (por cliente)
on:
  schedule:
    - cron: '0 3 * * *'   # todo dia às 03:00 UTC
  workflow_dispatch: {}    # permite rodar sob demanda

jobs:
  dump:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        client: [dobro, neurovida]   # adicione cada cliente novo aqui
    steps:
      - name: Instalar cliente Postgres 16
        run: |
          sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
          curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/pgdg.gpg
          sudo apt-get update && sudo apt-get install -y postgresql-client-16

      - name: pg_dump (formato custom, comprimido)
        env:
          # Secret por cliente: NEON_DATABASE_URL_DOBRO, NEON_DATABASE_URL_NEUROVIDA, ...
          DB_URL: ${{ secrets[format('NEON_DATABASE_URL_{0}', github.matrix.client)] }}
        run: |
          STAMP=$(date -u +%Y%m%dT%H%M%SZ)
          pg_dump "$DB_URL" -Fc -f "${{ matrix.client }}-$STAMP.dump"

      - name: Cifrar o dump (GPG simétrico) e enviar ao storage externo
        env:
          BACKUP_PASSPHRASE: ${{ secrets.BACKUP_PASSPHRASE }}
          AWS_ACCESS_KEY_ID: ${{ secrets.BACKUP_S3_KEY }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.BACKUP_S3_SECRET }}
        run: |
          FILE=$(ls ${{ matrix.client }}-*.dump)
          gpg --batch --yes --passphrase "$BACKUP_PASSPHRASE" -c "$FILE"
          aws s3 cp "$FILE.gpg" "s3://SEU-BUCKET/neon-backups/${{ matrix.client }}/"
```

Ou, sem CI, um script local/servidor equivalente (padrão do comando):

```bash
# Roda como OWNER (a mesma string usada por db:migrate). Nunca logar a string.
pg_dump "$NEON_DATABASE_URL" -Fc -f "dobro-$(date -u +%Y%m%dT%H%M%SZ).dump"
# restauração de teste (num banco/branch vazio):
pg_restore --clean --if-exists -d "$TARGET_DATABASE_URL" dobro-<stamp>.dump
```

**Prós:** cópia independente do Neon; cifrada; sobrevive à perda da conta.
**Contras:** exige criar e manter o pipeline + storage; granularidade = frequência do
job (não point-in-time como o PITR).
**⚠️ A VERIFICAR:** criar os GitHub Secrets por cliente e o bucket; testar o
`pg_restore` regularmente (backup não testado não é backup).

### Opção (c) — Branch de snapshot periódico no Neon

**O que é:** criar periodicamente um branch nomeado (ex.: semanal) via `neonctl` ou API
do Neon, funcionando como snapshot lógico retido além da janela de PITR.
**Prós:** trivial, copy-on-write (barato), restauração quase instantânea.
**Contras:** ainda vive **dentro** da conta Neon (não protege contra perda da conta).
**⚠️ A VERIFICAR no Console Neon:** limite de branches por plano.

### Recomendação

**Camada dupla:** (a) PITR nativo com **retention aumentado** para recuperação
point-in-time do dia a dia **+** (b) `pg_dump` diário cifrado em **storage externo** como
apólice contra perda da conta/janela expirada. A opção (c) é um bônus barato para
snapshots semanais nomeados. Comece por (a) — que é só configuração no Console — e
implemente (b) assim que houver mais de um cliente pagante em produção.

---

## 4. Backup do SITE / aplicação

O "site" de cada cliente = **front (SPA) + funções serverless `api/` + `db/` (schema,
migrations, views, grants)**. Tudo isso é **código versionado no git**.

- **O código É o backup.** `apps/<slug>/` inteiro (front + `api/` + `db/`) está no
  monorepo. Um cliente pode ser reconstruído a partir do git + o manifesto dele
  (`apps/<slug>/src/manifest.ts`). O schema, as views e os grants são reaplicáveis com
  `pnpm db:migrate` (`docs/architecture/06-scaffolder.md:101-102`).
- **⚠️ A VERIFICAR:** o git remoto (GitHub) é hoje a única cópia do código. Garantir que
  o repositório tem cópia/backup (o próprio GitHub, mais um mirror se quiser). Considerar
  proteção de branch e backup do repo.

### 4.1 O que NÃO está no git — e é o ponto crítico

Os **segredos (`.env`) não são versionados** (só `.env.example` com placeholders —
`apps/dobro/.env.example`; regra em `apps/dobro/api/env.ts:4-5`). Perder esses segredos
significa não conseguir religar a aplicação, e alguns **não são regeneráveis sem
consequência**:

| Segredo | Onde vive | Perder significa | Regenerável? |
|---|---|---|---|
| `NEON_DATABASE_URL` / `DATABASE_URL` (owner) | `.env` (raiz/app), server-side | sem acesso admin ao banco | Sim, no Console Neon (reset de senha do owner) |
| `AUTH_DATABASE_URL` / `QUERY_DATABASE_URL` (roles) | `.env`, gravado por `db:provision-roles` | API sem os roles de menor privilégio | Sim — re-rodar `pnpm db:provision-roles` (`apps/dobro/db/provision-roles.ts`) |
| `BETTER_AUTH_SECRET` | `.env`, server-side | **todas as sessões ativas invalidadas** ao trocar | Gerável, mas trocar desloga todos |
| `SETTINGS_ENC_KEY` | `.env`, server-side | **credenciais BYOK cifradas (`app_settings`) ficam indecifráveis** | **NÃO** — se perdida, os segredos cifrados do cliente são irrecuperáveis (o cliente precisa recadastrar) |

> **Atenção máxima ao `SETTINGS_ENC_KEY`:** ele cifra as credenciais que o cliente salva
> (chave Anthropic, credenciais Hotmart) com AES-256-GCM
> (`packages/server/src/settings.ts:62-68`). Se não houver um `SETTINGS_ENC_KEY` próprio,
> o sistema usa o `BETTER_AUTH_SECRET` como default
> (`apps/neurovida/api/env.ts:93-95`) — ou seja, **trocar o `BETTER_AUTH_SECRET` também
> quebra a decifragem dos segredos**. Guardar essas chaves com segurança é parte do
> backup.

**Onde guardar os segredos (recomendação):** um **gerenciador de segredos** (1Password /
Bitwarden / Doppler / cofre do provedor de deploy), **por cliente**, fora do git e fora
do Neon. Em produção, esses valores também vivem como **env vars no provedor de deploy**
(ex.: Vercel — `docs/architecture/05-dados-auth-multitenant.md:220-225`); o gerenciador
de segredos é a cópia de recuperação. **Sem esse backup, o dump do banco (seção 3) pode
ser inútil** para religar o app.

### 4.2 Assets / uploads

O modelo atual não guarda binários de usuário no banco: PDFs de fatura são **lidos e
estruturados** (via Anthropic/BYOK), e o que persiste são **dados estruturados** nas
tabelas (`docs/legal/acordo-tratamento-dados-dpa.md:39,86`). Logo, o backup do banco
(seção 3) já cobre os dados de fatura. **⚠️ A VERIFICAR** se algum cliente futuro passar
a armazenar arquivos (aí entra backup do object storage correspondente).

---

## 5. Restauração — passo a passo (recuperar um cliente)

Cenário: precisar restaurar o cliente `<slug>` (dado corrompido/apagado, ou reconstrução
total).

### 5.1 Restaurar o BANCO

**Via PITR do Neon (perda recente, dentro da janela de retenção):**
1. No Console Neon do projeto do cliente, criar um **branch a partir do timestamp** logo
   antes do incidente (Point-in-Time Restore).
2. Validar os dados no branch restaurado.
3. Promover o branch (ou repontar a `DATABASE_URL` do app para ele). **⚠️ A VERIFICAR:**
   procedimento exato de promoção de branch no seu plano.

**Via dump externo (janela expirada ou perda da conta — se a Opção (b) estiver ativa):**
1. Criar/obter um projeto Neon novo e sua `DATABASE_URL` owner.
2. Baixar e decifrar o dump mais recente do storage externo
   (`gpg --decrypt`), depois:
   ```bash
   pg_restore --clean --if-exists -d "$NEW_DATABASE_URL" <slug>-<stamp>.dump
   ```
3. Reaplicar views/grants se necessário: `pnpm --filter @app/<slug> db:migrate`.

### 5.2 Reconstruir o APP (site)

1. `git clone` do monorepo (o código de `apps/<slug>` está lá).
2. Restaurar o `.env` do cliente a partir do gerenciador de segredos (seção 4.1)
   **ou** repopular as env vars no provedor de deploy.
3. Se os roles precisarem ser recriados: `pnpm --filter @app/<slug> db:migrate` (grants)
   + `pnpm --filter @app/<slug> db:provision-roles` (regenera `AUTH_/QUERY_DATABASE_URL`).
4. Provar a defesa: `pnpm --filter @app/<slug> db:verify-grants`
   (`apps/dobro/db/verify-grants.ts`).
5. Redeploy do app (front + funções `api/`) no provedor
   (`docs/architecture/06-scaffolder.md:108-111`).
6. Se o `SETTINGS_ENC_KEY` foi perdido, o cliente precisa **recadastrar** as credenciais
   BYOK em Configurações (não há como decifrar o antigo).

### 5.3 Ordem recomendada

Banco primeiro (5.1) → app com `.env` restaurado (5.2) → validar login + `/api/query` +
`verify-grants`. Sempre testar a restauração num ambiente separado antes de repontar
produção.

---

## 6. ⚠️ Itens a configurar/verificar no Console Neon (e no processo)

Ordenados por prioridade.

1. **(ALTO) Janela de history retention por cliente.** Confirmar e, se possível,
   **aumentar** a janela de PITR de cada projeto de cliente — é o que define quanto tempo
   você tem para reagir a uma perda. Depende do **plano** de cada projeto.
2. **(ALTO) Backup do `SETTINGS_ENC_KEY` (e demais segredos) por cliente.** Guardar em
   gerenciador de segredos. Sem ele, as credenciais BYOK cifradas são irrecuperáveis
   (`packages/server/src/settings.ts:62-68`, `apps/neurovida/api/env.ts:93-95`).
3. **(ALTO) Implementar a Opção (b)** — `pg_dump` diário cifrado em storage externo — para
   ter uma cópia **independente da conta Neon**. Hoje **não existe** (seção 1).
4. **(MÉDIO) Proteção contra exclusão de projeto e revisão de acesso admin** à conta
   Neon (quem pode apagar um projeto de cliente).
5. **(MÉDIO) Testar restauração periodicamente** (PITR e `pg_restore`). Backup não testado
   não conta.
6. **(MÉDIO) Backup/mirror do repositório git** (é o backup do "site").
7. **(BAIXO) Alertas do Neon** (uso/erros/billing) para não perder um projeto por
   inadimplência silenciosa. **⚠️ A VERIFICAR** disponibilidade por plano.
8. **(Contexto) DPA:** a cláusula de retenção/expurgo de backups tem prazo em aberto
   (`docs/legal/acordo-tratamento-dados-dpa.md:108-112`, "ciclo de expurgo de [•] dias").
   Definir esse número quando a Opção (b) entrar, para casar backup técnico com o
   compromisso contratual.

---

## Apêndice — variáveis de ambiente relevantes

| Variável | Papel | Fonte |
|---|---|---|
| `NEON_DATABASE_URL` / `DATABASE_URL` | connection string OWNER — usar no `pg_dump` | `apps/dobro/api/env.ts:53-55` |
| `AUTH_DATABASE_URL` | role `app_auth` (regenerável via `db:provision-roles`) | `apps/dobro/api/env.ts:68-79` |
| `QUERY_DATABASE_URL` | role `app_query` (regenerável via `db:provision-roles`) | `apps/dobro/api/env.ts:85-96` |
| `BETTER_AUTH_SECRET` | assina sessões (obrigatório) | `apps/dobro/api/env.ts:99-101` |
| `SETTINGS_ENC_KEY` | cifra `app_settings` — **crítico para backup** | `apps/neurovida/api/env.ts:93-95` |
