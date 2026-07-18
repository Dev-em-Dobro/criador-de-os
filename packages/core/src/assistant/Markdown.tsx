/**
 * @os/core — `Markdown`: renderer de Markdown INLINE básico, leve e SEGURO.
 *
 * As respostas da IA (chat e análise dos copilotos) vêm em Markdown, mas os
 * balões renderizavam texto puro — então apareciam os `**` literais na tela.
 * Este componente resolve isso renderizando o subconjunto inline que a IA usa:
 *
 *  - **negrito** / __negrito__  → <strong>
 *  - *itálico*  / _itálico_     → <em>
 *  - `código`                   → <code> (estilo discreto)
 *  - quebras de linha preservadas (cada linha vira um bloco)
 *  - linhas iniciadas por `- ` ou `* ` viram itens com marcador `•`
 *
 * SEGURANÇA: o texto vem da IA (não confiável). NÃO usamos
 * `dangerouslySetInnerHTML` nem construímos HTML cru — o parser é um
 * tokenizador determinístico que devolve SOMENTE elementos React
 * (<strong>, <em>, <code>, <span>). Qualquer `<`, `>` ou `&` no texto é
 * renderizado como texto literal pelo React (escape automático), então não há
 * superfície para XSS. Delimitadores sem par de fechamento (ex.: `**` sozinho)
 * caem para texto literal, sem quebrar a renderização.
 *
 * Escopo deliberadamente pequeno: NÃO trata headings, tabelas, imagens, HTML
 * embutido nem links. Para documentos ricos existe o bloco `doc-viewer`
 * (@os/blocks), que usa `react-markdown` num chunk lazy à parte.
 *
 * Herda o estilo do container: <strong>/<em> não fixam cor (usam `currentColor`
 * via `inherit`), então funcionam em qualquer skin/tema.
 */

import { Fragment } from 'react';
import type { ReactNode } from 'react';

export interface MarkdownProps {
  /** Texto (possivelmente com Markdown inline) vindo da IA. */
  text: string;
  /** Classe aplicada ao container. */
  className?: string;
}

/**
 * Regex dos spans inline, na ordem de precedência (duplos antes de simples,
 * senão `**x**` seria lido como `*` + `*x*`). Cada alternativa captura o miolo.
 *  1. `**bold**`   2. `__bold__`   3. `*italic*`   4. `_italic_`   5. `` `code` ``
 * Os miolos usam classe negada (`[^*]`, `[^_]`, `[^`]`) e exigem 1+ caractere,
 * então `**` vazio ou `**` sem fechamento não casa e sobra como literal.
 */
const INLINE_RE = /(\*\*([^*]+?)\*\*|__([^_]+?)__|\*([^*\n]+?)\*|_([^_\n]+?)_|`([^`\n]+?)`)/g;

/** Estilo discreto para `código` inline — herda a cor do container. */
const CODE_CLASS = 'rounded bg-black/20 px-1 py-0.5 font-mono text-[0.85em]';

/**
 * Parseia UMA linha (sem quebras) em ReactNode[], aplicando bold/itálico/código.
 * Determinístico: varre da esquerda pra direita; o que não casa vira texto.
 */
function parseInline(line: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  // `INLINE_RE` é global: reset do lastIndex para reuso entre linhas.
  INLINE_RE.lastIndex = 0;
  while ((match = INLINE_RE.exec(line)) !== null) {
    // Texto literal antes do match.
    if (match.index > lastIndex) {
      out.push(<Fragment key={`${keyBase}-t${i}`}>{line.slice(lastIndex, match.index)}</Fragment>);
      i++;
    }

    const [, , bold1, bold2, ital1, ital2, code] = match;
    if (bold1 !== undefined || bold2 !== undefined) {
      out.push(<strong key={`${keyBase}-b${i}`}>{bold1 ?? bold2}</strong>);
    } else if (ital1 !== undefined || ital2 !== undefined) {
      out.push(<em key={`${keyBase}-i${i}`}>{ital1 ?? ital2}</em>);
    } else if (code !== undefined) {
      out.push(
        <code key={`${keyBase}-c${i}`} className={CODE_CLASS}>
          {code}
        </code>,
      );
    }
    i++;
    lastIndex = INLINE_RE.lastIndex;
  }

  // Sobra final (ou a linha inteira, se nada casou).
  if (lastIndex < line.length) {
    out.push(<Fragment key={`${keyBase}-t${i}`}>{line.slice(lastIndex)}</Fragment>);
  }

  return out;
}

/** Uma linha é um item de lista quando começa com `- ` ou `* ` (após espaços). */
function bulletContent(line: string): string | null {
  const m = /^\s*[-*]\s+(.*)$/.exec(line);
  return m ? m[1] : null;
}

/**
 * Renderiza Markdown inline básico como elementos React (sem HTML cru).
 * Quebra o texto por linhas: linhas-bullet viram itens com `•`; as demais viram
 * blocos com as quebras preservadas. Linhas em branco viram espaçamento.
 */
export function Markdown({ text, className }: MarkdownProps): ReactNode {
  const lines = (text ?? '').split('\n');

  return (
    <div className={className}>
      {lines.map((line, idx) => {
        const bullet = bulletContent(line);
        if (bullet !== null) {
          return (
            <div key={idx} className="flex gap-1.5">
              <span aria-hidden="true" className="opacity-70">
                •
              </span>
              <span>{parseInline(bullet, `l${idx}`)}</span>
            </div>
          );
        }
        // Linha em branco → mantém o respiro entre parágrafos.
        if (line.trim() === '') return <div key={idx} className="h-2" aria-hidden="true" />;
        return <div key={idx}>{parseInline(line, `l${idx}`)}</div>;
      })}
    </div>
  );
}
