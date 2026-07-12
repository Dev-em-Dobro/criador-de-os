/**
 * apps/dobro — seed de dados de EXEMPLO em `metricas_visao_geral`.
 *
 * Popula uma linha por período (weekly/monthly/quarterly) para que o filtro de
 * período do shell tenha algo para mostrar. Idempotente: limpa a tabela antes.
 * Os valores espelham o mock que a tela usava na fatia 1B (agora vindos do banco).
 */

import { db } from './client';
import { metricasVisaoGeral } from './schema';

const rows = [
  {
    period: 'monthly',
    receita: 128400,
    receitaPrev: 112300,
    conversao: 3.8,
    conversaoPrev: 3.2,
    roas: 2.6,
    roasPrev: 2.9,
    leads: 1840,
    leadsPrev: 1520,
  },
  {
    period: 'weekly',
    receita: 31200,
    receitaPrev: 28900,
    conversao: 3.5,
    conversaoPrev: 3.3,
    roas: 2.4,
    roasPrev: 2.5,
    leads: 470,
    leadsPrev: 410,
  },
  {
    period: 'quarterly',
    receita: 402800,
    receitaPrev: 356100,
    conversao: 4.1,
    conversaoPrev: 3.6,
    roas: 2.8,
    roasPrev: 2.7,
    leads: 5720,
    leadsPrev: 4880,
  },
];

async function main(): Promise<void> {
  console.log('[seed] limpando metricas_visao_geral...');
  await db.delete(metricasVisaoGeral);

  console.log(`[seed] inserindo ${rows.length} linha(s)...`);
  await db.insert(metricasVisaoGeral).values(rows);

  console.log('[seed] OK.');
}

main().catch((err) => {
  console.error('[seed] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
