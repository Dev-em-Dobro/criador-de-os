/**
 * apps/dobro — montagem do registry de blocos (inversão de controle).
 *
 * O APP monta o registry e registra as implementações; o core só resolve.
 * ⚠️ PROVISÓRIO: registra os blocos de exemplo (src/blocks.tsx). Na Fase 2, isto
 * passa a registrar os blocos reais de `@os/blocks`.
 */

import { createRegistry } from '@os/core';
import { kpiDashboardBlock, docViewerBlock } from './blocks';

export const registry = createRegistry();
registry.register(kpiDashboardBlock);
registry.register(docViewerBlock);
