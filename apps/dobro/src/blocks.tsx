/**
 * apps/dobro — Blocos de EXEMPLO (PROVISÓRIOS).
 *
 * ⚠️ TEMPORÁRIO: estes blocos existem só para provar o motor de manifesto
 * end-to-end (manifesto → shell → rota → bloco → dado) na fatia 1B, com dados
 * `kind: 'static'`. O catálogo REAL e reutilizável virá na Fase 2 em `@os/blocks`
 * (`kpi-dashboard`, `data-table`, `kanban-board`, ...). Quando chegar, estes
 * exemplos são removidos e o app passa a importar de `@os/blocks`.
 *
 * Cada bloco segue o contrato do core: recebe `config` (do manifesto) + `ctx`
 * (dados resolvidos pelo DataAdapter) e renderiza com o design system do core.
 * Nenhum bloco conhece "Dobro" — o texto de negócio vem do manifesto/config.
 */

import { SectionHeader, KpiCard, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';

// ============================================================
// Bloco de exemplo 1: kpi-dashboard
// ============================================================

/** Config que o bloco `kpi-dashboard` espera (vem de `binding.config`). */
interface KpiDashboardConfig {
  kpis: Array<{
    key: string; // chave do campo na linha de dados
    label: string;
    unit: string; // 'R$' | '%' | 'x' | 'count' | custom
    target: number;
    tooltip?: string;
  }>;
  columns?: number; // grid (default 4)
}

function KpiDashboardBlock({ title, subtitle, config, ctx }: BlockProps<KpiDashboardConfig>) {
  const { data, loading, error } = ctx;

  if (loading) {
    return (
      <div>
        <SectionHeader title={title ?? 'KPIs'} subtitle={subtitle} />
        <SkeletonCards count={config.kpis.length} columns={config.columns ?? 4} />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'KPIs'} subtitle={subtitle} />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  // `data` são as linhas resolvidas pelo adapter. Usamos a linha mais recente
  // (índice 0) como a "atual"; o KPI busca seu valor por `key`.
  const rows = (data as Record<string, number>[]) ?? [];
  const latest = rows[0] ?? {};
  const cols = config.columns ?? 4;
  const gridColsClass =
    cols === 3
      ? 'lg:grid-cols-3'
      : cols === 5
        ? 'lg:grid-cols-5'
        : cols === 2
          ? 'lg:grid-cols-2'
          : 'lg:grid-cols-4';

  return (
    <div>
      <SectionHeader title={title ?? 'KPIs'} subtitle={subtitle} icon="📊" />
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-4`}>
        {config.kpis.map((k) => (
          <KpiCard
            key={k.key}
            data={{
              id: k.key,
              label: k.label,
              value: latest[k.key] ?? 0,
              target: k.target,
              unit: k.unit,
              previousValue: latest[`${k.key}_prev`],
              tooltip: k.tooltip,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export const kpiDashboardBlock: BlockDefinition<KpiDashboardConfig> = {
  type: 'kpi-dashboard',
  component: KpiDashboardBlock,
  defaultDataShape: 'collection',
};

// ============================================================
// Bloco de exemplo 2: doc-viewer (texto/markdown simples)
// ============================================================

/** Config do `doc-viewer`: cabeçalho + parágrafos de corpo (texto plano). */
interface DocViewerConfig {
  heading?: string;
  body?: string[]; // parágrafos
}

function DocViewerBlock({ title, subtitle, config, ctx }: BlockProps<DocViewerConfig>) {
  const { error } = ctx;

  if (error) {
    return (
      <div>
        <SectionHeader title={title ?? 'Documento'} subtitle={subtitle} />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  const paragraphs = config.body ?? [];

  return (
    <div>
      <SectionHeader title={title ?? 'Documento'} subtitle={subtitle} icon="📄" />
      <article className="rounded-2xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm p-6 max-w-3xl">
        {config.heading && (
          <h3 className="text-lg font-bold text-gray-100 mb-3">{config.heading}</h3>
        )}
        {paragraphs.length > 0 ? (
          <div className="space-y-3 text-sm leading-relaxed text-gray-300">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : (
          <EmptyState message="Sem conteúdo neste documento." hint="Edite o manifesto para adicionar texto." />
        )}
      </article>
    </div>
  );
}

export const docViewerBlock: BlockDefinition<DocViewerConfig> = {
  type: 'doc-viewer',
  component: DocViewerBlock,
  defaultDataShape: 'raw',
};
