/**
 * @os/blocks — `data-table` (definição + config).
 *
 * Tabela genérica com colunas configuráveis, ordenação clicável no header e
 * formatação por coluna. Arquétipo repetido no Dobro OS em listas como
 * `ScudoStudentsSection`, `LeadJourneyTable` e `IcpAlunosView` (todas: uma
 * `<table>` com colunas fixas, um badge de status e um sort próprio).
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

const columnFormatSchema = z.enum([
  'text',
  'number',
  'currency',
  'percent',
  'date',
  'badge',
]);

const alignSchema = z.enum(['left', 'center', 'right']);

const columnSchema = z
  .object({
    /** Chave do campo na linha de dados. */
    key: z.string().min(1),
    /** Cabeçalho da coluna. */
    label: z.string().min(1),
    /** Como formatar a célula. Default 'text'. */
    format: columnFormatSchema.optional(),
    /** Alinhamento horizontal. Default: 'right' para números, 'left' senão. */
    align: alignSchema.optional(),
  })
  .strict();

/** Schema do `binding.config` do `data-table`. */
export const dataTableConfigSchema = z
  .object({
    columns: z
      .array(columnSchema)
      .min(1, 'data-table exige ao menos 1 coluna em config.columns'),
    /** Ordenação inicial (default: sem ordenação, ordem dos dados). */
    defaultSort: z
      .object({ field: z.string().min(1), dir: z.enum(['asc', 'desc']) })
      .strict()
      .optional(),
    /** Linhas por página; ausente/0 = sem paginação (mostra tudo). */
    pageSize: z.number().int().positive().optional(),
  })
  .strict();

export type DataTableConfig = z.infer<typeof dataTableConfigSchema>;

// ============================================================
// Definição registrável (componente carregado sob demanda)
// ============================================================

/** Definição registrável do bloco `data-table`. */
export const dataTable: BlockDefinition<DataTableConfig> = {
  type: 'data-table',
  component: lazy(() => import('./component')),
  configSchema: dataTableConfigSchema,
  defaultDataShape: 'collection',
};
