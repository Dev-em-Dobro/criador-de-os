/**
 * apps/dobro — montagem do registry de blocos (inversão de controle).
 *
 * O APP monta o registry e registra as implementações; o core só resolve.
 * Registra o catálogo genérico e reutilizável de `@os/blocks` de uma vez via
 * `registerDefaultBlocks`. Blocos custom deste cliente (ex.: `custom:...`) são
 * registrados DEPOIS — o registry é idempotente por `type`, então uma variante
 * custom pode sobrescrever um bloco do catálogo.
 */

import { createRegistry } from '@os/core';
import { registerDefaultBlocks } from '@os/blocks';
import { conteudoDashboard, conteudoCronograma } from './blocks/ConteudoDashboard';

export const registry = createRegistry();
registerDefaultBlocks(registry);
registry.register(conteudoDashboard);
registry.register(conteudoCronograma);
