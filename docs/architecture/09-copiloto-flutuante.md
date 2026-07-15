# 09 — Copiloto flutuante (assistente de IA por seção)

> Primitivo de fábrica: um FAB estilo WhatsApp, ancorado a uma seção, que faz
> análise automática dos dados daquela seção + chat. Config-driven em 3 camadas.
> Desenhado por @architect (Aria) em 2026-07-14.

---

## 1. Objetivo

Dar a qualquer OS gerado pela fábrica um **copiloto de IA por seção**: um balão
flutuante (canto inferior direito) que, ao abrir, **analisa automaticamente** os
dados reais daquela seção e permite **perguntas de follow-up** por chat.

O caso semente é o **analista financeiro** (sobre a fatura do cartão), mas o
primitivo é genérico: cada seção pode ter o seu especialista.

## 2. Princípios de design

- **Config-driven** — o manifesto declara *que* seção tem copiloto e *como* ele
  se apresenta. Nenhum componente React descreve isso.
- **Persona server-side** — a persona/prompt e o acesso a dados vivem no backend
  (`AssistantProvider`), nunca no browser. O manifesto só carrega o que é seguro
  expor (título, campos, sugestões).
- **Dado nunca sai do servidor** — o backend puxa os dados (Neon), monta o
  contexto e chama o Claude; ao browser só chega o resultado. Chave BYOK e SDK
  ficam server-side (verificado por grep no bundle).
- **Reuso > repetição** — a lógica (loop Claude, saída forçada, sanitização) vive
  uma vez no `@os/server`; cada domínio só fornece persona + provedor de contexto.

## 3. As três camadas

### 3.1 Contrato no manifesto (`@os/core`)

`MenuItem.assistant?: AssistantConfig` (`manifest/types.ts` + `schema.ts`):

```ts
interface AssistantConfig {
  contextKey: string;          // chave do provedor no backend, ex.: 'financas'
  title: string;               // "Analista financeiro"
  subtitle?: string;
  icon?: string;               // ícone lucide do FAB (default: Sparkles)
  starters?: string[];         // sugestões de pergunta
  inputs?: AssistantInput[];   // campos opcionais que o usuário informa
}
interface AssistantInput { key: string; label: string; placeholder?: string; hint?: string; }
```

> Não há persona/prompt aqui — é intencional (segurança + o prompt é de domínio,
> vive no backend). O `contextKey` é o elo entre o manifesto e o provedor.

### 3.2 Núcleo no core (`@os/core`)

- **`assistant/FloatingAgent.tsx`** — o FAB + painel genéricos. Ao abrir, chama
  `POST /api/assistant/:contextKey/analyze`; renderiza a análise no formato
  `{ resumo, secoes[{titulo,itens[]}], acoes[{titulo,detalhe}] }`. Abaixo, chat via
  `/chat`. Campos de `inputs` são renderizados e **persistidos em localStorage**
  (`os-assistant-<contextKey>-<inputKey>`), enviados ao backend em cada chamada.
- **`assistant/types.ts`** — `AssistantAnalysis` / `AssistantSection` / `AssistantAction`.
- **`ManifestRouter`** — quando o **menu ativo** tem `assistant`, monta
  `<FloatingAgent key={menu.key} config={menu.assistant} />` no slot `floating` do
  `AppShell`. Escopo por seção (some ao navegar). A prop `floating` do app segue
  como escape hatch (prioritária).

### 3.3 Backend na fábrica (`@os/server`)

- **`assistant.ts`** — `mountAssistant(app, deps)` expõe, auth-first + BYOK:
  - `POST /api/assistant/:key/analyze` → `{ vazio } | { analise }`
  - `POST /api/assistant/:key/chat` → `{ resposta }`

  ```ts
  interface AssistantProvider {
    persona: string;  // instruções de DOMÍNIO (system-ish)
    provide: (args: { inputs: Record<string,string> }) => Promise<string | null>;
    // ↑ constrói o CONTEXTO (texto) que o agente analisa. null = "sem dados"
    //   (o front mostra o estado vazio sem gastar IA).
  }
  interface AssistantDeps {
    auth: AuthLike;
    resolveApiKey: () => Promise<string | null>;  // BYOK + fallback agência
    providers: Record<string, AssistantProvider>; // por contextKey
  }
  ```

  O loop Claude é genérico: `runAssistantAnalysis` (tool `publish_analysis`
  forçada, formato genérico, **sem** thinking para não conflitar com o forced
  tool) e `runAssistantChat` (adaptive thinking; contexto no system). Modelo:
  `claude-opus-4-8`.

- **`finance-assistant.ts`** — provedor **pronto**: `makeFinanceAssistant(db)` =
  `{ persona: FINANCE_PERSONA, provide }`. A persona é um consultor financeiro
  sênior com método (classifica gasto em fixo×variável, essencial×discricionário,
  **custo×investimento**; prioriza cortes por risco; nunca corta cegamente o que
  gera receita). `buildFinanceSummary` monta o contexto real das faturas
  (deduplicando assinaturas mensais; com `receitaMensal` opcional, lê margem).

## 4. Fluxo de uma análise

```
[browser] FloatingAgent abre
   └─ POST /api/assistant/financas/analyze  { inputs: { receitaMensal? } }
        [server] auth ✓  → resolve provider 'financas'
                 → provider.provide({inputs})  → contexto (texto, do Neon)  | null
                 → runAssistantAnalysis(apiKey BYOK, persona, contexto)
                    → Claude opus-4-8 (tool publish_analysis forçada)
                 ← { resumo, secoes[], acoes[] }
   ← renderiza cards (resumo + seções + recomendações)
   └─ chat: POST /api/assistant/financas/chat { pergunta, historico, inputs }
```

## 5. Como adicionar um copiloto novo

1. **Backend** — escreva um `AssistantProvider` (persona + `provide` que monta o
   contexto a partir dos dados da seção) e registre no `mountAssistant`:

   ```ts
   mountAssistant(app, {
     auth,
     resolveApiKey,
     providers: {
       financas: makeFinanceAssistant(db),
       leads: makeLeadsAssistant(db),   // exemplo futuro
     },
   });
   ```

2. **Manifesto** — declare o `assistant` no menu da seção:

   ```ts
   { key: 'leads', label: 'Leads', route: '/leads',
     assistant: { contextKey: 'leads', title: 'Analista de leads', icon: 'Target' },
     view: { block: 'lead-console', /* … */ } }
   ```

Pronto — o core monta o FAB, o backend serve a análise/chat.

## 6. Segurança

- **Auth-first** em `/analyze` e `/chat` (401 sem sessão).
- **BYOK** — a chave do cliente (cifrada em Configurações) resolve via
  `resolveApiKey`; o SDK e a chave vivem só no servidor.
- **Provider desconhecido → 404**; `inputs`/`historico` sanitizados (strings,
  histórico limitado aos últimos 12 turnos).
- **Anti-alucinação** — o prompt genérico + a persona reforçam "use SÓ os dados;
  nunca invente".

## 7. Decisões e limites

- **Formato genérico `{resumo, secoes, acoes}`** (em vez de campos por domínio):
  expressivo o bastante para qualquer copiloto, sem acoplar o core a finanças. O
  domínio mapeia seu conteúdo nesse formato via a persona.
- **Fonte de dados extra (ex.: receita)** entra como `inputs` do manifesto
  (informados pelo usuário, persistidos localmente) — sem pipeline novo.
- **Escopo por seção** vive no `ManifestRouter` (menu ativo), não em hack de rota.
- **Limite honesto do analista financeiro:** só enxerga a fatura do cartão
  (`invoices`); "saúde do negócio inteiro" exigiria receita/custos fora do cartão
  (a receita informada é o 1º passo; a Hotmart é candidata a fonte automática).

## 8. Arquivos

| Camada | Arquivos |
|--------|----------|
| Manifesto | `@os/core` `manifest/types.ts`, `manifest/schema.ts` |
| Core (UI) | `@os/core` `assistant/FloatingAgent.tsx`, `assistant/types.ts`, `router/ManifestRouter.tsx`, `shell/AppShell.tsx` (slot `floating`) |
| Backend | `@os/server` `assistant.ts`, `finance-assistant.ts` |
| Scaffolder | `@os/scaffolder` `templates-api.ts` (gera `mountAssistant` + `financas` pronto) |
| Exemplo | `apps/neurovida` `api/app.ts` (`mountAssistant`), `src/manifest.ts` (menu Financeiro → `assistant`) |
