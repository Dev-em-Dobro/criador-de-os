/**
 * @os/blocks — `data-table` (componente).
 *
 * Carregado via `lazy` pela definição em `./index` (default export). Toda a
 * lógica de formatação/ordenação/paginação vive aqui, num chunk separado.
 *
 * Contrato: recebe `config` (colunas + sort/paginação) + `ctx.data` (array de
 * linhas). NÃO conhece cliente, coleção nem nome de campo de negócio.
 */

import { useMemo, useState } from 'react';
import { SectionHeader, EmptyState, SkeletonCards, formatValue } from '@os/core';
import type { BlockProps } from '@os/core';
import { asRows, toNumber, toText } from '../internal/rows';
import type { Row } from '../internal/rows';
import type { DataTableConfig } from './index';

type ColumnSpec = DataTableConfig['columns'][number];
type ColumnFormat = NonNullable<ColumnSpec['format']>;
type SortState = { field: string; dir: 'asc' | 'desc' };

// ============================================================
// Formatação de célula (por coluna)
// ============================================================

/** Alinhamento efetivo: explícito, ou derivado do formato (números à direita). */
function alignOf(col: ColumnSpec): 'left' | 'center' | 'right' {
  if (col.align) return col.align;
  const numeric: ColumnFormat[] = ['number', 'currency', 'percent'];
  return numeric.includes(col.format ?? 'text') ? 'right' : 'left';
}

const alignClass: Record<'left' | 'center' | 'right', string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Estilo do badge derivado de forma estável do texto (mesmo texto → mesma cor).
 * Paleta neutra do design system; NÃO é semântica de negócio (não sabe o que é
 * "ativo"/"churn"), só garante consistência visual por valor.
 */
const badgePalette = [
  'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
  'bg-blue-500/12 text-blue-300 border-blue-500/25',
  'bg-yellow-500/12 text-yellow-300 border-yellow-500/25',
  'bg-red-500/12 text-red-300 border-red-500/25',
  'bg-gray-500/15 text-gray-300 border-gray-500/30',
];

function badgeClass(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return badgePalette[Math.abs(hash) % badgePalette.length];
}

/** Formata uma data (Date, ISO string ou epoch) em pt-BR; senão devolve o texto cru. */
function formatDate(value: unknown): string {
  if (value == null || value === '') return '—';
  const d = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(d.getTime())) return toText(value);
  return d.toLocaleDateString('pt-BR');
}

/** Renderiza o conteúdo de uma célula conforme o formato da coluna. */
function renderCell(col: ColumnSpec, raw: unknown) {
  const format = col.format ?? 'text';

  switch (format) {
    case 'currency':
      return formatValue(toNumber(raw) ?? 0, 'R$');
    case 'percent':
      return formatValue(toNumber(raw) ?? 0, '%');
    case 'number': {
      const n = toNumber(raw);
      return n === undefined ? '—' : formatValue(n, 'count');
    }
    case 'date':
      return formatDate(raw);
    case 'badge': {
      const text = toText(raw);
      if (!text) return <span className="text-gray-500">—</span>;
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass(text)}`}
        >
          {text}
        </span>
      );
    }
    case 'text':
    default: {
      const text = toText(raw);
      return text === '' ? <span className="text-gray-500">—</span> : text;
    }
  }
}

// ============================================================
// Ordenação
// ============================================================

/** Compara duas linhas por um campo (numérico quando possível, senão localeCompare). */
function compareRows(a: Row, b: Row, field: string, dir: 'asc' | 'desc'): number {
  const av = a[field];
  const bv = b[field];
  const an = toNumber(av);
  const bn = toNumber(bv);

  let cmp: number;
  if (an !== undefined && bn !== undefined) {
    cmp = an - bn;
  } else {
    cmp = toText(av).localeCompare(toText(bv), 'pt-BR', { numeric: true });
  }
  return dir === 'asc' ? cmp : -cmp;
}

// ============================================================
// Componente
// ============================================================

export default function DataTableBlock({ title, subtitle, config, ctx }: BlockProps<DataTableConfig>) {
  const { data, loading, error } = ctx;

  const [sort, setSort] = useState<SortState | null>(config.defaultSort ?? null);
  const [page, setPage] = useState(0);

  const rows = useMemo(() => asRows(data), [data]);

  const sortedRows = useMemo(() => {
    if (!sort) return rows;
    return [...rows].sort((a, b) => compareRows(a, b, sort.field, sort.dir));
  }, [rows, sort]);

  const pageSize = config.pageSize ?? 0;
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1;
  const clampedPage = Math.min(page, pageCount - 1);
  const visibleRows =
    pageSize > 0
      ? sortedRows.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize)
      : sortedRows;

  if (loading) {
    return (
      <div>
        <SectionHeader title={title ?? 'Tabela'} subtitle={subtitle} icon="📋" />
        <SkeletonCards count={4} columns={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'Tabela'} subtitle={subtitle} icon="📋" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  /** Alterna a ordenação ao clicar num header: asc → desc → asc. */
  function toggleSort(field: string) {
    setSort((prev) => {
      if (prev?.field !== field) return { field, dir: 'asc' };
      return { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
    });
    setPage(0);
  }

  return (
    <div>
      <SectionHeader title={title ?? 'Tabela'} subtitle={subtitle} icon="📋" />

      {rows.length === 0 ? (
        <EmptyState message="Nenhum registro encontrado." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/60 text-left">
                  {config.columns.map((col) => {
                    const isSorted = sort?.field === col.key;
                    const arrow = isSorted ? (sort.dir === 'asc' ? '▲' : '▼') : '';
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={
                          isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'
                        }
                        className={`px-4 py-3 ${alignClass[alignOf(col)]}`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          {col.label}
                          <span aria-hidden="true" className="text-[10px] text-blue-400">
                            {arrow}
                          </span>
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row, i) => (
                  <tr
                    key={toText(row.id) || i}
                    className="border-b border-gray-800/60 last:border-0 hover:bg-gray-700/20 transition-colors"
                  >
                    {config.columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-gray-200 ${alignClass[alignOf(col)]}`}
                      >
                        {renderCell(col, row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pageSize > 0 && pageCount > 1 && (
            <div className="flex items-center justify-between border-t border-gray-700/60 px-4 py-2.5 text-xs text-gray-400">
              <span>
                Página {clampedPage + 1} de {pageCount} · {sortedRows.length} registro(s)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={clampedPage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="rounded-lg border border-gray-700 px-2.5 py-1 hover:border-blue-500/40 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={clampedPage >= pageCount - 1}
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  className="rounded-lg border border-gray-700 px-2.5 py-1 hover:border-blue-500/40 hover:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
