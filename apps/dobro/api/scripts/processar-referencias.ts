/**
 * apps/dobro — processa referências pendentes → rascunhos (roda o pipeline de IA).
 *
 * Uso:
 *   pnpm conteudo:processar        # até 5 referências pendentes
 *   pnpm conteudo:processar 10     # até 10
 *
 * Requer ANTHROPIC_API_KEY no .env (chave da agência / BYOK). Faz chamadas REAIS
 * à Claude (custo). Se não houver chave ou nenhuma referência pendente, sai limpo.
 */

import { getAgencyAnthropicKey } from '../env';
import { processarReferenciasPendentes } from '../conteudo-pipeline';

async function main(): Promise<void> {
  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) {
    console.error('[pipeline] Sem ANTHROPIC_API_KEY no .env — nada a processar.');
    process.exit(1);
  }
  const limit = Number(process.argv[2]) || 5;

  console.log(`[pipeline] processando até ${limit} referência(s) pendente(s)...`);
  const { processadas, rascunhos } = await processarReferenciasPendentes(apiKey, limit);

  if (processadas === 0) {
    console.log('[pipeline] nenhuma referência pendente — nada a fazer.');
    return;
  }
  console.log(`[pipeline] OK — ${processadas} processada(s), ${rascunhos.length} rascunho(s) criados:`);
  rascunhos.forEach((id) => console.log(`  · ${id}`));
}

main().catch((err) => {
  console.error('[pipeline] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
