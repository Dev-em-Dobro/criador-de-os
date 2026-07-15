/**
 * @os/blocks — catálogo de blocos genéricos reutilizáveis por qualquer cliente.
 *
 * Cada bloco é uma `BlockDefinition` do contrato do `@os/core`: recebe `config`
 * (do `binding.config` do manifesto) + `ctx.data` (resolvido pelo core a partir
 * do `binding.dataSource`) e renderiza usando SÓ o design system do core.
 * Nenhum bloco conhece cliente, coleção ou texto de negócio.
 *
 * O APP importa as definições daqui e as registra no seu registry (inversão de
 * controle), ou usa `registerDefaultBlocks(registry)` para registrar tudo.
 */

import type { BlockRegistry, AnyBlockDefinition } from '@os/core';

import { kpiDashboard } from './kpi-dashboard';
import { dataTable } from './data-table';
import { kanbanBoard } from './kanban-board';
import { docViewer } from './doc-viewer';
import { metricComparison } from './metric-comparison';
import { settingsPanel } from './settings-panel';
import { leadConsole } from './lead-console';
import { invoiceConsole } from './invoice-console';
import { hotmartConsole } from './hotmart-console';
import { agentGallery } from './agent-gallery';

// ============================================================
// Blocos (definições registráveis)
// ============================================================

export { kpiDashboard } from './kpi-dashboard';
export { dataTable } from './data-table';
export { kanbanBoard } from './kanban-board';
export { docViewer } from './doc-viewer';
export { metricComparison } from './metric-comparison';

// Blocos "console" (gerenciam estado próprio + falam com o backend @os/server).
export { settingsPanel } from './settings-panel';
export { leadConsole } from './lead-console';
export { invoiceConsole } from './invoice-console';
export { hotmartConsole } from './hotmart-console';
export { agentGallery } from './agent-gallery';

// ============================================================
// Tipos de config (por bloco) + schemas zod
// ============================================================

export { kpiDashboardConfigSchema } from './kpi-dashboard';
export type { KpiDashboardConfig } from './kpi-dashboard';

export { dataTableConfigSchema } from './data-table';
export type { DataTableConfig } from './data-table';

export { kanbanBoardConfigSchema } from './kanban-board';
export type { KanbanBoardConfig } from './kanban-board';

export { docViewerConfigSchema } from './doc-viewer';
export type { DocViewerConfig } from './doc-viewer';

export { metricComparisonConfigSchema } from './metric-comparison';
export type { MetricComparisonConfig } from './metric-comparison';

// ============================================================
// Helper: registra todo o catálogo de uma vez
// ============================================================

/** Todas as definições do catálogo, na ordem do `BlockType` do core. */
export const defaultBlocks: readonly AnyBlockDefinition[] = [
  kpiDashboard,
  dataTable,
  kanbanBoard,
  docViewer,
  metricComparison,
  settingsPanel,
  leadConsole,
  invoiceConsole,
  hotmartConsole,
  agentGallery,
];

/**
 * Registra todos os blocos do catálogo em um registry.
 *
 * Uso (no app):
 *   const registry = createRegistry();
 *   registerDefaultBlocks(registry);
 *   // (opcional) registry.register(meuBlocoCustom);
 *
 * O app ainda pode sobrescrever qualquer bloco por uma variante custom
 * registrando depois (o registry é idempotente por `type`: o último vence).
 */
export function registerDefaultBlocks(registry: BlockRegistry): void {
  for (const block of defaultBlocks) {
    registry.register(block);
  }
}

/** Versão do catálogo de blocos (para diagnóstico/migração futura). */
export const BLOCKS_VERSION = '0.1.0';
