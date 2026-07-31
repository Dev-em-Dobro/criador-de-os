# Epic: Social Media Estrategista — Instagram como funil de lançamento

**ID:** epic-social-media-estrategista
**Módulo:** Conteúdo/Social (app `dobro`) — materializa o **F003** do `docs/social/features.md`
**Autor:** @dev (Dex) — draft para validação (@pm/@po)
**Status:** Draft
**Data:** 2026-07-30

---

## 1. Contexto de negócio

A Dev em Dobro opera por **lançamento mensal**. O Instagram não é vitrine de vaidade — é **funil**:

```
Descoberta → Captação de lead → Nutrição → Lançamento (evento/oferta) → repete todo mês
```

O conteúdo semanal existe para **captar leads** (mover a pessoa do IG para a lista/DM/grupo) e **nutrir** até o lançamento do mês. Hoje o planejamento é manual e "no feeling"; as métricas existem mas ninguém as transforma em decisão de pauta.

**Oportunidade:** já temos as 4 peças (métricas por post, máquina de geração, cronograma, publicação em planejamento). Falta a **camada de inteligência** que lê o desempenho, aprende o que capta/nutre melhor **pro nosso perfil**, e devolve um cronograma semanal **já materializado em rascunhos** — alinhado à fase do mês.

---

## 2. Objetivo do epic

Um "Social Media Estrategista" **assistivo** (humano aprova; nunca posta cego) que:
1. **Analisa** o desempenho de cada post sob a ótica de **funil de lançamento**.
2. **Sugere** um cronograma semanal (tema, formato, gancho, dia/hora, e o porquê) coerente com a **fase do mês** (nutrir vs aquecer vs lançar).
3. **Materializa** as sugestões como rascunhos no board (reusando o pipeline de geração) — "sem dar mais trabalho".
4. **Reaproveita** os campeões (repost / remix de formato / parte 2) com 1 clique.

### Métricas de sucesso
- % de posts da semana que nascem do Estrategista (vs mão) — meta inicial ≥ 60%.
- Tempo de planejamento semanal: de ~horas → ~minutos (só revisar/aprovar).
- Tendência de alta no **Lead Score médio** por post ao longo dos ciclos.

---

## 3. Princípio central — o **Lead Score** (recomendado)

Curtidas enganam. Para o modelo captar→nutrir→converter, o ranking usa taxas **normalizadas por alcance** e ponderadas pelo valor de funil:

| Sinal | Peso | Por quê (no modelo de lançamento) |
|---|---|---|
| `comentarios / alcance` | **Alto** | Proxy direto de captação — o CTA "comenta PALAVRA" vira DM → lead (já usado, ex.: carrossel GTA) |
| `visitas_perfil / alcance` | **Alto** | Interesse real → vai à bio/link (porta de entrada do funil) |
| `salvamentos / alcance` | **Alto** | Intenção + autoridade (nutrição; conteúdo que a pessoa guarda p/ voltar) |
| `compartilhamentos / alcance` | Médio | Alcance qualificado (descoberta de novos leads) |
| `seguidores / alcance` | Médio | Base de nutrição para os próximos lançamentos |
| `curtidas / alcance` | Baixo | Vaidade — quase não pesa |

O peso é **ajustável** e muda conforme a **fase do mês** (§4). O score é determinístico e **explicável** ("esse carrossel puxou 3× mais comentário/alcance que a média → melhor captador do mês").

> ⚠️ Limitação honesta: cliques no link da bio e conversão real p/ a lista **não** vêm da Graph API. Usamos comentários + visitas ao perfil como **proxies**. Se houver DM automation (ManyChat etc.), integrar depois fecha essa medição.

---

## 4. Consciência do calendário de lançamento

O plano semanal se adapta à distância до próximo lançamento:

| Fase (distância do lançamento) | Peso do score inclina p/ | Mix de conteúdo sugerido |
|---|---|---|
| **Nutrição** (semana 1–2 pós-lançamento) | autoridade/saves | valor, ensino, bastidores; captação leve |
| **Captação** (meio do mês) | comentários + visitas perfil | lead magnets, CTA "comenta X", provas |
| **Aquecimento** (semana pré-lançamento) | compartilhamentos + comentários | antecipação, dores, cases, "vem aí" |
| **Lançamento** (semana do evento) | conversão/CTA | convite ao evento, urgência, depoimentos |

Requer uma config simples: **data/cadência do próximo lançamento** (§7).

---

## 5. Arquitetura (o que reaproveita)

Serviço server-side `server/social-planner.ts`:
1. **Coleta** — agrega a view read-only `v_conteudo_desempenho` (nunca a tabela crua) + histórico de `v_conteudo_posts`.
2. **Analisa (determinístico)** — Lead Score por post; médias por formato/pilar/dia-hora; top e bottom performers.
3. **Sugere (LLM)** — Claude (`ANTHROPIC_API_KEY` já existe), **saída estruturada por tool** (mesmo padrão de `conteudo-pipeline.ts`): recebe os padrões + os top performers como few-shot e a fase do mês → devolve o plano semanal com justificativas.
4. **Materializa** — cria `conteudo_posts` (estado `rascunho`), opcionalmente já chamando `conteudo-pipeline.ts` para gerar o conteúdo de cada card.
5. **UI** — aba "Estrategista" no módulo de Conteúdo: mostra o plano + "Adicionar ao cronograma"; e cards de reaproveitamento.

Reaproveita 100%: `conteudo_desempenho`, `instagram-insights.ts` (sync), `conteudo-pipeline.ts` (geração, **já força formato** p/ remix), board do Cronograma, e a Publicação (epic Fatia 1) para fechar o loop.

---

## 6. Escopo — 4 stories (ordem de dependência e valor)

### Story 1 — Analista ("o que funciona pro nosso perfil")
Motor de **Lead Score** + tela de análise: ranking por formato/pilar/objetivo, top e piores posts, cada número explicado. **Já entrega valor com os dados manuais de hoje** (sem LLM, sem depender do sync). Mostra "nível de confiança" pela amostra.

### Story 2 — Estrategista (cronograma semanal)
LLM gera o plano da semana (N cards: pilar, formato, gancho, dia/hora, porquê) a partir dos padrões da Story 1 + fase do mês → botão "Adicionar ao cronograma" cria os rascunhos.

### Story 3 — Reaproveitador (republicar sem trabalho)
Detecta **campeões evergreen** (Lead Score alto + idade > N dias) e sugere, com 1 clique (reusando o pipeline): **repost**, **remix de formato** (carrossel↔reels), **parte 2/série**.

### Story 4 — Autônomo assistido (trabalho zero)
Cron semanal (Vercel) prepara o plano toda segunda, deixa os rascunhos prontos e avisa no **Telegram** (bot já existe). Humano só revisa.

---

## 7. Modelo de dados — o que falta

- **Pilares de conteúdo** — hoje `conteudo_desempenho.tema` é texto livre. Precisamos agrupar em pilares (ex.: IA, carreira dev, ferramentas, bastidores, oferta). Opções: (a) você define os pilares e a gente classifica por LLM; (b) coluna `pilar` + classificação automática. → decisão de @pm/@po.
- **Calendário de lançamento** — config nova: data/cadência do próximo lançamento (tabela `lancamentos` simples OU config do módulo). Alimenta §4.
- **Lead Score** — derivado (calculado на leitura, não persistido), igual às taxas do módulo de desempenho hoje. Sem mudança de schema.

DDL (se houver) → @data-engineer.

---

## 8. Fora de escopo (deste epic)
- Publicação em si (é o **epic de Publicação — Fatia 1**, pré-requisito para o loop 100%).
- Multi-plataforma (TikTok/YouTube) — o sistema é Instagram-only.
- DM automation / integração com ManyChat (mediria lead de verdade; fica como evolução).
- Postar sem aprovação humana (decisão: **assistivo**, não autônomo cego).

---

## 9. Gates & dependências
1. **Dado é o combustível** — qualidade sobe com histórico. A Story 1 roda com entrada manual de hoje; fica "pro nosso perfil" de verdade quando o **sync de Insights** (gate do token, recorrente) alimentar `conteudo_desempenho`. Mostrar nível de confiança pela amostra.
2. **Categorização em pilares** (§7) — pré-requisito da análise por tema.
3. **Publicação (Fatia 1)** — necessária para o "sem trabalho" total (Story 3/4).
4. **Revisão de decisão** — `features.md` diz "sem publicação automática por enquanto"; o dono está avançando nisso (epic de Publicação). Este epic mantém **aprovação humana** mesmo no modo autônomo.

---

## 10. Riscos
| Risco | Mitigação |
|---|---|
| Amostra pequena → sugestão genérica | Nível de confiança visível; começar com best-practices + calibrar com dados |
| Proxy de lead imperfeito (sem clique/DM) | Ser explícito; priorizar comentários/visitas; integrar DM automation depois |
| LLM "alucinar" pauta fora da marca | Saída estruturada + few-shot dos NOSSOS campeões + revisão humana obrigatória |
| Depender do sync de Insights | Story 1 funciona com dado manual; sync melhora, não bloqueia |

---

## 11. Sequência recomendada
`Story 1 (Analista)` → `Story 2 (Estrategista)` → `Story 3 (Reaproveitador)` → `Story 4 (Autônomo)`.
Em paralelo, destravar o gate de dados (sync de Insights) e definir pilares + calendário de lançamento.

---

*Relacionado: `docs/social/features.md` (F001/F003/F004), `docs/stories/conteudo-publicacao-instagram-fatia-1.md`, memórias `carrossel-aprendizado-performance`, `desempenho-conteudo-modulo`.*
