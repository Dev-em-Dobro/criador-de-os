/**
 * @os/blocks — `metric-comparison` (componente).
 *
 * Carregado via `lazy` pela definição em `./index` (default export). Complementa
 * o `kpi-dashboard` (grade de cards): aqui o foco é a LEITURA lado-a-lado de
 * atual vs. anterior, útil para "o que mudou no período".
 *
 * Contrato: recebe `config` (pares de métricas) + `ctx.data` (linhas). Usa a
 * linha [0]: `<key>` = atual, `<key>_prev` = anterior. NÃO conhece cliente.
 */

import { SectionHeader, EmptyState, SkeletonCards, formatValue } from '@os/core';
import type { BlockProps } from '@os/core';
import { asRows, toNumber } from '../internal/rows';
import type { MetricComparisonConfig } from './index';

/** Variação percentual entre atual e anterior. `null` quando não computável. */
function changePercent(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export default function MetricComparisonBlock({
  title,
  subtitle,
  config,
  ctx,
}: BlockProps<MetricComparisonConfig>) {
  const { data, loading, error } = ctx;

  if (loading) {
    return (
      <div>
        <SectionHeader title={title ?? 'Comparativo'} subtitle={subtitle} icon="🔀" />
        <SkeletonCards count={config.metrics.length} columns={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'Comparativo'} subtitle={subtitle} icon="🔀" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  const rows = asRows(data);
  const latest = rows[0] ?? {};

  return (
    <div>
      <SectionHeader title={title ?? 'Comparativo'} subtitle={subtitle} icon="🔀" />

      {rows.length === 0 ? (
        <EmptyState message="Sem dados para comparar no período." />
      ) : (
        <div className="max-w-3xl overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 border-b border-gray-700/60 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
            <span>Métrica</span>
            <span className="text-right">Atual</span>
            <span className="text-right">Anterior</span>
            <span className="text-right">Variação</span>
          </div>

          {config.metrics.map((m) => {
            const current = toNumber(latest[m.key]) ?? 0;
            const previous = toNumber(latest[`${m.key}_prev`]);
            const change = changePercent(current, previous);

            // "Bom" depende da direção desejada da métrica (lowerIsBetter).
            const isGood =
              change === null ? true : m.lowerIsBetter ? change <= 0 : change >= 0;
            const changeColor =
              change === null ? 'text-gray-500' : isGood ? 'text-emerald-400' : 'text-red-400';
            const arrow = change === null ? '' : change >= 0 ? '▲' : '▼';

            return (
              <div
                key={m.key}
                className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-4 border-b border-gray-800/60 px-4 py-3 text-sm last:border-0"
              >
                <span className="text-gray-300">{m.label}</span>
                <span className="text-right font-mono tnum font-semibold text-gray-100">
                  {formatValue(current, m.unit)}
                </span>
                <span className="text-right font-mono tnum text-gray-500">
                  {previous === undefined ? '—' : formatValue(previous, m.unit)}
                </span>
                <span
                  className={`inline-flex items-center justify-end gap-0.5 text-right font-semibold ${changeColor}`}
                >
                  {change === null ? (
                    '—'
                  ) : (
                    <>
                      <span aria-hidden="true">{arrow}</span>
                      {Math.abs(change).toFixed(1)}%
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
