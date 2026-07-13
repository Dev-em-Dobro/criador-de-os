/**
 * apps/neurovida — montagem do registry de blocos (inversão de controle).
 *
 * Registra o catálogo genérico de `@os/blocks` + os blocos CUSTOM da Neurovida
 * (ex.: o gerador de carrossel científico). O registry é idempotente por `type`.
 */

import { createRegistry } from '@os/core';
import { registerDefaultBlocks } from '@os/blocks';
import { carouselGenerator } from './blocks/CarouselGenerator';
import { leadScore } from './blocks/LeadScore';
import { simulador } from './blocks/Simulador';
import { faturaCartao } from './blocks/FaturaCartao';
import { settingsBlock } from './blocks/Settings';

export const registry = createRegistry();
registerDefaultBlocks(registry);
registry.register(carouselGenerator);
registry.register(leadScore);
registry.register(simulador);
registry.register(faturaCartao);
registry.register(settingsBlock);
