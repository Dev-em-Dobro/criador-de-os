/**
 * apps/neurovida — montagem do registry de blocos (inversão de controle).
 *
 * `registerDefaultBlocks` traz TODO o catálogo genérico de `@os/blocks` —
 * incluindo os blocos de fábrica `settings-panel`, `lead-console` e
 * `invoice-console` (que falam com o backend @os/server). Aqui só sobram os
 * blocos ainda ESPECÍFICOS da neurovida (carrossel e simulador).
 */

import { createRegistry } from '@os/core';
import { registerDefaultBlocks } from '@os/blocks';
import { carouselGenerator } from './blocks/CarouselGenerator';
import { simulador } from './blocks/Simulador';

export const registry = createRegistry();
registerDefaultBlocks(registry);
registry.register(carouselGenerator);
registry.register(simulador);
