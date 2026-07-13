/**
 * @os/blocks — `metric-comparison` (definição + config).
 *
 * Comparativo "atual vs. anterior" em formato de linhas (não cards). Extraído do
 * padrão `ComparisonRow`/`ChangeIndicator` do `YouTubeSection` do Dobro OS: cada
 * métrica exibe valor atual, valor anterior e a variação com seta/cor semântica.
 *
 * O COMPONENTE vive em `./component` e é carregado sob demanda (`lazy`). Aqui
 * ficam só o schema/tipo de config (leves) e a definição registrável.
 */

import { lazy } from 'react';
import { z } from 'zod';
import type { BlockDefinition } from '@os/core';

// ============================================================
// Config
// ============================================================

const unitSchema = z.enum(['R$', '%', 'x', 'count']);

const metricSpecSchema = z
  .object({
    /** Chave do campo atual; o anterior é lido de `<key>_prev`. */
    key: z.string().min(1),
    /** Rótulo da métrica. */
    label: z.string().min(1),
    /** Unidade para formatação. */
    unit: unitSchema,
    /**
     * Se `true`, uma QUEDA é o resultado desejado (ex.: custo, churn): a variação
     * negativa é pintada de verde. Default: subir é bom.
     */
    lowerIsBetter: z.boolean().optional(),
  })
  .strict();

/** Schema do `binding.config` do `metric-comparison`. */
export const metricComparisonConfigSchema = z
  .object({
    metrics: z
      .array(metricSpecSchema)
      .min(1, 'metric-comparison exige ao menos 1 métrica em config.metrics'),
  })
  .strict();

export type MetricComparisonConfig = z.infer<typeof metricComparisonConfigSchema>;

// ============================================================
// Definição registrável (componente carregado sob demanda)
// ============================================================

/** Definição registrável do bloco `metric-comparison`. */
export const metricComparison: BlockDefinition<MetricComparisonConfig> = {
  type: 'metric-comparison',
  component: lazy(() => import('./component')),
  configSchema: metricComparisonConfigSchema,
  defaultDataShape: 'collection',
};
