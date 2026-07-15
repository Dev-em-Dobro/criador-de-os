/**
 * @os/blocks — `hotmart-console` (Faturamento da Hotmart).
 *
 * Bloco "console" genérico: com as credenciais BYOK do cliente (Configurações), o
 * backend @os/server puxa o RESUMO de vendas da Hotmart e guarda SÓ agregados. A
 * tela mostra faturamento por mês + totais. Fala com /api/hotmart/*. Sob demanda.
 */

import { lazy } from 'react';
import type { BlockDefinition } from '@os/core';

/** Definição registrável do bloco de faturamento Hotmart (genérico). */
export const hotmartConsole: BlockDefinition = {
  type: 'hotmart-console',
  component: lazy(() => import('./component')),
  defaultDataShape: 'raw',
};
