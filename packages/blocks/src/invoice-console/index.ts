/**
 * @os/blocks — `invoice-console` (Fatura de cartão por PDF).
 *
 * Bloco "console" genérico: o cliente sobe 1+ PDFs da fatura; a IA (chave BYOK,
 * via backend @os/server) extrai/categoriza; a tela mostra os custos SOMADOS por
 * categoria + controle de cortes. Fala com /api/invoices*. Componente sob demanda.
 */

import { lazy } from 'react';
import type { BlockDefinition } from '@os/core';

/** Definição registrável do bloco de faturas (genérico). */
export const invoiceConsole: BlockDefinition = {
  type: 'invoice-console',
  component: lazy(() => import('./component')),
  defaultDataShape: 'raw',
};
