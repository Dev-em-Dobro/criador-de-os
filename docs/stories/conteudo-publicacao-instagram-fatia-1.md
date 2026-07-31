# Story: Publicar no Instagram pela tela de Cronograma — Fatia 1 (publicação manual)

**ID:** conteudo-publicacao-ig-1.1
**Módulo:** Conteúdo/Social (app `dobro`)
**Autor:** @dev (Dex) — draft para validação
**Status:** Draft (aguarda gate técnico + validação @po)

---

## Story

**Como** criador de conteúdo da Dev em Dobro (Jaque/dono),
**quero** publicar um carrossel/post que já está "Pronto" direto pela tela de Cronograma, com um botão "Publicar agora",
**para** não precisar baixar o .zip e postar na mão no app do Instagram — sem risco de banimento por automação não-oficial.

---

## Contexto & decisão de arquitetura

Usamos a **Instagram Content Publishing API oficial da Meta** (Graph API v21.0) — o canal *sancionado* pela Meta. Não é "automação proibida": bots não-oficiais (que simulam o app) é que causam shadowban; a API oficial só tem limites (100 posts/24h) e as mesmas regras de conteúdo do app normal.

A fundação **já existe** e é reaproveitada:
- Conta `@devemdobro` **Business** vinculada a Página do FB (`env.ts:252`).
- App Meta + token de longa duração `META_APP_TOKEN` + `INSTAGRAM_IG_USER_ID`.
- Cliente Graph API v21.0 funcionando (`server/instagram-insights.ts`) — mesma base (`https://graph.facebook.com/v21.0`), mesmo token, mesmo padrão de `api()`/`InsightsError`.
- Slides já renderizados como imagens públicas na Vercel (`public/carrosseis/<slug>/slide-N.png`).

**Bônus estratégico:** ao publicar guardando o `ig_media_id`, fechamos o elo que falta para o **desempenho automático** e o **aprendizado por performance** dos carrosséis (hoje o match com Insights é manual/frágil). Ver `docs/social/` e memória `carrossel-aprendizado-performance`.

---

## ⛔ Gate bloqueante (Tarefa 0 — antes de qualquer código)

**Confirmar que o `META_APP_TOKEN` tem a permissão de publicação** `instagram_business_content_publish` (a antiga `instagram_content_publish` foi descontinuada em 27/01/2025). Como a conta é **nossa** (self-publishing), normalmente roda em Standard/Development Access **sem App Review completo** — mas isto precisa ser verificado, não assumido.

Checagem **read-only** (não publica nada):
- `GET /me/permissions` (ou `GET /debug_token`) → a permissão de publish aparece como `granted`?
- Confirmar tipo de conta = **Business** (Reels via API não funciona em Creator — mas Fatia 1 é só imagem/carrossel, então não bloqueia; registrar mesmo assim).

**Se a permissão não estiver no token:** adicionar o escopo ao System User no Business Manager / regenerar o token. Se a Meta exigir App Review mesmo para conta própria, escalar para @pm/@devops (fora do escopo de código desta story).

---

## Escopo

**DENTRO (Fatia 1):**
- Publicar **carrossel** (2–10 slides) e **imagem única** já renderizados, na conta `@devemdobro`.
- Disparo **manual** por botão "Publicar agora" no card (só quando `estado = pronto`).
- Converter os slides PNG → **JPEG** (único formato aceito).
- Gravar `ig_media_id` + `permalink` + `published_at` no post e mover `estado → publicado`.

**FORA (fatias futuras):**
- Agendamento automático na `data_programada` (precisa Vercel Cron) → Fatia 2.
- **Reels/vídeo** e **Stories** → Fatia 3+ (Reels exige mais requisitos de mídia).
- Publicar em contas de terceiros (exigiria App Review + Advanced Access).

---

## Acceptance Criteria

1. **AC1** — No card de um post com `estado = pronto` e slides renderizados, existe um botão **"Publicar agora"**. Em `rascunho` ou sem slides, o botão não aparece (ou fica desabilitado com motivo).
2. **AC2** — Ao confirmar, o post é publicado no `@devemdobro` via API oficial: carrossel (N slides na ordem) ou imagem única, com a **legenda** vinda do roteiro (caption + hashtags).
3. **AC3** — As imagens enviadas são **JPEG** por URL pública absoluta; nenhum PNG é enviado à API.
4. **AC4** — Antes de publicar, o container é confirmado como `status_code = FINISHED` (poll até 5 min); só então chama `media_publish`.
5. **AC5** — Em sucesso: o post grava `ig_media_id`, `permalink`, `published_at`, muda para `estado = publicado`, e a UI mostra "Publicado ✓" com link para o post. Idempotência: post já publicado não republica (botão some/bloqueia).
6. **AC6** — Em erro (token, permissão, mídia inválida, rate limit): a UI mostra a mensagem clara, o post **NÃO** muda de estado, e nada é logado com o token. Rate limit (100/24h) tratado com mensagem específica.
7. **AC7** — Rota autenticada (auth-first, fail-closed) e usando o role de menor privilégio (`app_content`); segue o padrão das rotas `/api/conteudo`.

---

## Tasks / Subtasks

- [ ] **T0 — Gate técnico (read-only)** [bloqueante]
  - [ ] Checar permissão de publish no `META_APP_TOKEN` (`/me/permissions` ou `/debug_token`)
  - [ ] Confirmar conta Business; registrar resultado no Dev Agent Record
  - [ ] GO/NO-GO documentado antes de seguir

- [ ] **T1 — Migration: colunas de publicação** (delegar DDL a @data-engineer)
  - [ ] `conteudo_posts`: add `ig_media_id text null`, `ig_permalink text null`, `published_at timestamptz null`
  - [ ] Garantir que o role `app_content` tem UPDATE nessas colunas (já tem na tabela)

- [ ] **T2 — Core `server/instagram-publish.ts`** (espelha `instagram-insights.ts`)
  - [ ] `api()` POST com token do env (reusar `getInstagramInsightsToken` ou novo `getInstagramPublishToken`); NUNCA logar token/URL
  - [ ] `createImageContainer(igId, imageUrl, { isCarouselItem?, caption? })` → container id
  - [ ] `createCarouselContainer(igId, childrenIds[], caption)` → `media_type=CAROUSEL`, `children=` CSV
  - [ ] `waitContainerReady(containerId)` → poll `GET /{id}?fields=status_code` até `FINISHED` (1x/…s, teto 5 min; trata `ERROR`/`EXPIRED`)
  - [ ] `publishContainer(igId, creationId)` → `POST /{igId}/media_publish` → `{ id: mediaId }`
  - [ ] `fetchPermalink(mediaId)` → `GET /{id}?fields=permalink`
  - [ ] `PublishError` rico (status + corpo, sem token), no padrão `InsightsError`

- [ ] **T3 — PNG → JPEG + URL pública absoluta**
  - [ ] `render-carrossel.ts`: emitir também `.jpg` (Playwright `screenshot({ type: 'jpeg', quality: 90 })`) OU converter com `sharp` sob demanda
  - [ ] Script único para converter os carrosséis JÁ renderizados (PNG→JPEG) uma vez
  - [ ] Helper que monta a URL **absoluta pública** do slide a partir do host de produção (base `BETTER_AUTH_URL`/env de deploy) — a API exige URL acessível externamente

- [ ] **T4 — Rota `POST /api/conteudo/:id/publicar`** (`server/conteudo.ts` ou novo `conteudo-publicar.ts`)
  - [ ] Auth-first (401 sem sessão); role `app_content`
  - [ ] Carrega o post; valida `estado = pronto` e ausência de `ig_media_id` (idempotência); extrai slides+legenda do `roteiro`
  - [ ] Monta URLs JPEG absolutas → cria containers → aguarda FINISHED → `media_publish` → busca permalink
  - [ ] Persiste `ig_media_id`/`ig_permalink`/`published_at` + `estado = publicado`
  - [ ] Erros → HTTP claro (400/409/429/502) sem vazar token; monta em `app.ts`

- [ ] **T5 — UI: botão "Publicar agora"** (`src/blocks/ConteudoDashboard.tsx`)
  - [ ] No card com `estado = pronto` e `temSlides`, botão "Publicar agora" (perto do 📱/🗑)
  - [ ] `window.confirm` (ação pública irreversível) → `POST …/publicar`
  - [ ] Feedback: "publicando…/publicado ✓/erro ✕" (reusar padrão `saveFx`); em sucesso vira estado `publicado` e mostra link do permalink
  - [ ] Otimista + revert em erro, no padrão do auto-save atual

- [ ] **T6 — Testes & validação**
  - [ ] Teste manual: publicar 1 carrossel de teste no `@devemdobro` (ou conta sandbox) e conferir no app
  - [ ] `npm run typecheck` + `npm run build` (dobro) limpos
  - [ ] CodeRabbit pre-commit (self-healing, CRITICAL)

---

## Dev Notes

**Fluxo da API (confirmado na doc oficial Meta, jul/2026):**

Carrossel (3 passos):
1. Para cada slide: `POST /{ig-user-id}/media` com `image_url=<jpeg absoluto>` + `is_carousel_item=true` → item container id.
2. `POST /{ig-user-id}/media` com `media_type=CAROUSEL`, `children=<id1,id2,…>` (2–10), `caption=<legenda>` → carousel container id.
3. `POST /{ig-user-id}/media_publish` com `creation_id=<carousel container id>` → `{ id: <ig_media_id> }`.

Imagem única (2 passos): `POST /media` com `image_url` (+`caption`) → `POST /media_publish` com `creation_id`.

**Regras de mídia:**
- **JPEG é o ÚNICO formato aceito — PNG falha.** (Os slides são PNG 1080×1350 hoje → T3.)
- Aspect ratio do carrossel é recortado pela 1ª imagem (default 1:1). Todos os slides são 1080×1350 (4:5) → consistente, sem surpresa.
- `image_url` deve ser **pública e absoluta** (a Meta baixa a imagem). Na Vercel os assets de `public/` são públicos.

**Status check (AC4):** `GET /{container-id}?fields=status_code` → `FINISHED | IN_PROGRESS | ERROR | EXPIRED | PUBLISHED`. Publicar só em `FINISHED`. Para imagem costuma ser imediato; manter o poll por robustez.

**Rate limit:** 100 posts/24h por conta; carrossel conta como 1. Tratar `429`/código de limite com mensagem específica (AC6).

**Segurança:** mesma disciplina do `instagram-insights.ts` — token só no server, nunca logado; nunca exposto ao client (o client só chama `/api/conteudo/:id/publicar`).

**Reaproveitamento:** copiar o esqueleto de `api()`/`InsightsError`/`resolveIgUserId()` de `instagram-insights.ts` (mudando GET→POST). Não reinventar auth/host.

---

## Riscos

| Risco | Mitigação |
|---|---|
| Token sem permissão de publish | **T0 bloqueante** resolve antes de codar |
| PNG rejeitado pela API | T3 converte para JPEG |
| URL do slide não pública (dev local) | Publicar só em ambiente deployado (Vercel) OU túnel; validar host absoluto |
| Container demora/erro | Poll `status_code` com teto 5 min + erro claro |
| Republicação acidental | Idempotência por `ig_media_id` (AC5) + `window.confirm` |

---

## Dependências entre agentes
- **@data-engineer (Dara):** T1 (DDL da migration).
- **@dev (Dex):** T2–T6 (implementação).
- **@devops (Gage):** ajuste de env/permissão no app Meta se T0 falhar; deploy.

---

## Change Log
| Data | Autor | Mudança |
|---|---|---|
| 2026-07-30 | @dev (Dex) | Draft inicial da Fatia 1 |

## Dev Agent Record
_(preenchido durante a implementação)_
- **Agent Model Used:**
- **Debug Log References:**
- **Completion Notes:**
- **File List:**
