---
name: project-criador-de-os
description: Premissas e decisões-chave de arquitetura do "criador de OS" — monorepo que fabrica dashboards de gestão sob medida para clientes do Dev em Dobro.
metadata:
  type: project
---

Este repo (`criador-de-os`) é uma **fábrica de OSs**: gera dashboards de gestão sob medida para clientes do Dev em Dobro, extraindo um núcleo reutilizável do OS interno existente ("Dobro OS", em `D:\----- DEVQUEST\dobro-company-agents\dashboard`). NÃO é SaaS. Dev em Dobro configura e entrega pronto; o cliente opera.

**Why:** o Dobro OS tem roteamento/menus 100% hardcoded num `App.tsx` de ~540 linhas e ~60 seções acopladas ao próprio Dev em Dobro (Scudo, Curseduca, CodeQuest, nomes de pessoas). Querem produzir OSs para clientes de forma fácil, customizável e expansível.

**How to apply:** ao propor qualquer coisa neste repo, respeitar as premissas já decididas pelo dono (não relitigar):
- MONOREPO: `packages/core` (chassi + design system), `packages/blocks` (blocos genéricos), `apps/<cliente>` (manifesto + tema + blocos sob medida + Firebase próprio). Direção de dependência estrita: `apps → blocks → core`; core nunca conhece cliente.
- CONFIG-DRIVEN via um MANIFESTO por cliente (`ClientManifest`): menus → blocos → dataSource + tema. Substitui o switch gigante do App.tsx.
- Um projeto Firebase/Firestore por cliente (isolamento simples). Reavaliar multi-tenant só em ~dezenas de clientes.
- Precisa de auth + isolamento (Dobro OS hoje NÃO tem auth — gap de segurança prioritário; ligar Firebase Auth antes de produção).
- Stack fixa: React 19 + TS + Vite 7 + Tailwind 4 + Firestore + react-router-dom 7 + lucide-react.

Blueprint completo em `docs/architecture/` (docs 00–08). Decisões-chave: pnpm+Turborepo; DataProvider por injeção (fim do `db` singleton de `services/firebase.ts`); ManifestRouter + DataAdapter genérico são as 3 peças de core mais caras (esforço G); Dobro OS é ~70% específico / ~30% reutilizável — NÃO generalizar antes de 2 casos reais (regra dos 2 casos). Plano faseado: 0 setup → 1 core → 2 blocos → 3 piloto+auth → 4 scaffolder.
