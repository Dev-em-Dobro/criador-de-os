# Story 1 — Analista: "o que funciona pro nosso perfil" (Lead Score)

**Epic:** `docs/stories/epics/social-media-estrategista.md` (F003)
**ID:** social-estrategista-1.1
**Módulo:** Conteúdo/Social (app `dobro`)
**Autor:** @dev (Dex) — draft
**Status:** Ready for Review (T1–T4 implementadas)

---

## Story

**Como** dono/criadora do @devemdobro (modelo de lançamento mensal),
**quero** uma tela que rankeie meus posts por um **Lead Score de funil** e mostre padrões (qual formato/dia capta e nutre melhor),
**para** saber, com base em dado real, o que replicar — sem depender de nenhum gate externo.

---

## Contexto & decisão

A tela de Desempenho (`/conteudo/desempenho`) **já** deriva taxas por post e classifica (Vencedor/Promissor/…/Fraco) usando `DEFAULT_BENCH` + `desempenho-guia.ts`. O que falta é uma leitura **estratégica e unificada**: um score único que rankeie os posts pelo valor de **funil** (captar/nutrir), destaque os **campeões** e aponte **padrões acionáveis**.

Esta story adiciona essa camada **reaproveitando** o que existe. É a fatia que **roda com os dados manuais de hoje** (entrada na planilha de desempenho) — sem LLM, sem sync de Insights, sem publicação.

---

## Escopo

**DENTRO:**
- Módulo puro de **Lead Score** por post (determinístico, explicável).
- Tela/seção **"Análise"**: ranking de campeões (e piores), padrões por **formato** e por **dia da semana**, **nível de confiança** pela amostra.
- Seletor de **objetivo** (default: **Captar lead**) que ajusta os pesos e re-rankeia na hora.
- Cada item traz o **porquê** (número real) + a **decisão sugerida** (reusa `CLASSIFICACAO` do guia).

**FORA (outras stories):**
- Geração do plano semanal por LLM (Story 2).
- Reaproveitamento em 1 clique (Story 3).
- Análise por **pilar de conteúdo** (depende de pilares — hoje `tema` é texto livre).
- Sync de Insights e calendário de lançamento (gates do epic).

---

## Lead Score (especificação)

Para cada post com `alcance > 0`, calcular as **taxas por alcance**:
`t_coment = comentarios/alcance`, `t_visitas = visitas_perfil/alcance`, `t_salv = salvamentos/alcance`, `t_compart = compartilhamentos/alcance`, `t_seg = seguidores/alcance`, `t_curt = curtidas/alcance`.

**Sinal de cada taxa** (normalizado, `0..3`), por ordem de preferência:
1. **Relativo à mediana** do próprio perfil no mesmo formato (o guia recomenda: "compare com a mediana dos últimos 10–20 do mesmo formato") — `sinal = clamp(taxa / mediana_formato, 0, 3)`. Usado quando há **≥ 8** posts do formato.
2. **Absoluto por faixa** (`DEFAULT_BENCH`/`IG_FAIXAS`: Fraco/Saudável/Forte) quando a amostra é pequena — mapeia para `0..3`.

**Pesos por objetivo** (somam 1,0):

| Objetivo | coment | visitas | salv | compart | seg | curt |
|---|---|---|---|---|---|---|
| **Captar lead** (default) | 0,30 | 0,25 | 0,20 | 0,15 | 0,10 | 0 |
| Autoridade | 0,10 | 0,15 | 0,40 | 0,20 | 0,15 | 0 |
| Alcance | 0,10 | 0,10 | 0,15 | 0,45 | 0,20 | 0 |
| Equilibrado | 0,20 | 0,20 | 0,20 | 0,20 | 0,20 | 0 |

**Lead Score do post** = `Σ (peso_i × sinal_i)` → escalonado para **0–100** e rotulado (**Campeão** ≥ ~66, **Bom** ~40–66, **Médio** ~20–40, **Fraco** < 20). Rótulos calibrados na implementação.

**Nível de confiança** (sempre visível): nº de posts com `alcance` válido — `< 5` baixa · `5–15` média · `> 15` boa. Abaixo de 8 no formato, o score usa faixas absolutas (indicar "calibração de mercado, não do perfil ainda").

> Guardas: `alcance` nulo/0 → post fica "sem dados de alcance" (fora do ranking, listado à parte). Objetivo escolhido é só de leitura (não persiste dado; muda só a visualização).

---

## Acceptance Criteria

1. **AC1** — A tela lista os posts medidos ordenados por **Lead Score** (desc), com o número, o rótulo (Campeão/Bom/Médio/Fraco) e o **porquê** (taxa que mais puxou o score).
2. **AC2** — Um bloco **"Campeões"** (top N) e um **"Rever"** (bottom N), cada card com a **decisão sugerida** do guia (ex.: "Replicar tema/estrutura/gancho").
3. **AC3** — **Padrões**: qual **formato** e qual **dia da semana** têm melhor Lead Score médio, com o valor e a contagem de amostra.
4. **AC4** — **Seletor de objetivo** (Captar lead default / Autoridade / Alcance / Equilibrado) re-rankeia tudo na hora.
5. **AC5** — **Nível de confiança** exibido; com amostra pequena, o texto deixa claro que usa benchmark de mercado, não do perfil.
6. **AC6** — Posts sem `alcance` aparecem separados ("sem dados suficientes"), nunca quebram o cálculo.
7. **AC7** — Zero dependência de LLM/sync/token; roda só com o que já está em `conteudo_desempenho`.

---

## Tasks / Subtasks

- [x] **T1 — Módulo puro `src/blocks/social-analise.ts`** (sem React/servidor, igual a `desempenho-guia.ts`) ✅
  - [x] `PostMetrics` (números limpos) + `taxa()` por alcance — a tela fará o mapeamento `Row → PostMetrics` (mais desacoplado que depender de `Row`)
  - [x] `construirContexto()` → medianas de cada taxa por formato + flag de amostra suficiente
  - [x] `leadScore(post, ctx)` → `{ score (0–100), rotulo, taxaTop, sinais, semAlcance }`
  - [x] `agregarPorFormato()` / `agregarPorDiaSemana()` → médias + amostra
  - [x] `nivelConfianca()` → 'baixa'|'media'|'boa'
  - [x] `PESOS` por objetivo exportado + `rankear()` (bônus, já pensando na T2/Story 2)
- [x] **T2 — Tela/seção "Análise"** ✅ (`ConteudoAnalise.tsx`, seção no topo do bloco de Desempenho)
  - [x] Reusa os dados que o bloco Desempenho já carrega da `v_conteudo_desempenho` (sem rota nova)
  - [x] Ranking (AC1) + Campeões (AC2) + Padrões formato/dia (AC3) + Confiança (AC5) + sem-alcance (AC6)
  - [x] "Porquê" via `taxaTop` + **decisão sugerida** por rótulo (derivada de `CLASSIFICACAO` do guia)
  - [x] Decisão: **seção** dentro de `/conteudo/desempenho` (não fragmenta; usa todo o histórico, independente do período)
- [x] **T3 — Seletor de objetivo** (AC4) — 4 pills (Captar lead default / Autoridade / Alcance / Equilibrado); re-rankeia na hora ✅
- [x] **T4 — Testes & validação** ✅
  - [x] Teste com fixtures `apps/dobro/scripts/test-social-analise.ts` (18 checks: ordem, troca de objetivo, alcance 0/nulo, agregações, confiança) — **18/18 ✅**
  - [x] `npm run typecheck` e `npm run build` (dobro) limpos com a tela integrada
  - [ ] CodeRabbit pre-commit — opcional (WSL); sugerido antes do commit por @devops

---

## Dev Notes

**Reaproveitar (não reinventar):**
- `apps/dobro/src/blocks/desempenho-guia.ts` — `IG_FAIXAS` (Fraco/Saudável/Forte), `IG_PRIORIDADES` (prioridade por formato), `CLASSIFICACAO`, `faixaPct()`, e `guiaComoTextoParaIA()` (para a Story 2).
- `apps/dobro/src/blocks/ConteudoDesempenho.tsx` — `DEFAULT_BENCH` (linha ~125) e a derivação/classificação por linha (~175) e a agregação por formato (~681). Se a extração for limpa, mover a derivação de taxas p/ o módulo puro e a tela passa a importá-la (evita divergência).
- Leitura: `v_conteudo_desempenho` (colunas: data, formato, tema, alcance, visualizacoes, curtidas, comentarios, compartilhamentos, salvamentos, visitas_perfil, seguidores, duracao_s, tempo_medio_s, permalink). Já legível por `app_query` via `/api/query`.

**Por que mediana do perfil > faixa fixa:** o próprio guia (`NOTA_METODOLOGICA`) diz que o benchmark mais confiável é a mediana dos últimos 10–20 do mesmo formato. Por isso o Lead Score prefere mediana-relativa e cai p/ faixa absoluta só com amostra pequena.

**Alinhamento de negócio:** objetivo default = **Captar lead** (comentários = proxy do CTA "comenta X" → DM → lead; visitas ao perfil = porta do funil). Ver epic §3.

**Ponte p/ Story 2:** `agregarPorFormato`/`medianas`/top-N são exatamente o "briefing analítico" que o Estrategista (LLM) vai consumir. Projetar as saídas do módulo puro já pensando nisso (JSON serializável).

---

## Testing
- Unit (Vitest, se configurado no dobro; senão fixtures + asserts simples): score determinístico, ordenação, empates, alcance 0/nulo, troca de objetivo muda ranking, mediana vs faixa conforme amostra.
- Manual: abrir a Análise com os dados atuais, conferir se os "campeões" batem com o que a criadora percebe na prática (sanidade).

## Change Log
| Data | Autor | Mudança |
|---|---|---|
| 2026-07-30 | @dev (Dex) | Draft inicial da Story 1 (Analista) |
| 2026-07-30 | @dev (Dex) | T1 implementada (módulo `social-analise.ts`) + testes 18/18; typecheck limpo |
| 2026-07-30 | @dev (Dex) | T2–T4: tela `ConteudoAnalise.tsx` (seção no Desempenho), seletor de objetivo, decisão sugerida; build limpo → Ready for Review |

## Dev Agent Record
- **Agent Model Used:** claude-opus-4-8[1m]
- **Debug Log References:** `npx tsx apps/dobro/scripts/test-social-analise.ts` → 18/18 · `npm run typecheck` (dobro) limpo
- **Completion Notes:**
  - T1 completa. Módulo PURO (sem React/servidor), reusa `IG_FAIXAS` de `desempenho-guia.ts`. Lead Score normaliza pela **mediana do perfil** (≥8 posts do formato) com fallback para **faixa de mercado**; renormaliza pelos pesos efetivamente usados quando falta métrica.
  - Decisão: o módulo trabalha com `PostMetrics` (números limpos) em vez do `Row` da tela — mais desacoplado e testável. A T2 fará o mapeamento `Row → PostMetrics`.
  - `rankear()` + saídas serializáveis já projetadas para virarem o "briefing analítico" da Story 2 (Estrategista).
  - T2: `ConteudoAnalise.tsx` renderiza a seção (seletor de objetivo, padrões formato/dia, campeões com ação sugerida, ranking completo, confiança, sem-alcance). Integrada no topo do bloco de Desempenho, usando `sortedRows` (todo o histórico) — independente do PeriodPicker, que filtra só a lista de medições.
  - Decisão: a análise usa TODO o histórico (mediana/padrões precisam de amostra), não o período selecionado.
  - CodeRabbit não rodado (opcional/WSL) — sugerido antes do commit por @devops.
- **File List:**
  - `apps/dobro/src/blocks/social-analise.ts` (novo) — motor de Lead Score + agregações
  - `apps/dobro/src/blocks/ConteudoAnalise.tsx` (novo) — seção "Análise" (UI)
  - `apps/dobro/scripts/test-social-analise.ts` (novo) — testes com fixtures (tsx)
  - `apps/dobro/src/blocks/ConteudoDesempenho.tsx` (editado) — importa e renderiza a seção Análise
  - `docs/stories/social-estrategista-1-analista.md` (atualizado) — progresso T1–T4
