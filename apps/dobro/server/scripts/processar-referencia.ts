/**
 * apps/dobro — processa UMA referência específica → rascunho (pipeline de IA).
 *
 * O `conteudo:processar` pega a fila inteira de pendentes. Este aqui roda só a
 * referência que você apontar, mesmo que ela já esteja 'processada' — que é o
 * caso de reprocessar depois de uma correção no pipeline (ex.: passar a ler os
 * slides do carrossel) e comparar o rascunho novo com o antigo.
 *
 * Aceita o id da referência OU um pedaço da URL (mais fácil de copiar do board).
 * Quando o pedaço casar com mais de uma referência, ele lista e não faz nada:
 * escolher por você seria chutar qual delas você quis.
 *
 * Uso (de dentro de apps/dobro):
 *   npx tsx server/scripts/processar-referencia.ts <id-ou-pedaço-da-url>
 *
 * Faz chamadas REAIS à Claude (custo). Ler os slides só funciona local.
 */

import { desc, like } from 'drizzle-orm';
import { db } from '../../db/client';
import { referencias } from '../../db/schema';
import { getAgencyAnthropicKey } from '../env';
import { criarRascunho } from '../conteudo-pipeline';

/** Parece um UUID? Então é id; senão tratamos como trecho de URL. */
function ehUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

async function resolverId(alvo: string): Promise<string> {
  if (ehUuid(alvo)) return alvo;

  const achadas = await db
    .select()
    .from(referencias)
    .where(like(referencias.origemUrl, `%${alvo}%`))
    .orderBy(desc(referencias.createdAt));

  if (!achadas.length) throw new Error(`nenhuma referência com "${alvo}" na URL`);
  if (achadas.length > 1) {
    console.error(`[pipeline] "${alvo}" casou com ${achadas.length} referências. Rode de novo com o id:`);
    for (const r of achadas) {
      const when = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt);
      console.error(`  · ${r.id}  [${r.status}]  ${when}`);
    }
    process.exit(2);
  }
  return achadas[0]!.id;
}

async function main(): Promise<void> {
  const alvo = process.argv[2];
  if (!alvo) {
    console.error('uso: processar-referencia <id-ou-pedaço-da-url>');
    process.exit(1);
  }

  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) {
    console.error('[pipeline] Sem ANTHROPIC_API_KEY no .env — nada a processar.');
    process.exit(1);
  }

  const referenciaId = await resolverId(alvo);
  console.log(`[pipeline] processando referência ${referenciaId}...`);

  const r = await criarRascunho(db, apiKey, { referenciaId, permitirSemSlides: true });
  if (!r.created) {
    console.error(`[pipeline] não gerou rascunho: ${r.reason ?? 'motivo desconhecido'}`);
    process.exit(1);
  }

  console.log(`[pipeline] OK — rascunho ${r.id}`);
  console.log(`  título: ${r.titulo}`);
  console.log(`  formato: ${r.formato}`);
  console.log(`  previsão: ${r.previsao ? `${r.previsao.classe} (${r.previsao.furaABolha.total}/25)` : 'não registrada'}`);
}

main().catch((err) => {
  console.error('[pipeline] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
