/**
 * apps/dobro — tira print de páginas web pra usar como arte dentro de um carrossel.
 *
 * O padrão das nossas capas que performaram é MOSTRAR o objeto (a própria
 * ferramenta na tela), não uma foto de banco de imagem. Este script resolve a
 * parte chata: abre cada URL num Chromium, espera a página assentar (fonte +
 * animação de entrada) e salva um PNG 16:10 na pasta de assets do carrossel.
 *
 * A janela ocupa o slide inteiro embaixo do texto e é quase quadrada, então a
 * captura sai em 1280×1040 (e não no 16:9 do costume): com o print panorâmico o
 * `cover` come as laterais da página e a arte perde a sidebar/o menu.
 *
 * Uso: npx tsx server/scripts/capturar-prints.ts <pasta> <nome=url> [nome=url...]
 *   ex.: capturar-prints.ts cara-de-caro reactbits=https://reactbits.dev
 * Saída: server/carrossel/assets/<pasta>/<nome>.png (1280×1040)
 */

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..', '..'); // apps/dobro

async function main(): Promise<void> {
  const [pasta, ...pares] = process.argv.slice(2);
  if (!pasta || pares.length === 0) {
    console.error('uso: capturar-prints.ts <pasta> <nome=url> [nome=url...]');
    process.exit(1);
  }

  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', pasta);
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 1040 }, deviceScaleFactor: 2 });
    for (const par of pares) {
      const i = par.indexOf('=');
      const nome = par.slice(0, i);
      const url = par.slice(i + 1);
      const page = await ctx.newPage();
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 45_000 });
        // Animação de entrada + fonte: sem essa espera o print sai pela metade.
        await page.waitForTimeout(4000);
        await page.screenshot({ path: join(outDir, `${nome}.png`) });
        console.log(`[print] ok  ${nome} <- ${url}`);
      } catch (err) {
        console.error(`[print] FALHOU ${nome} <- ${url}:`, err instanceof Error ? err.message : err);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
  console.log(`[print] PNGs em server/carrossel/assets/${pasta}/`);
}

main().catch((err) => {
  console.error('[print] FALHOU:', err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
