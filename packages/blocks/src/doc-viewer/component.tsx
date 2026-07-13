/**
 * @os/blocks — `doc-viewer` (componente).
 *
 * Carregado via `lazy` pela definição em `./index` (default export). É AQUI que
 * `react-markdown` + `remark-gfm` são importados — por isso este módulo vira um
 * chunk separado, mantendo essas libs fora do bundle inicial dos apps.
 *
 * Fontes do conteúdo (precedência): `config.markdown` → `config.body` (juntado
 * por linhas em branco) → um campo markdown da linha [0] de `ctx.data`
 * (`config.field`, default 'conteudo'). Um `config.heading` opcional vira um H1.
 *
 * Contrato: NÃO conhece cliente, coleção nem texto de negócio.
 */

import { useMemo } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockProps } from '@os/core';
import { asRows, toText } from '../internal/rows';
import type { DocViewerConfig } from './index';

// ============================================================
// Estilo do markdown (mapeia elementos → design system, sem plugin externo)
// ============================================================

/**
 * Componentes do markdown estilizados com o design system. Mantém tudo em
 * classes utilitárias (sem `@tailwindcss/typography`) para não crescer o bundle
 * com um plugin só para isto.
 */
const markdownComponents = {
  h1: (props: { children?: ReactNode }) => (
    <h1 className="mb-3 mt-6 text-2xl font-bold tracking-tight text-gray-100 first:mt-0">
      {props.children}
    </h1>
  ),
  h2: (props: { children?: ReactNode }) => (
    <h2 className="mb-2 mt-6 text-xl font-bold tracking-tight text-gray-100">{props.children}</h2>
  ),
  h3: (props: { children?: ReactNode }) => (
    <h3 className="mb-2 mt-4 text-lg font-semibold text-gray-100">{props.children}</h3>
  ),
  p: (props: { children?: ReactNode }) => (
    <p className="mb-3 leading-relaxed text-gray-300">{props.children}</p>
  ),
  ul: (props: { children?: ReactNode }) => (
    <ul className="mb-3 ml-5 list-disc space-y-1 text-gray-300 marker:text-blue-400">
      {props.children}
    </ul>
  ),
  ol: (props: { children?: ReactNode }) => (
    <ol className="mb-3 ml-5 list-decimal space-y-1 text-gray-300 marker:text-blue-400">
      {props.children}
    </ol>
  ),
  li: (props: { children?: ReactNode }) => (
    <li className="leading-relaxed">{props.children}</li>
  ),
  a: (props: { href?: string; children?: ReactNode }) => (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-400 underline decoration-blue-500/40 underline-offset-2 hover:text-blue-300"
    >
      {props.children}
    </a>
  ),
  blockquote: (props: { children?: ReactNode }) => (
    <blockquote className="mb-3 border-l-2 border-blue-500/40 pl-4 italic text-gray-400">
      {props.children}
    </blockquote>
  ),
  code: (props: { children?: ReactNode }) => (
    <code className="rounded bg-gray-900/70 px-1.5 py-0.5 font-mono text-[0.85em] text-blue-300">
      {props.children}
    </code>
  ),
  pre: (props: { children?: ReactNode }) => (
    <pre className="mb-3 overflow-x-auto rounded-xl border border-gray-700/50 bg-gray-900/70 p-4 font-mono text-xs text-gray-200">
      {props.children}
    </pre>
  ),
  table: (props: { children?: ReactNode }) => (
    <div className="mb-3 overflow-x-auto rounded-xl border border-gray-700/50">
      <table className="w-full text-sm">{props.children}</table>
    </div>
  ),
  th: (props: { children?: ReactNode }) => (
    <th className="border-b border-gray-700/60 bg-gray-800/60 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
      {props.children}
    </th>
  ),
  td: (props: { children?: ReactNode }) => (
    <td className="border-b border-gray-800/60 px-3 py-2 text-gray-300">{props.children}</td>
  ),
  hr: () => <hr className="my-5 border-gray-700/50" />,
} as const;

// ============================================================
// Componente
// ============================================================

/** Resolve o markdown efetivo a partir de config/dados, na ordem de precedência. */
function resolveMarkdown(config: DocViewerConfig, data: unknown): string {
  if (config.markdown && config.markdown.trim() !== '') return config.markdown;
  if (config.body && config.body.length > 0) return config.body.join('\n\n');

  const field = config.field ?? 'conteudo';
  const first = asRows(data)[0];
  if (first) {
    const fromData = toText(first[field]);
    if (fromData.trim() !== '') return fromData;
  }
  return '';
}

export default function DocViewerBlock({ title, subtitle, config, ctx }: BlockProps<DocViewerConfig>) {
  const { data, loading, error } = ctx;

  const markdown = useMemo(() => resolveMarkdown(config, data), [config, data]);

  if (loading) {
    return (
      <div>
        <SectionHeader title={title ?? 'Documento'} subtitle={subtitle} icon="📄" />
        <SkeletonCards count={2} columns={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'Documento'} subtitle={subtitle} icon="📄" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title={title ?? 'Documento'} subtitle={subtitle} icon="📄" />
      <article className="max-w-3xl rounded-2xl border border-gray-700/50 bg-gray-800/60 p-6 backdrop-blur-sm">
        {config.heading && (
          <h1 className="mb-4 text-2xl font-bold tracking-tight text-gray-100">{config.heading}</h1>
        )}
        {markdown.trim() === '' ? (
          <EmptyState
            message="Sem conteúdo neste documento."
            hint="Defina config.markdown/config.body ou traga o texto pela fonte de dados."
          />
        ) : (
          <div className="text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {markdown}
            </ReactMarkdown>
          </div>
        )}
      </article>
    </div>
  );
}
