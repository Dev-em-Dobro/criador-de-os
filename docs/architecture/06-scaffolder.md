# 06 — Scaffolder (o "Criador")

> Como nasce um cliente novo. Design conceitual de um gerador que cria `apps/<cliente>` a partir do core + um manifesto inicial + tema. Foco no fluxo do operador do Dev em Dobro. Design, não implementação.
>
> **Revisado (2026-07-12): Firebase → NeonDB.** O scaffolder agora gera também a pasta `api/` (funções serverless + Better Auth), a pasta `db/` (schema Drizzle + migrations + views) e um `.env.example` com `DATABASE_URL`/`BETTER_AUTH_SECRET` (não mais `VITE_FIREBASE_*`). O fluxo do operador muda: criar **projeto Neon** (não Firebase), rodar **migrations iniciais** e criar o **usuário admin no Better Auth**.

## 1. Objetivo

Transformar "criar um OS para o cliente novo" de **horas de setup manual** (copiar app, trocar config, criar Neon, escrever schema/migrations/views e manifesto do zero) em **um comando + poucas respostas**. O scaffolder é o que torna a fábrica escalável.

## 2. O que ele gera

Rodando o gerador, nasce `apps/<cliente>` completo (front + backend) e pronto para `pnpm dev`:

```text
apps/<cliente>/
├── src/                   # FRONT (SPA)
│   ├── manifest.ts        # manifesto inicial preenchido a partir das respostas
│   ├── theme.ts           # tema (cores/logo do cliente)
│   ├── blocks/            # vazio (pasta para blocos sob medida futuros)
│   └── main.tsx           # monta <OsApp manifest registry /> com os blocos padrão
├── api/                   # BACKEND (funções serverless — Hono)
│   ├── query.ts           # endpoint de query genérico (auth + allowlist + bind params)
│   ├── auth.ts            # Better Auth em /api/auth/* (Drizzle adapter, provider pg)
│   └── allowlist.ts       # lista de views/colunas consultáveis (a defesa do /api/query)
├── db/                    # DADOS (Drizzle)
│   ├── schema.ts          # tabelas + tabelas do Better Auth (user/session/account...)
│   ├── views/             # v_<menu>.sql — uma view read-only por menu do manifesto
│   ├── migrations/        # geradas pelo drizzle-kit (inclui as do Better Auth)
│   └── drizzle.config.ts  # aponta para DATABASE_URL
├── public/
│   └── logo.webp          # placeholder (operador substitui pelo logo do cliente)
├── .env.example           # DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL (a preencher)
├── package.json           # name "@app/<cliente>", deps @os/core @os/blocks hono better-auth drizzle-orm @neondatabase/serverless
├── vite.config.ts
└── README.md              # passos: criar Neon, preencher .env, migrar, criar admin, popular, deploy
```

> **Segurança do `.env.example`:** nenhuma variável com prefixo `VITE_` para segredos. `DATABASE_URL` e `BETTER_AUTH_SECRET` são lidos só pelas funções `api/`. Só a base URL da API (não-segredo) chega ao front, via `manifest.dataApi`.

## 3. Inputs que ele pede (fluxo do operador)

Um wizard (CLI interativo) que pergunta o mínimo para gerar um manifesto válido:

```
$ pnpm create-client

? Slug do cliente (kebab-case):        cliente-exemplo
? Nome de exibição:                    Cliente Exemplo
? Wordmark (marca no topo):            EXEMPLO
? Cor primária (hex):                  #2563eb
? Cor de sinal/positivo (hex):         #16a34a   (default #22c55e)
? Autenticação obrigatória?            Sim
? Domínio de e-mail permitido (opcional): clienteexemplo.com
? Período padrão:                      Mensal
? Quais menus criar? (multi-select a partir dos blocos disponíveis)
    [x] Vendas       → kpi-dashboard
    [x] Clientes     → data-table
    [x] Tarefas      → kanban-board
    [ ] Documentos   → doc-viewer
    [ ] Funil        → funnel
? Para cada menu escolhido, nome da view read-only (Postgres):
    Vendas    → v_vendas_kpi
    Clientes  → v_clientes
    Tarefas   → v_tarefas
```

A partir disso, o scaffolder **escreve o `manifest.ts`** (navegação + bindings + dataSources `kind:'query'` apontando para as views), gera um **stub de cada view** em `db/views/v_<menu>.sql` (o dev/DBA depois preenche o `SELECT` real — a view é o contrato de exposição de dados, doc 05 §4), e registra as views na **allowlist** de `api/allowlist.ts`. O operador só ajusta detalhes finos depois.

## 4. Esboço de comandos

```bash
# gerar app novo (interativo)
pnpm create-client

# gerar de forma não-interativa (a partir de um arquivo de respostas)
pnpm create-client --config ./clientes/cliente-exemplo.answers.json

# regenerar só o manifesto de um app existente (após mudar respostas)
pnpm create-client --refresh-manifest apps/cliente-exemplo

# validar um manifesto (zod) sem gerar nada
pnpm os validate apps/cliente-exemplo
```

Implementação recomendada: um pacote `packages/scaffolder` com um CLI (ex.: baseado em `prompts` ou `@clack/prompts`) que renderiza os arquivos a partir de **templates** em `packages/scaffolder/templates/`. Alternativa mais simples para a v1: um **template git** (`degit`/copiar pasta) + um script que injeta as respostas no `manifest.ts`. Recomenda-se começar pela versão simples (template + script) e evoluir para CLI interativo só quando o volume justificar.

## 5. O que o scaffolder NÃO faz (limites honestos)

- **Não cria o projeto Neon automaticamente** na v1. Criar o projeto Neon + obter a `DATABASE_URL` ainda é passo manual no console da Neon (ou via `neonctl` / API num passo separado). O `README.md` gerado lista exatamente os passos. (Automatizar via API da Neon é evolução futura — ver `08-riscos-decisoes.md`, D-6.)
- **Não preenche o `SELECT` das views.** Gera o stub de cada `v_<menu>.sql`, mas o dev/DBA escreve a consulta real (quais colunas, JOINs, agregações) — porque a view **é** o contrato de segurança do que o cliente pode ver.
- **Não popula dados.** O operador/cliente insere os dados nas tabelas (ou importa). O scaffolder pode gerar um seed opcional de exemplo.
- **Não desenha blocos sob medida.** Se o cliente precisa de uma tela única, isso é trabalho de dev (novo bloco em `apps/<cliente>/blocks` + rota em `api/`), não do gerador.

## 6. Fluxo completo do operador do Dev em Dobro (do zero ao entregue)

```
1. pnpm create-client                       → gera apps/cliente-exemplo (front + api/ + db/)
2. Criar projeto Neon do cliente             (console Neon) → copiar a DATABASE_URL
3. Preencher apps/cliente-exemplo/.env       com DATABASE_URL + BETTER_AUTH_SECRET (server-side)
4. pnpm --filter @app/cliente-exemplo db:migrate   → aplica migrations (tabelas + tabelas Better Auth)
5. Escrever o SELECT de cada db/views/v_<menu>.sql e aplicá-las (GRANT SELECT ao role da API)
6. pnpm --filter @app/cliente-exemplo create-admin → cria o usuário admin no Better Auth
7. Substituir public/logo.webp               pelo logo do cliente
8. Ajustar manifest.ts se preciso            (adicionar/renomear menus, KPIs, views)
9. pnpm dev --filter @app/cliente-exemplo    → conferir localmente (login + dados)
10. Popular as tabelas com os dados do cliente
11. Deploy do app (front + funções api/) no hosting recomendado (Vercel do cliente),
    configurando DATABASE_URL/BETTER_AUTH_SECRET como env de servidor no provedor
12. Entregar URL + credenciais do admin ao cliente
```

Depois da entrega, "melhorar se precisar" = editar o manifesto (novos menus/KPIs) — se o dado já existir numa view, é só config; se precisar de dado novo, cria-se/edita-se uma **view read-only** e referencia-se no manifesto — ou adiciona-se um bloco/rota sob medida. Sem tocar em outros clientes, herdando melhorias do core no próximo build.

## 7. Critério de "pronto" do scaffolder

- [ ] `pnpm create-client` gera um app (front + `api/` + `db/`) que roda (`pnpm dev`) sem edição de código, só com `.env` (DATABASE_URL + BETTER_AUTH_SECRET) e migrations aplicadas.
- [ ] Manifesto gerado passa na validação zod; dataSources são `kind:'query'` apontando para views declaradas na allowlist.
- [ ] `db/schema.ts` inclui as tabelas do Better Auth; `db:migrate` cria tudo; `create-admin` provisiona o admin.
- [ ] `.env.example` não contém nenhuma variável de segredo com prefixo `VITE_`.
- [ ] README gerado descreve os passos manuais restantes (criar Neon, migrar, escrever views, criar admin, deploy Vercel).
- [ ] Regenerar manifesto não sobrescreve blocos sob medida, rotas `api/` custom, nem o SELECT das views já escritas.
```
