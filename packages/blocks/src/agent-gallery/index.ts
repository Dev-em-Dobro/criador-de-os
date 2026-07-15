/**
 * @os/blocks — `agent-gallery` (Hub de Agentes).
 *
 * Uma galeria de cards de agentes de IA: cada card é um `AssistantProvider`
 * (mesmo `contextKey` do copiloto flutuante). Clicar num card abre o RELATÓRIO
 * do agente — a análise estruturada (`/api/assistant/:key/analyze`) + chat.
 * Config-driven: os cards vêm de `config.agents` no manifesto. Sob demanda.
 */

import { lazy } from 'react';
import type { BlockDefinition } from '@os/core';

/** Definição registrável do hub de agentes (genérico). */
export const agentGallery: BlockDefinition = {
  type: 'agent-gallery',
  component: lazy(() => import('./component')),
  defaultDataShape: 'raw',
};
