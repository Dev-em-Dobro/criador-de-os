/**
 * @os/blocks — `kpi-dashboard` (definição + config).
 *
 * Grade de KPIs com meta, tendência e comparativo. É o arquétipo mais repetido
 * do Dobro OS (`YouTubeSection`, `AquisicaoSection`, `NewsletterSection`,
 * `PaidTrafficSection`, `InstagramSection`, `PipelineSection`, `LaunchesSection`
 * — todas a MESMA forma: grade de KpiCard + comparativo, só o dado muda).
 *
 * O COMPONENTE vive em `./component` e é carregado sob demanda (`lazy`): assim o
 * código do bloco só entra no bundle quando uma rota o usa (code-split por
 * bloco). Aqui ficam apenas o schema/tipo de config (leves) e a definição.
 */

import { lazy } from 'react';
import { z } from 'zod';
import type { BlockDefinition } from '@os/core';

// ============================================================
// Config
// ============================================================

/** Unidades de formatação suportadas pelo design system (`formatValue`). */
const kpiUnitSchema = z.enum(['R$', '%', 'x', 'count']);

const kpiSpecSchema = z
  .object({
    /** Chave do campo na linha de dados (ex.: 'faturamento'). */
    key: z.string().min(1),
    /** Rótulo exibido no card. */
    label: z.string().min(1),
    /** Unidade para formatação. */
    unit: kpiUnitSchema,
    /** Meta/target de referência (deriva a cor verde/amarelo/vermelho). */
    target: z.number(),
    /** Texto do tooltip (i) ao lado do rótulo. */
    tooltip: z.string().optional(),
  })
  .strict();

/** Schema do `binding.config` do `kpi-dashboard` (validado no load do bloco). */
export const kpiDashboardConfigSchema = z
  .object({
    kpis: z.array(kpiSpecSchema).min(1, 'kpi-dashboard exige ao menos 1 KPI em config.kpis'),
    /** Colunas do grid (1..5); default 4. */
    columns: z.number().int().min(1).max(5).optional(),
  })
  .strict();

export type KpiDashboardConfig = z.infer<typeof kpiDashboardConfigSchema>;

// ============================================================
// Definição registrável (componente carregado sob demanda)
// ============================================================

/** Definição registrável do bloco `kpi-dashboard`. */
export const kpiDashboard: BlockDefinition<KpiDashboardConfig> = {
  type: 'kpi-dashboard',
  component: lazy(() => import('./component')),
  configSchema: kpiDashboardConfigSchema,
  defaultDataShape: 'collection',
};
