/**
 * @os/blocks — `doc-viewer` (definição + config).
 *
 * Visualizador de markdown. Doadores: `CampanhasDocsSection`, `PodcastDraftView`
 * e `NewsletterDetailView` do Dobro OS — todos renderizam um documento de texto
 * (draft/briefing/artigo) numa "folha" estilizada. O que era específico (a
 * fonte Firestore, o texto do documento, o nome da campanha) sai do bloco: o
 * markdown chega por `config` OU por `ctx.data`.
 *
 * O COMPONENTE vive em `./component` e é carregado sob demanda (`lazy`). Isso
 * é o que ISOLA `react-markdown` + `remark-gfm` (pesados) num chunk próprio:
 * apps/rotas que não abrem um doc-viewer não pagam por essas libs no bundle
 * inicial. Aqui ficam só o schema/tipo de config (leves) e a definição.
 */

import { lazy } from 'react';
import { z } from 'zod';
import type { BlockDefinition } from '@os/core';

// ============================================================
// Config
// ============================================================

/** Schema do `binding.config` do `doc-viewer`. */
export const docViewerConfigSchema = z
  .object({
    /** Título opcional renderizado como H1 acima do corpo. */
    heading: z.string().optional(),
    /** Corpo como lista de blocos de markdown (juntados por linha em branco). */
    body: z.array(z.string()).optional(),
    /** Corpo como uma única string markdown (tem precedência sobre `body`). */
    markdown: z.string().optional(),
    /** Campo da linha de dados que contém o markdown (quando vem de `ctx.data`). */
    field: z.string().min(1).optional(),
  })
  .strict();

export type DocViewerConfig = z.infer<typeof docViewerConfigSchema>;

// ============================================================
// Definição registrável (componente carregado sob demanda)
// ============================================================

/** Definição registrável do bloco `doc-viewer`. */
export const docViewer: BlockDefinition<DocViewerConfig> = {
  type: 'doc-viewer',
  component: lazy(() => import('./component')),
  configSchema: docViewerConfigSchema,
  defaultDataShape: 'raw',
};
