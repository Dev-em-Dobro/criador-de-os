/**
 * apps/neurovida — teste manual do Estúdio IA (gerador de carrossel).
 *
 * Carrega o .env (fresco) e chama generateCarousel direto, sem passar pela API
 * HTTP nem pelo auth — para validar a geração real (Claude API + web search).
 *
 * Uso: pnpm tsx api/scripts/test-carousel.ts "tema do carrossel"
 */

import { generateCarousel } from '../carousel';
import { getAgencyAnthropicKey } from '../env';

const tema = process.argv[2] ?? 'Ômega 3 e memória';

async function main(): Promise<void> {
  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) {
    console.error('[test-carousel] Sem ANTHROPIC_API_KEY no .env — nada a testar.');
    process.exit(1);
  }

  console.log(`[test-carousel] Gerando sobre "${tema}" (pesquisa fontes reais — pode levar ~1 min)…\n`);
  const r = await generateCarousel(tema, 6, apiKey);

  console.log(`══════════ ${r.titulo} ══════════`);
  r.slides.forEach((s, i) => {
    console.log(`\n▸ Slide ${i + 1}: ${s.titulo}`);
    console.log(`  ${s.corpo}`);
  });
  console.log(`\n──────── Legenda ────────`);
  console.log(r.legenda);
  console.log(`Hashtags: ${r.hashtags.map((h) => `#${h}`).join(' ')}`);
  console.log(`\n──────── Fontes verificadas (${r.fontes.length}) ────────`);
  r.fontes.forEach((f) => console.log(`• ${f.titulo}\n  ${f.url}`));
  console.log(`\n[test-carousel] OK — ${r.slides.length} slides, ${r.fontes.length} fontes.`);
}

main().catch((e) => {
  console.error('[test-carousel] FALHOU:', e instanceof Error ? e.message : String(e));
  process.exit(1);
});
