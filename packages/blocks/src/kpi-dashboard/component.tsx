/**
 * @os/blocks — `kpi-dashboard` (componente).
 *
 * Carregado via `lazy` pela definição em `./index` (default export = requisito
 * do `React.lazy`). Toda a UI/lógica vive aqui para ficar num chunk separado.
 *
 * Contrato: recebe `config` (lista de KPIs) + `ctx.data` (linhas). Usa a linha
 * [0] como "atual"; campos `<key>_prev` alimentam a variação percentual. NÃO
 * conhece cliente, coleção nem texto de negócio — tudo vem de config/props.
 */

import { SectionHeader, KpiCard, EmptyState, SkeletonCards } from '@os/core';
import type { BlockProps } from '@os/core';
import { asRows, toNumber } from '../internal/rows';
import type { KpiDashboardConfig } from './index';

/** Mapeia a contagem de colunas para a classe de grid (Tailwind não aceita interpolação dinâmica). */
function gridColsClass(columns: number | undefined): string {
  switch (columns) {
    case 1:
      return 'lg:grid-cols-1';
    case 2:
      return 'lg:grid-cols-2';
    case 3:
      return 'lg:grid-cols-3';
    case 5:
      return 'lg:grid-cols-5';
    default:
      return 'lg:grid-cols-4';
  }
}

export default function KpiDashboardBlock({ title, subtitle, config, ctx }: BlockProps<KpiDashboardConfig>) {
  const { data, loading, error } = ctx;
  const cols = config.columns ?? 4;

  if (loading) {
    return (
      <div>
        <SectionHeader title={title ?? 'KPIs'} subtitle={subtitle} icon="📊" />
        <SkeletonCards count={config.kpis.length} columns={cols} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'KPIs'} subtitle={subtitle} icon="📊" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  // Linhas resolvidas pelo adapter. A linha mais recente (índice 0) é a "atual";
  // cada KPI busca seu valor por `key` e a variação por `<key>_prev`.
  const rows = asRows(data);
  const latest = rows[0] ?? {};

  return (
    <div>
      <SectionHeader title={title ?? 'KPIs'} subtitle={subtitle} icon="📊" />
      {rows.length === 0 ? (
        <EmptyState message="Sem dados de KPI para o período selecionado." />
      ) : (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass(cols)} gap-4`}>
          {config.kpis.map((k) => (
            <KpiCard
              key={k.key}
              data={{
                id: k.key,
                label: k.label,
                value: toNumber(latest[k.key]) ?? 0,
                target: k.target,
                unit: k.unit,
                previousValue: toNumber(latest[`${k.key}_prev`]),
                tooltip: k.tooltip,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
