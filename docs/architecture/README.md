# Arquitetura do "Criador de OS"

Blueprint de arquitetura (design, sem código de produção) para transformar o **Dobro OS** — ferramenta interna de gestão do Dev em Dobro — numa **fábrica de OSs sob medida para clientes**: um monorepo config-driven onde cada cliente é um manifesto + tema + **backend/API próprio + projeto Neon (Postgres) próprio**, herdando um núcleo reutilizável.

> Autora: Aria (@architect) · Data: 2026-07-12 · Fonte analisada: `dobro-company-agents/dashboard`
>
> **Revisado (2026-07-12): Firebase → NeonDB.** O banco passou de Firestore para **NeonDB (Postgres serverless)**, acessado por **backend/API por app** (funções serverless) com a connection string **só server-side**; auth passou a ser **obrigatória via Better Auth**. Docs afetados: 00, 02, 03, 05 (reescrito), 06, 07, 08. O monorepo, o manifesto, os blocos, o BlockRegistry e o tema **não mudaram**.

## Documentos (ler nesta ordem)

| # | Documento | Conteúdo |
|---|---|---|
| 00 | [`00-blueprint.md`](./00-blueprint.md) | Visão geral: layout do monorepo, packages, direção de dependências, pnpm+Turborepo, build/deploy, e como o `App.tsx` hardcoded vira config-driven. |
| 01 | [`01-inventory.md`](./01-inventory.md) | Inventário e classificação dos artefatos do Dobro OS em 3 baldes (Core / Bloco genérico / Específico do cliente), com esforço de extração honesto. |
| 02 | [`02-manifest-schema.md`](./02-manifest-schema.md) | **Coração:** o tipo `ClientManifest` (marca, `dataApi`, navegação, bindings `kind:'query'`) + exemplo preenchido do "Cliente Exemplo". |
| 03 | [`03-contrato-bloco.md`](./03-contrato-bloco.md) | Contrato de bloco (props, registry por inversão de controle) e o data-source adapter que agora chama a API do app. Exemplo `KpiDashboardBlock` (inalterado). |
| 05 | [`05-dados-auth-multitenant.md`](./05-dados-auth-multitenant.md) | **Reescrito:** NeonDB por cliente, backend/API por app, o **endpoint de query genérico seguro** (allowlist de views + bind params), Better Auth, onde fica a `DATABASE_URL`, ausência de realtime, e hospedagem. |
| 06 | [`06-scaffolder.md`](./06-scaffolder.md) | Design do gerador de clientes: o que gera, o que pede, fluxo do operador. |
| 07 | [`07-plano-migracao.md`](./07-plano-migracao.md) | Plano faseado (Fase 0 → 4) com objetivo, entregáveis, critério de "pronto" e esforço relativo. |
| 08 | [`08-riscos-decisoes.md`](./08-riscos-decisoes.md) | Riscos técnicos com mitigação e decisões em aberto para o dono. |
```
