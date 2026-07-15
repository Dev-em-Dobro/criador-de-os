# docs/legal — Documentos de privacidade e conformidade (LGPD)

> ⚠️ **Modelos técnicos, não aconselhamento jurídico.** Tudo aqui é ponto de
> partida para formalizar o que o sistema já faz. Revise com assessoria jurídica
> antes de usar com um cliente real — especialmente por haver dados de **pessoas
> reais** (leads).

## O que existe aqui

| Documento | O que é | Quem usa | Onde vive |
|---|---|---|---|
| [`acordo-tratamento-dados-dpa.md`](./acordo-tratamento-dados-dpa.md) | **DPA / aditivo de tratamento de dados** entre a Dev em Dobro (Operadora) e o cliente (Controlador). Formaliza a LGPD e a transparência do "Caminho C". | Anexo do contrato agência↔cliente | Fora do app (contrato assinado) |
| Aviso interno no OS | Página **"Privacidade & Termos"** dentro do OS do cliente, resumindo em linguagem simples como os dados são tratados. | Operadores do OS (equipe do cliente) | No app, via `doc-viewer` no manifesto |

## As três camadas de privacidade (não confundir)

1. **Contrato/DPA (agência ↔ cliente)** — o documento que mais protege. É onde a
   transparência do Caminho C vira compromisso escrito. → `acordo-tratamento-dados-dpa.md`.
2. **Política de Privacidade pública (cliente ↔ os leads dele)** — obrigação do
   **cliente**, publicada nos canais públicos dele (site, formulários, pesquisa),
   porque é lá que os leads entregam os dados. A Dev em Dobro pode fornecer um
   modelo, mas quem publica/assume é o cliente. _Não é uma tela do OS._
3. **Aviso interno no OS** — cortesia/boa higiene para a equipe que opera o
   sistema. Não substitui (1) nem (2).

## Padrão de reuso na fábrica

O aviso interno **não usa bloco novo** — é o bloco genérico `doc-viewer` com o
texto em `config.markdown`. Para dar um a um novo cliente, adicione um menu no
manifesto dele:

```ts
{
  key: 'privacidade',
  label: 'Privacidade',
  icon: 'ShieldCheck',
  route: '/privacidade',
  view: {
    block: 'doc-viewer',
    title: 'Privacidade & Termos',
    config: { heading: '...', markdown: '...' }, // trocar nome do cliente/operador
  },
}
```

Referência viva: o menu **Privacidade** em [`apps/neurovida/src/manifest.ts`](../../apps/neurovida/src/manifest.ts).

**Próximo passo de fábrica (sugerido):** fazer o scaffolder emitir esse menu por
padrão (texto templatizado a partir de `productName`/operador), do mesmo jeito que
já gera os blocos de Configurações/Leads/Faturas.
