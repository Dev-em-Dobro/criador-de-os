/**
 * apps/dobro — gera UM rascunho a partir de uma URL de referência do Instagram,
 * podendo FORÇAR o formato do nosso post (ex.: adaptar um reels em carrossel).
 *
 * Faz numa tacada o que o fluxo real faz em dois passos: semeia a `referencia`
 * (como o webhook do Telegram faria), enriquece com o conteúdo REAL do post
 * (legenda/formato/métricas via yt-dlp/Apify) e gera o rascunho em AIDA. Roda
 * como OWNER (script admin), igual ao `conteudo:processar`.
 *
 * Uso:
 *   pnpm --filter @app/dobro conteudo:gerar-url "<url>" [carrossel|reels] ["nota"]
 *   ex.: pnpm --filter @app/dobro conteudo:gerar-url \
 *          "https://www.instagram.com/reel/XXXX/" carrossel "esse reel bombou"
 *
 * Requer ANTHROPIC_API_KEY no .env. Faz chamada REAL à Claude (custo). O
 * rascunho aparece no board /conteudo com estado 'rascunho'.
 */

import { db } from '../../db/client';
import { referencias } from '../../db/schema';
import { criarRascunho } from '../conteudo-pipeline';
import { getAgencyAnthropicKey } from '../env';

async function main(): Promise<void> {
  const url = process.argv[2];
  const formatoArg = (process.argv[3] || 'carrossel').toLowerCase();
  const nota = process.argv[4] || null;

  if (!url) {
    console.error('uso: conteudo:gerar-url "<url>" [carrossel|reels] ["nota"]');
    process.exit(1);
  }
  const formatoAlvo: 'carrossel' | 'reels' = formatoArg === 'reels' ? 'reels' : 'carrossel';

  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) {
    console.error('[gerar-url] Sem ANTHROPIC_API_KEY no .env — nada a gerar.');
    process.exit(1);
  }

  const formatoRef = /\/(reel|reels|tv)\//i.test(url) ? 'reels' : null;
  const [ref] = await db
    .insert(referencias)
    .values({
      canal: 'manual',
      origemUrl: url,
      tipo: 'link',
      formatoRef,
      conteudoBruto: url,
      notaTime: nota,
      status: 'pendente',
    })
    .returning({ id: referencias.id });

  if (!ref?.id) throw new Error('falha ao semear a referência');
  console.log(`[gerar-url] referência criada: ${ref.id}`);
  console.log(`[gerar-url] gerando ${formatoAlvo} a partir de ${url} ...`);

  const r = await criarRascunho(db, apiKey, { referenciaId: ref.id, formatoAlvo });
  if (!r.created) {
    console.error(`[gerar-url] não criou rascunho: ${r.reason}`);
    process.exit(1);
  }
  console.log(`[gerar-url] OK — rascunho ${r.formato}: "${r.titulo}" (id ${r.id})`);
}

main().catch((err) => {
  console.error('[gerar-url] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
