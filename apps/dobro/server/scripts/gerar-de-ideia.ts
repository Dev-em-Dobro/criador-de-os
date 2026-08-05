/**
 * apps/dobro — gera UM rascunho de carrossel/reels a partir de uma IDEIA (tema
 * livre) e o insere no cronograma como 'rascunho'. É a versão CLI do botão
 * "Gerar com IA" do painel — pensada pra ser acionada de qualquer lugar,
 * inclusive do CELULAR via Dispatch ("gere um carrossel sobre X").
 *
 * Uso:
 *   pnpm --filter @app/dobro conteudo:gerar-tema "<ideia>" [carrossel|reels]
 *   ex.: pnpm --filter @app/dobro conteudo:gerar-tema "3 erros de quem esta aprendendo a programar"
 *
 * Requer ANTHROPIC_API_KEY (.env da raiz). Faz chamada REAL a Claude (custo). O
 * rascunho aparece no board /conteudo/painel (aba Cronograma) com estado 'rascunho'.
 */

import { db } from '../../db/client';
import { criarRascunho } from '../conteudo-pipeline';
import { getAgencyAnthropicKey } from '../env';

async function main(): Promise<void> {
  const tema = process.argv[2];
  const formatoArg = (process.argv[3] || 'carrossel').toLowerCase();

  if (!tema || !tema.trim()) {
    console.error('uso: conteudo:gerar-tema "<ideia>" [carrossel|reels]');
    process.exit(1);
  }
  const formatoAlvo: 'carrossel' | 'reels' = formatoArg === 'reels' ? 'reels' : 'carrossel';

  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) {
    console.error('[gerar-tema] Sem ANTHROPIC_API_KEY no .env — nada a gerar.');
    process.exit(1);
  }

  console.log(`[gerar-tema] gerando ${formatoAlvo} sobre: "${tema.trim()}" ...`);
  const r = await criarRascunho(db, apiKey, { tema: tema.trim(), formatoAlvo });
  if (!r.created) {
    console.error(`[gerar-tema] nao criou rascunho: ${r.reason}`);
    process.exit(1);
  }
  console.log(`[gerar-tema] OK — rascunho ${r.formato}: "${r.titulo}" (id ${r.id})`);
  console.log('[gerar-tema] aparece no board /conteudo/painel (aba Cronograma) como rascunho.');
}

main().catch((err) => {
  console.error('[gerar-tema] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
