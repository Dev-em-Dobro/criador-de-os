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
                    return (
                      <article
                        key={toText(card.id) || i}
                        className="rounded-xl border border-gray-700/50 bg-gray-800/70 p-3 text-sm text-gray-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-colors hover:border-blue-500/25"
                      >
                        <p className="font-medium leading-snug">
                          {toText(card[titleField]) || 'Sem título'}
                        </p>
                        {group && (
                          <span className="mt-2 inline-flex items-center rounded-full border border-gray-600/50 bg-gray-700/40 px-2 py-0.5 text-[11px] text-gray-400">
                            {group}
                          </span>
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
