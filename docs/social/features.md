# Módulo Conteúdo / Social — Mapa de Features

> Fonte de verdade das features do módulo de gestão de conteúdo de redes sociais
> no **Dobro OS**, começando pelo **Instagram**. Base para as stories.
> Atualizado em **2026-07-18**.

**Legenda de status:** ✅ Feito · 🟡 Parcial · 🔨 Em construção · ⬜ A fazer

---

## Visão do módulo

Gerir os conteúdos das redes sociais dos clientes. O fluxo principal é
**reference-driven**: uma referência que foi bem cai num inbox (Telegram) → a IA
entende **por que** foi bem → gera um esboço (carrossel **ou** reels) em **AIDA**
→ aparece como **Rascunho** no board → humano aprova (Pronto) → publica
(Publicado, rastreio manual por enquanto).

## Base do módulo (entregue / em curso)

| ID | Feature | Status | Notas |
|----|---------|--------|-------|
| **BC-1** | **Board de Conteúdo** — kanban Rascunho/Pronto/Publicado; card com capa, formato (🎠/🎬), data programada, título, CTA e link do presente | ✅ | Tabela `conteudo_posts` + view `v_conteudo_posts` (allowlist) + bloco `kanban-board` estendido + menu **Conteúdo**. Migration `0001`. A rota Conteúdo passou a renderizar o **Painel custom** (ver F001); o `kanban-board` estendido segue reutilizável. |
| **BC-2** | **Ingestão via Telegram** — webhook recebe link do Instagram e grava em `referencias` (pendente) | ✅ | `POST /api/telegram/webhook`, defesa por `secret_token`, role `app_ingest` (INSERT só em `referencias`). Falta ir ao ar: bot no @BotFather + túnel público. |
| **BC-3** | **Pipeline referência → rascunho** — análise "por que foi bem" → AIDA → gera Rascunho (carrossel ou reels), ligando `referencia_id` | 🔨 | AI action server-side (BYOK, saída estruturada), padrão "Estúdio IA". |

## Roadmap (pedido do dono)

| ID | Feature | Status | Já existe (reaproveitável) | Falta / dependência |
|----|---------|--------|----------------------------|---------------------|
| **F001** | **Painel Principal** — resumo geral: posts na semana, melhores desempenhos, gráfico de crescimento de seguidores | 🔨 | **Em construção:** bloco `custom:conteudo-dashboard` (`apps/dobro/src/blocks/ConteudoDashboard.tsx`) na rota **Conteúdo** — faixa Resumo (próximos posts de `v_conteudo_posts`) + herói de crescimento + mini-calendário | Crescimento/calendário hoje são **config mock**; "posts na semana" e "melhores desempenhos" dependem de **analytics real** |
| **F002** | **Calendário** — cronograma de publicação; comparar o nosso com o da referência "pra ver se foi bem mesmo" | ⬜ | Board kanban (não é calendário) | **Bloco de calendário** novo. A comparação nosso-vs-referência depende de **métricas dos dois lados** (analytics). ⚠️ Descrição mistura duas coisas — ver Questões em aberto |
| **F003** | *(reservado — não informado)* | ⬜ | — | Definição do dono |
| **F004** | **Métricas visual incrível** — cards grandes com número **laranja** + seta ↑verde/↓vermelha (Total de seguidores, Média de engajamento, Visualizações do mês, Melhor post da semana); gráfico de **linha** 30d; gráfico de **barras** IG/TikTok/YouTube; **animações** de entrada | 🟡 | `KpiCard` já faz **número + seta verde (▲) / vermelha (▼)**; tela **Métricas** existe (**mock estático**: inscritos/visualizações/engajamento/novos seguidores); `TrendChart` (sparkline); bloco `metric-comparison` | Número **grande em laranja** (tema hoje é roxo), **gráfico de linha 30d**, **barras multi-plataforma**, **animações de entrada**, "**melhor post da semana**", e **dados reais** |

## Dependências transversais

1. **Ingestão de analytics real** — hoje **toda** métrica é mock estático. Para
   os números/setas de F001 e F004 fazerem sentido (seguidores, engajamento,
   views, melhor post), é preciso ingerir analytics: **Instagram Graph API**,
   **Metricool MCP** ou **Meta Ads MCP** (todos disponíveis). É uma fatia própria.
2. **Multi-plataforma (TikTok/YouTube)** — não existe em nada; o sistema é
   **Instagram-only**. O campo `conteudo_posts.plataforma` existe, mas não há
   métricas nem ingestão de outras plataformas. O gráfico de barras do F004
   traz isso pro escopo.

## Modelo de dados (atual)

- **`referencias`** — inspirações capturadas: `canal`, `origem_url`,
  `formato_ref`, `conteudo_bruto`, `nota_time`, `metricas_ref`, `analise`,
  `status` (pendente/processada).
- **`conteudo_posts`** — cards do board: `titulo`, `capa_url`,
  `data_programada`, `cta_final`, `link_presente_notion`, `estado`,
  `plataforma`, `formato`, `gancho`, `pauta`, `legenda`, `hashtags`,
  `roteiro` (jsonb: slides do carrossel **ou** cenas do reels), `referencia_id`.

## Questões em aberto

- **F003:** o que é? (o dono pulou de F002 para F004).
- **F002:** separar "**calendário de publicação**" (agendar/ver posts por data)
  da "**comparação nosso-vs-referência**" (analytics) — são duas features com
  dependências diferentes.
- **Publicação real** (Metricool/Meta) — fora do escopo atual; o estado
  "Publicado" é marcado manualmente por enquanto.

## Decisões fechadas (não relitigar)

- Ingestão via **Telegram** (inbox pra onde se encaminha), **não** leitura de
  grupo de WhatsApp pessoal (sem API oficial; ban/fragilidade).
- **Sem publicação automática** por enquanto.
- Formato do post: **carrossel OU reels**, decidido dentro do pipeline.
- "Agentes/skills/workflow" (Head, gancho, revisor, pauta AIDA…) são o **modelo
  conceitual**; no produto viram **AI actions server-side** (BYOK, saída
  estruturada), no padrão da ação "Estúdio IA".

---

*Relacionado: `docs/ESTADO-DO-PROJETO.md`, `docs/architecture/`.*
