# @os/scaffolder — Criador de OS (Fase 4)

Gera `apps/<cliente>` completo (front + `api/` + `db/`) a partir de um manifesto
inicial. Transforma "criar um OS novo" de horas de setup manual em **um comando +
poucas respostas** (doc `docs/architecture/06-scaffolder.md`).

## Uso

A partir da **raiz do monorepo**:

```bash
# wizard interativo
pnpm create-client

# não-interativo (a partir de um arquivo de respostas)
pnpm create-client -- --config packages/scaffolder/examples/cliente-exemplo.answers.json

# valida o manifesto gerado sem escrever nada
pnpm create-client -- --config <arquivo>.json --dry-run

# valida o manifesto de um app existente
pnpm create-client -- validate apps/cliente-exemplo
```

> O `--` separa as flags do wrapper do pnpm. Direto sob tsx (dentro do pacote):
> `tsx src/index.ts --config <arquivo>.json`.

Depois de gerar, rode `pnpm install` na raiz (linka o novo workspace) e siga o
`README.md` gerado dentro de `apps/<cliente>`.

## Presets

| Preset | Gera | Roda sem Neon? | Uso |
|--------|------|----------------|-----|
| `full` (default) | front + `api/` (Hono + Better Auth) + `db/` (Drizzle/Neon). Menus `kpi-dashboard` já ligados a `/api/query` (view read-only na allowlist). | Builda/typecheck sim; rodar com dados precisa de `.env` + migrations. | Cliente real. |
| `static` | só front, sem backend, auth off, dados de exemplo embutidos. | **Sim** (`pnpm -C apps/<x> dev`). | Protótipo/aprovação. |

## Formato do arquivo de respostas (`--config`)

```jsonc
{
  "slug": "cliente-exemplo",        // kebab-case → pasta apps/<slug> e clientId
  "displayName": "Cliente Exemplo", // default: derivado do slug
  "productName": "Cliente Exemplo OS", // default: "<displayName> OS"
  "preset": "full",                 // "full" | "static" (default full)
  "theme": { "brand": "#2563eb", "signal": "#16a34a" }, // paleta derivada da marca
  "auth": true,                     // (full) Better Auth obrigatória
  "allowedDomain": "cliente.com",   // opcional
  "period": { "enabled": true, "default": "monthly" },
  "footerText": "...",              // opcional
  "menus": [
    { "block": "kpi-dashboard", "label": "Vendas", "key": "vendas" },
    { "block": "data-table",    "label": "Clientes", "key": "clientes" },
    { "block": "kanban-board",  "label": "Tarefas", "key": "tarefas" },
    { "block": "doc-viewer",    "label": "Guia", "key": "guia" }
  ]
}
```

Blocos suportados: `kpi-dashboard`, `data-table`, `kanban-board`,
`metric-comparison`, `doc-viewer` (o catálogo genérico de `@os/blocks`).

## Garantias

- **Manifesto sempre válido**: o gerador constrói o objeto e roda o `validateManifest`
  real do core (fail-fast) **antes** de escrever qualquer arquivo (doc 06, §7).
- **Segurança por construção** (preset full): sem segredo com prefixo `VITE_`; a API
  usa roles de menor privilégio (app_auth/app_query); `/api/query` só lê views da allowlist.
- **Não sobrescreve**: recusa gerar se `apps/<slug>` já existe e não está vazio (use `--force` para forçar).

## Limites honestos (doc 06, §5)

- Não cria o projeto Neon nem preenche o `SELECT` real das views (gera a estrutura;
  o dev/DBA escreve a consulta — a view É o contrato de segurança).
- Não popula dados nem desenha blocos sob medida.
- No preset `full`, só `kpi-dashboard` já nasce como `query`; os demais blocos vêm
  `static` (o dev os promove criando uma view + entrada na allowlist).
