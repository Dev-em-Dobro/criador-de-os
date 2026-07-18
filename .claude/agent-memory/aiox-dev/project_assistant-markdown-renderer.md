---
name: assistant-markdown-renderer
description: Renderer de Markdown inline seguro (@os/core) usado por todos os copilotos de IA; doc-viewer usa react-markdown separado
metadata:
  type: project
---

Respostas da IA (chat + análise dos copilotos) vêm em Markdown. Os balões renderizavam texto puro, então apareciam `**` literais. Solução: `Markdown` em `packages/core/src/assistant/Markdown.tsx`, exportado na barrel `@os/core`.

**Why:** dono pediu que negrito/itálico funcionassem nos copilotos (dogfooding do assistente financeiro do neurovida). Precisava ser leve (herdado por todos os apps via @os/core), sem dependência nova e sem XSS (texto da IA é não confiável).

**How to apply:**
- Para texto gerado pela IA em copilotos/agentes, use `<Markdown text={...} className={...} />` (de `@os/core`), NUNCA `dangerouslySetInnerHTML`. Cobre inline básico: `**bold**`/`__bold__`, `*it*`/`_it_`, `` `code` ``, bullets `- `/`* `, quebras de linha. Não cobre headings/tabelas/imagens/links.
- Ao aplicar em balão de chat, remova `whitespace-pre-wrap` (o componente já emite um bloco por linha; senão duplica o respiro).
- Para DOCUMENTOS ricos (headings/tabelas), o caminho é o bloco `doc-viewer` (@os/blocks) que usa `react-markdown` + `remark-gfm` num chunk lazy — não confundir os dois. Ver [[criador-de-os-architecture-rules]].
- Aplicado em `FloatingAgent.tsx` (@os/core) e `agent-gallery/component.tsx` (@os/blocks): chat + resumo/itens/ações da análise.
