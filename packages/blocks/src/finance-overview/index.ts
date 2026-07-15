/**
 * @os/blocks — `finance-overview` (Resultado & Caixa — o painel do dono).
 *
 * Cruza Receita (Faturamento/Hotmart) × Despesa (fatura do cartão + custos fora
 * do cartão que o dono informa) e mostra lucro, margem, break-even, runway e a
 * PROJEÇÃO DE CAIXA de 12 meses. Os números vêm de `/api/finance/overview` (motor
 * determinístico do @os/server) — o bloco só desenha. Sob demanda.
 */

import { lazy } from 'react';
import type { BlockDefinition } from '@os/core';

/** Definição registrável do painel do dono (genérico). */
export const financeOverview: BlockDefinition = {
  type: 'finance-overview',
  component: lazy(() => import('./component')),
  defaultDataShape: 'raw',
};
