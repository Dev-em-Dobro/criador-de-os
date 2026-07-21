/**
 * @os/blocks — `kanban-board` (componente).
 *
 * Carregado via `lazy` pela definição em `./index` (default export). Distribui
 * as linhas em colunas conforme o `statusField`. READ-ONLY nesta fase.
 *
 * Contrato: recebe `config` (colunas + campos) + `ctx.data` (array de cards).
 * NÃO conhece cliente, coleção nem texto de negócio.
 */

import { useMemo } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockProps } from '@os/core';
import { asRows, toText } from '../internal/rows';
import type { Row } from '../internal/rows';
import type { KanbanBoardConfig } from './index';

/** Formata um valor de data (ISO/qualquer) em data curta pt-BR; devolve o texto cru se não parsear. */
function formatCardDate(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

/** True se o valor parece uma URL renderizável (http(s) ou caminho absoluto). */
function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith('/');
}

/** Uma coluna do board (linhas de dados agrupadas pela config). */
interface BoardColumnData {
  id: string;
  label: string;
  cards: Row[];
}

export default function KanbanBoardBlock({ title, subtitle, config, ctx }: BlockProps<KanbanBoardConfig>) {
  const { data, loading, error } = ctx;
  const titleField = config.titleField ?? 'titulo';

  // Distribui as linhas nas colunas conforme o `statusField`. Cards com status
  // fora das colunas declaradas são ignorados (mantém o board previsível).
  const columns = useMemo<BoardColumnData[]>(() => {
    const rows = asRows(data);
    const buckets = new Map<string, Row[]>(config.columns.map((c) => [c.id, []]));
    for (const row of rows) {
      const status = toText(row[config.statusField]);
      const bucket = buckets.get(status);
      if (bucket) bucket.push(row);
    }
    return config.columns.map((c) => ({
      id: c.id,
      label: c.label,
      cards: buckets.get(c.id) ?? [],
    }));
  }, [data, config.columns, config.statusField]);

  if (loading) {
    return (
      <div>
        <SectionHeader title={title ?? 'Board'} subtitle={subtitle} icon="🗂️" />
        <SkeletonCards count={config.columns.length} columns={config.columns.length <= 4 ? 4 : 5} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'Board'} subtitle={subtitle} icon="🗂️" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  const totalCards = columns.reduce((sum, c) => sum + c.cards.length, 0);

  return (
    <div>
      <SectionHeader title={title ?? 'Board'} subtitle={subtitle} icon="🗂️" />

      {totalCards === 0 ? (
        <EmptyState message="Nenhum item no board." />
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {columns.map((col) => (
            <div
              key={col.id}
              className="flex w-72 shrink-0 flex-col rounded-2xl border border-gray-700/50 bg-gray-800/40 backdrop-blur-sm"
            >
              {/* Cabeçalho da coluna com contagem */}
              <div className="flex items-center justify-between border-b border-gray-700/50 px-4 py-3">
                <span className="text-sm font-semibold text-gray-200">{col.label}</span>
                <span className="rounded-full bg-gray-700/60 px-2 py-0.5 text-xs font-medium text-gray-400">
                  {col.cards.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-3">
                {col.cards.length === 0 ? (
                  <p className="px-1 py-4 text-center text-xs text-gray-600">Vazio</p>
                ) : (
                  col.cards.map((card, i) => {
                    const group = config.groupBy ? toText(card[config.groupBy]) : '';
                    const cover = config.imageField ? toText(card[config.imageField]) : '';
                    const badge = config.badgeField ? toText(card[config.badgeField]) : '';
                    const date = config.dateField
                      ? formatCardDate(toText(card[config.dateField]))
                      : '';
                    const link = config.linkField ? toText(card[config.linkField]) : '';
                    const metas = (config.metaFields ?? [])
                      .map((m) => ({ label: m.label, value: toText(card[m.field]) }))
                      .filter((m) => m.value);
                    return (
                      <article
                        key={toText(card.id) || i}
                        className="overflow-hidden rounded-xl border border-gray-700/50 bg-gray-800/70 p-3 text-sm text-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-blue-500/25"
                      >
                        {looksLikeUrl(cover) && (
                          <img
                            src={cover}
                            alt=""
                            loading="lazy"
                            className="-mx-3 -mt-3 mb-2.5 h-28 w-[calc(100%+1.5rem)] object-cover"
                          />
                        )}
                        {(badge || date) && (
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            {badge ? (
                              <span className="inline-flex items-center rounded-full border border-blue-500/25 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium capitalize text-blue-200">
                                {badge}
                              </span>
                            ) : (
                              <span />
                            )}
                            {date && <span className="text-[11px] text-gray-400">{date}</span>}
                          </div>
                        )}
                        <p className="font-medium leading-snug">
                          {toText(card[titleField]) || 'Sem título'}
                        </p>
                        {metas.map((m) => (
                          <p
                            key={m.label ?? m.value}
                            className="mt-1.5 text-xs leading-snug text-gray-400"
                          >
                            {m.label && <span className="text-gray-500">{m.label}: </span>}
                            {m.value}
                          </p>
                        ))}
                        {group && (
                          <span className="mt-2 inline-flex items-center rounded-full border border-gray-600/50 bg-gray-700/40 px-2 py-0.5 text-[11px] text-gray-400">
                            {group}
                          </span>
                        )}
                        {looksLikeUrl(link) && (
                          <a
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2.5 inline-flex items-center gap-1 rounded-lg border border-gray-600/50 bg-gray-700/30 px-2.5 py-1 text-[11px] font-medium text-gray-200 transition-colors hover:border-blue-500/30 hover:text-white"
                          >
                            🎁 {config.linkLabel ?? 'Abrir'}
                          </a>
                        )}
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
