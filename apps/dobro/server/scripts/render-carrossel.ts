/**
 * apps/dobro — renderiza um carrossel no estilo JARVIS e grava o card no board.
 *
 * O que faz, numa tacada:
 *   1. Lê a definição do carrossel em server/carrossel/carrosseis/<slug>.ts.
 *   2. Monta o HTML (template parametrizado) com a imagem de fundo inline.
 *   3. Renderiza cada slide como PNG 1080×1350 (Playwright, deviceScaleFactor 3)
 *      em apps/dobro/public/carrosseis/<slug>/.
 *   4. (Re)grava o card em conteudo_posts com `img+full` em cada slide, então o
 *      preview do board mostra a arte pronta direto. Idempotente (apaga o antigo).
 *
 * Uso: pnpm --filter @app/dobro carrossel:render <slug>   (ex.: gta6)
 * Requer Playwright chromium instalado (pnpm exec playwright install chromium).
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts } from '../../db/schema';
import { getCarrossel, listSlugs } from '../carrossel/registry';
import { buildHtml } from '../carrossel/template';
import type { Carrossel } from '../carrossel/types';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..', '..'); // apps/dobro

/** Pauta legível (AIDA) a partir dos slides. */
function montarPauta(car: Carrossel): string {
  const linhas = [`Gancho: ${car.gancho}`];
  car.slides.forEach((s, i) => linhas.push(`Slide ${i + 1} [${s.variant}]: ${s.titulo.replace(/\n/g, ' ')}. ${s.corpo ?? ''}`));
  linhas.push(`CTA: ${car.ctaFinal}`);
  return linhas.join('\n');
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error(`uso: carrossel:render <slug>   (disponíveis: ${listSlugs().join(', ')})`);
    process.exit(1);
  }
  const car = getCarrossel(slug);
  if (!car) {
    console.error(`[render] carrossel "${slug}" não encontrado. Disponíveis: ${listSlugs().join(', ')}`);
    process.exit(1);
  }

  // Imagem de fundo (capa/sangria) inline como data URI.
  let bgDataUri = '';
  if (car.bgImage) {
    const bgPath = resolve(appRoot, car.bgImage);
    if (!existsSync(bgPath)) {
      console.error(`[render] imagem de fundo ausente: ${bgPath}`);
      process.exit(1);
    }
    // O mime precisa bater com o arquivo: com png declarado como jpeg o Chrome
    // até costuma renderizar, mas não é garantido.
    const mime = bgPath.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    bgDataUri = `data:${mime};base64,${readFileSync(bgPath).toString('base64')}`;
  }

  const html = buildHtml(car, bgDataUri);
  const tmpHtml = join(tmpdir(), `carrossel-${slug}.html`);
  writeFileSync(tmpHtml, html, { encoding: 'utf8' });

  const outDir = resolve(appRoot, 'public', 'carrosseis', slug);
  mkdirSync(outDir, { recursive: true });

  const n = car.slides.length;
  console.log(`[render] ${slug}: renderizando ${n} slides (1080×1350)...`);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1680, height: 1120 }, deviceScaleFactor: 3 });
    await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);
    for (let i = 0; i < n; i++) {
      await page.locator('.slide').nth(i).screenshot({ path: join(outDir, `slide-${i + 1}.png`) });
    }
  } finally {
    await browser.close();
  }
  console.log(`[render] ${n} PNGs em public/carrosseis/${slug}/`);

  // Roteiro com img+full (o preview do board mostra a arte pronta).
  const slidesRoteiro = car.slides.map((s, i) => ({
    ...s,
    img: `/carrosseis/${slug}/slide-${i + 1}.png`,
    full: true,
  }));

  console.log('[render] gravando o card no board (idempotente)...');
  await db.delete(conteudoPosts).where(inArray(conteudoPosts.titulo, [car.titulo]));
  const [row] = await db
    .insert(conteudoPosts)
    .values({
      titulo: car.titulo,
      estado: 'rascunho',
      plataforma: 'instagram',
      formato: 'carrossel',
      dataProgramada: car.dataProgramada ? new Date(car.dataProgramada) : null,
      capaUrl: `/carrosseis/${slug}/slide-1.png`,
      gancho: car.gancho,
      pauta: montarPauta(car),
      legenda: car.legenda,
      hashtags: car.hashtags,
      ctaFinal: car.ctaFinal,
      briefing: car.briefing ?? null,
      refsLinks: car.refsLinks ?? null,
      roteiro: { formato: 'carrossel', estilo: 'jarvis', slug, slides: slidesRoteiro },
    })
    .returning({ id: conteudoPosts.id });

  console.log(`[render] OK — "${car.titulo}" pronto no board (card ${row?.id}). Dá refresh no /conteudo.`);
}

main().catch((err) => {
  console.error('[render] FALHOU:', err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
