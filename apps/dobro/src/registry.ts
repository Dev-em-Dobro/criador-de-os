/**
 * apps/dobro — montagem do registry de blocos (inversão de controle).
 *
 * O APP monta o registry e registra as implementações; o core só resolve.
 * Registra o catálogo genérico e reutilizável de `@os/blocks` de uma vez via
 * `registerDefaultBlocks`. Blocos custom deste cliente (ex.: `custom:...`), se
 * existirem, seriam registrados DEPOIS aqui — o registry é idempotente por
 * `type`, então uma variante custom pode sobrescrever um bloco do catálogo.
 */

import { createRegistry } from '@os/core';
import { registerDefaultBlocks } from '@os/blocks';

export const registry = createRegistry();
registerDefaultBlocks(registry);
