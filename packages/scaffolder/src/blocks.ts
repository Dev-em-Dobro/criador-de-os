/**
 * @os/scaffolder — catálogo interno de blocos: config + dados de exemplo + (para
 * kpi) a especificação da view read-only.
 *
 * Cada menu escolhido pelo operador vira um `BlockBinding` do manifesto. Os
 * defaults aqui são GENÉRICOS (nada de cliente): o operador ajusta os detalhes
 * finos depois — exatamente o fluxo do doc 06, §3.
 *
 * Regra de dados por preset:
 *  - `static`: todo bloco recebe `dataSource: { kind:'static', data:[...] }`
 *    (exceto doc-viewer, que é config puro).
 *  - `full`: `kpi-dashboard` vira `kind:'query'` (view v_<key> na allowlist);
 *    os demais seguem `static` até o dev promovê-los criando uma view.
 */

import type { BlockKind, MenuAnswer, Preset } from './types';

export const DEFAULT_ICON: Record<BlockKind, string> = {
  'kpi-dashboard': 'LayoutDashboard',
  'data-table': 'ClipboardList',
  'kanban-board': 'Kanban',
  'metric-comparison': 'BarChart3',
  'doc-viewer': 'FileText',
};

/** Coluna de negócio a materializar no schema Drizzle (preset full, view kpi). */
export interface BusinessColumn {
  name: string;
  kind: 'double' | 'int' | 'text';
}

/** Especificação da view read-only de um menu kpi (preset full). */
export interface ViewSpec {
  /** Nome da view exposta, ex.: `v_vendas`. */
  view: string;
  /** Tabela base (nunca exposta à API), ex.: `dados_vendas`. */
  table: string;
  /** Colunas de negócio da tabela base (+ a coluna `period`). */
  businessColumns: BusinessColumn[];
  /** Colunas expostas pela view e registradas na allowlist (inclui `period`). */
  exposed: string[];
}

/** Resultado da construção de um menu: o binding + (opcional) a view a materializar. */
export interface MenuBuild {
  binding: Record<string, unknown>;
  viewSpec?: ViewSpec;
}

// ------------------------------------------------------------
// Defaults de KPI (usados por kpi-dashboard e metric-comparison)
// ------------------------------------------------------------

const KPI_SPECS = [
  { key: 'receita', label: 'Receita', unit: 'R$', target: 100000, sample: 82000, prev: 75000 },
  { key: 'clientes', label: 'Clientes', unit: 'count', target: 500, sample: 430, prev: 400 },
  { key: 'conversao', label: 'Conversão', unit: '%', target: 5, sample: 4.2, prev: 3.9 },
  { key: 'ticket', label: 'Ticket médio', unit: 'R$', target: 200, sample: 190, prev: 180 },
] as const;

function kpiSampleRow(): Record<string, number> {
  const row: Record<string, number> = {};
  for (const k of KPI_SPECS) {
    row[k.key] = k.sample;
    row[`${k.key}_prev`] = k.prev;
  }
  return row;
}

// ------------------------------------------------------------
// Construção do binding por bloco
// ------------------------------------------------------------

/**
 * Constrói o `BlockBinding` (e a `ViewSpec` quando aplicável) de um menu.
 *
 * @param withPeriodFilter  se true (preset full + período habilitado), o menu
 *                          kpi query recebe um `where` por período (bind param).
 */
export function buildMenu(
  menu: MenuAnswer,
  preset: Preset,
  withPeriodFilter: boolean,
): MenuBuild {
  const title = menu.title ?? menu.label;

  switch (menu.block) {
    case 'kpi-dashboard': {
      const config = {
        columns: 4,
        kpis: KPI_SPECS.map((k) => ({ key: k.key, label: k.label, unit: k.unit, target: k.target })),
      };

      if (preset === 'full') {
        // Caminho canônico: dado real via /api/query (view read-only na allowlist).
        const view = `v_${menu.key.replace(/-/g, '_')}`;
        const table = `dados_${menu.key.replace(/-/g, '_')}`;
        const cols = KPI_SPECS.flatMap((k) => [k.key, `${k.key}_prev`]);
        const businessColumns: BusinessColumn[] = [
          ...KPI_SPECS.flatMap((k): BusinessColumn[] => [
            { name: k.key, kind: 'double' },
            { name: `${k.key}_prev`, kind: 'double' },
          ]),
          { name: 'period', kind: 'text' },
        ];
        const dataSource: Record<string, unknown> = {
          kind: 'query',
          view,
          select: cols,
          limit: 1,
        };
        if (withPeriodFilter) {
          dataSource.where = [{ field: 'period', op: '=', value: { ref: 'period' } }];
        }
        return {
          binding: { block: menu.block, title, subtitle: menu.subtitle ?? 'Dado real (Neon via /api/query)', config, dataSource },
          viewSpec: { view, table, businessColumns, exposed: [...cols, 'period'] },
        };
      }

      return {
        binding: {
          block: menu.block,
          title,
          subtitle: menu.subtitle ?? 'Dados de exemplo (edite o manifesto)',
          config,
          dataSource: { kind: 'static', data: [kpiSampleRow()] },
        },
      };
    }

    case 'metric-comparison': {
      const config = {
        metrics: [
          { key: 'receita', label: 'Receita', unit: 'R$' },
          { key: 'custo', label: 'Custo', unit: 'R$', lowerIsBetter: true },
          { key: 'margem', label: 'Margem', unit: '%' },
        ],
      };
      const data = [
        { receita: 82000, receita_prev: 75000, custo: 41000, custo_prev: 39000, margem: 50, margem_prev: 48 },
      ];
      return {
        binding: { block: menu.block, title, subtitle: menu.subtitle, config, dataSource: { kind: 'static', data } },
      };
    }

    case 'data-table': {
      const config = {
        columns: [
          { key: 'nome', label: 'Nome', format: 'text', align: 'left' },
          { key: 'categoria', label: 'Categoria', format: 'text' },
          { key: 'valor', label: 'Valor', format: 'currency' },
          { key: 'status', label: 'Status', format: 'badge' },
          { key: 'data', label: 'Data', format: 'date' },
        ],
        defaultSort: { field: 'valor', dir: 'desc' },
      };
      const data = [
        { id: 1, nome: 'Item de exemplo A', categoria: 'Categoria 1', valor: 4200, status: 'Ativo', data: '2026-07-05' },
        { id: 2, nome: 'Item de exemplo B', categoria: 'Categoria 2', valor: 3100, status: 'Pendente', data: '2026-07-08' },
        { id: 3, nome: 'Item de exemplo C', categoria: 'Categoria 1', valor: 1800, status: 'Ativo', data: '2026-07-11' },
      ];
      return {
        binding: { block: menu.block, title, subtitle: menu.subtitle, config, dataSource: { kind: 'static', data } },
      };
    }

    case 'kanban-board': {
      const config = {
        columns: [
          { id: 'todo', label: 'A fazer' },
          { id: 'doing', label: 'Em andamento' },
          { id: 'done', label: 'Concluído' },
        ],
        statusField: 'status',
        titleField: 'titulo',
        groupBy: 'responsavel',
      };
      const data = [
        { id: 1, titulo: 'Tarefa de exemplo A', status: 'todo', responsavel: 'Equipe' },
        { id: 2, titulo: 'Tarefa de exemplo B', status: 'doing', responsavel: 'Equipe' },
        { id: 3, titulo: 'Tarefa de exemplo C', status: 'done', responsavel: 'Equipe' },
      ];
      return {
        binding: { block: menu.block, title, subtitle: menu.subtitle, config, dataSource: { kind: 'static', data } },
      };
    }

    case 'doc-viewer': {
      const config = {
        heading: title,
        body: [
          'Esta tela é renderizada por configuração (bloco `doc-viewer`), sem código React.',
          'Edite o texto em `src/manifest.ts` — cada item do array vira um parágrafo de markdown.',
          'Para carregar o documento de uma fonte de dados, troque `config.body` por um `dataSource` e use `config.field`.',
        ],
      };
      // doc-viewer é config puro: sem dataSource.
      return { binding: { block: menu.block, title, subtitle: menu.subtitle, config } };
    }
  }
}
