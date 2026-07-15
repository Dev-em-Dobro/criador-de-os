/**
 * apps/neurovida — SEED de faturamento Hotmart com dados FALSOS (Caminho C).
 *
 * Nenhum dev toca a conta Hotmart real: este script insere agregados fictícios em
 * `hotmart_metrics` para testar o painel de Faturamento sem credenciais reais.
 * Idempotente (upsert por período). Usa a connection string OWNER (env.ts).
 *
 * Uso: pnpm -C apps/neurovida db:seed-hotmart
 */

import { db } from './client';
import { makeHotmart, type ServerDb } from '@os/server';

const hotmart = makeHotmart(db as unknown as ServerDb, async () => null);

async function main(): Promise<void> {
  const now = new Date();
  const N = 12;
  const rows: Array<{ period: string; gross: number; sales: number }> = [];

  // Faturamento fictício com leve tendência de crescimento + sazonalidade suave.
  for (let i = N - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const period = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const growth = 1 + (N - 1 - i) * 0.06; // ~6% ao mês
    const season = 1 + 0.15 * Math.sin((d.getUTCMonth() / 12) * Math.PI * 2);
    const gross = Math.round(18000 * growth * season);
    const sales = Math.max(1, Math.round(gross / 197)); // ticket médio ~R$197
    rows.push({ period, gross, sales });
  }

  console.log('[seed-hotmart] inserindo faturamento fictício (Caminho C):');
  for (const r of rows) {
    await hotmart.saveMonth({
      period: r.period,
      product: 'Todos os produtos',
      productId: null,
      grossRevenue: r.gross,
      netRevenue: Math.round(r.gross * 0.9), // Hotmart fica com ~10%
      salesCount: r.sales,
      currency: 'BRL',
    });
    console.log(`  ${r.period} → R$ ${r.gross.toLocaleString('pt-BR')} · ${r.sales} vendas`);
  }

  const metrics = await hotmart.getMetrics();
  console.log(
    `[seed-hotmart] OK — ${metrics.rows.length} meses; faturamento 12m = R$ ${metrics.totals.last12mRevenue.toLocaleString(
      'pt-BR',
    )}.`,
  );
}

main().catch((err) => {
  console.error('[seed-hotmart] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
