/**
 * @os/blocks — `lead-console` (Análise de leads).
 *
 * Bloco "console" genérico: sobe CSV por fonte, consolida (merge/dedup), pontua
 * (régua de ICP vinda do MANIFESTO em `config.scoring`) e navega leads por
 * segmento. Fala com o backend de fábrica (@os/server, rotas /api/leads/*).
 */

import { lazy } from 'react';
import type { BlockDefinition } from '@os/core';

/** Definição registrável do bloco de leads (genérico, config-driven). */
export const leadConsole: BlockDefinition = {
  type: 'lead-console',
  component: lazy(() => import('./component')),
  defaultDataShape: 'raw',
};
