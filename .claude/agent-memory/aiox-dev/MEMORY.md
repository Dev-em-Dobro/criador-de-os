# Agent Memory Index — aiox-dev (Dex)

## Project
- [Criador de OS — Faseamento](project_criador-de-os-phases.md) — 0/1A design system, 1B motor, 1C API/Neon+auth (feito), 2 catálogo @os/blocks
- [Criador de OS — Regras de Arquitetura](project_criador-de-os-architecture-rules.md) — boundary unidirecional, core sem cliente, TS estrito, gate = typecheck (lint é no-op)
- [Neon driver gotchas](project_neon-driver-gotchas.md) — HTTP one-shot (sessão por query, SET ROLE só em transaction); least-privilege exige string do app_readonly; REVOKE FROM PUBLIC
- [Markdown renderer dos copilotos](project_assistant-markdown-renderer.md) — @os/core Markdown inline seguro (sem dangerouslySetInnerHTML); doc-viewer usa react-markdown à parte
