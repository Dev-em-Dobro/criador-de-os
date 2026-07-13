/**
 * @os/blocks — `settings-panel` (Configurações / BYOK).
 *
 * Bloco "console" genérico: lista as configurações (GET /api/settings) e deixa
 * o cliente colar/remover as próprias chaves (modelo BYOK). Fala com o backend
 * de fábrica (@os/server, rotas /api/settings*). Componente carregado sob demanda.
 */

import { lazy } from 'react';
import type { BlockDefinition } from '@os/core';

/** Definição registrável do bloco de Configurações (genérico). */
export const settingsPanel: BlockDefinition = {
  type: 'settings-panel',
  component: lazy(() => import('./component')),
  defaultDataShape: 'raw',
};
