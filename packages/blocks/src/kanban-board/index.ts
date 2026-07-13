/**
 * @os/blocks — `kanban-board` (definição + config).
 *
 * Board por colunas: distribui cards (linhas de dados) em colunas conforme o
 * valor de um campo de status. Doador: `BoardSection` do Dobro OS ("Board dos
 * agentes"), do qual o layout de colunas e o card são 100% genéricos — só os
 * textos e a coleção `'tasks'` eram do cliente (agora vêm de config/dados).
 *
 * O COMPONENTE vive em `./component` e é carregado sob demanda (`lazy`). Aqui
 * ficam só o schema/tipo de config (leves) e a definição registrável.
 *
 * PENDÊNCIA HONESTA (escopo Fase 2): este board é READ-ONLY. Não há
 * drag-and-drop persistente — persistir a mudança de coluna exigiria um
 * endpoint de ESCRITA (`ctx.actions.updateDoc`) e uma rota `/api/*` de update,
 * fora do escopo desta fatia (a Fase 2 só lê `ctx.data`).
 */

import { lazy } from 'react';
import { z } from 'zod';
import type { BlockDefinition } from '@os/core';

// ============================================================
// Config
// ============================================================

const kanbanColumnSchema = z
  .object({
    /** Valor esperado no `statusField` para cair nesta coluna. */
    id: z.string().min(1),
    /** Rótulo exibido no topo da coluna. */
    label: z.string().min(1),
  })
  .strict();

/** Schema do `binding.config` do `kanban-board`. */
export const kanbanBoardConfigSchema = z
  .object({
    columns: z
      .array(kanbanColumnSchema)
      .min(1, 'kanban-board exige ao menos 1 coluna em config.columns'),
    /** Campo de cada card que decide sua coluna (comparado a `column.id`). */
    statusField: z.string().min(1),
    /** Campo usado como título do card. Default: 'titulo'. */
    titleField: z.string().min(1).optional(),
    /** Campo opcional exibido como etiqueta de agrupamento no card (ex.: projeto). */
    groupBy: z.string().min(1).optional(),
  })
  .strict();

export type KanbanBoardConfig = z.infer<typeof kanbanBoardConfigSchema>;

// ============================================================
// Definição registrável (componente carregado sob demanda)
// ============================================================

/** Definição registrável do bloco `kanban-board` (read-only nesta fase). */
export const kanbanBoard: BlockDefinition<KanbanBoardConfig> = {
  type: 'kanban-board',
  component: lazy(() => import('./component')),
  configSchema: kanbanBoardConfigSchema,
  defaultDataShape: 'collection',
};
