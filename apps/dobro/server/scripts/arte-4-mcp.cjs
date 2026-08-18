/**
 * apps/dobro — encaixa a capa do carrossel "4-mcp-gratis" no template.
 *
 * A arte veio de um gerador de imagem (Claude no centro, quatro MCP ligados a
 * ele com o nome borrado atrás de um "?"), a partir da referência do dono. Ela
 * está em `capa-origem.png` e é boa, mas os dois cards de baixo terminam em 61%
 * da altura, exatamente onde o template começa a escrever o título de 3 linhas:
 * a primeira linha encostava neles.
 *
 * Este script SOBE a arte em 100px e recompõe o rodapé. Como o rodapé da imagem
 * é bege liso, a faixa que falta é preenchida com a própria base dela, então a
 * emenda não aparece. Resultado: os cards terminam em ~54% e o texto ganha folga.
 *
 * Por que aqui e não no `bgPos` do slide: com `bgPos` a imagem sobe, mas o vão
 * que sobra embaixo mostra o fundo do slide (preto, no variant `photo`), o que
 * cria uma faixa escura debaixo de uma arte bege.
 *
 * Uso: node server/scripts/arte-4-mcp.cjs
 * Entrada: server/carrossel/assets/4-mcp-gratis/capa-origem.png
 * Saída:   server/carrossel/assets/4-mcp-gratis/capa.png (1080×1350)
 */
const { chromium } = require('playwright');
const { readFileSync, existsSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { writeFileSync } = require('node:fs');
const { pathToFileURL } = require('node:url');

const appRoot = resolve(__dirname, '..', '..');
const dir = resolve(appRoot, 'server', 'carrossel', 'assets', '4-mcp-gratis');
const origem = join(dir, 'capa-origem.png');

if (!existsSync(origem)) {
  console.error(`[arte] não achei ${origem}. Guarde ali a imagem gerada, sem cortes.`);
  process.exit(1);
}

/** Quanto a arte sobe. Cada pixel aqui é um pixel a mais de folga pro título. */
const SUBIR = 100;
const dataUri = `data:image/png;base64,${readFileSync(origem).toString('base64')}`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1350px;overflow:hidden}
  .art{position:relative;width:1080px;height:1350px;overflow:hidden;}
  /* A arte, subida. A imagem tem a mesma proporção do slide (4:5), então
     '100% auto' a deixa exatamente 1080×1350 antes do deslocamento. */
  .arte{position:absolute;left:0;right:0;top:${-SUBIR}px;height:1350px;
    background-image:url('${dataUri}');background-size:100% auto;background-position:center top;
    background-repeat:no-repeat;}
  /* A faixa que sobrou embaixo, preenchida com a BASE da própria imagem (bege
     liso). Puxa os últimos pixels dela, então a cor e a vinheta lateral batem. */
  .base{position:absolute;left:0;right:0;bottom:0;height:${SUBIR + 40}px;
    background-image:url('${dataUri}');background-size:100% auto;background-position:center bottom;
    background-repeat:no-repeat;}
  /* Disfarça a emenda: um degradê curto por cima da linha onde as duas se
     encontram, usando a mesma cor média da base. */
  .emenda{position:absolute;left:0;right:0;bottom:${SUBIR + 20}px;height:60px;
    background:linear-gradient(180deg, rgba(226,222,215,0) 0%, rgba(226,222,215,.55) 50%, rgba(226,222,215,0) 100%);
    filter:blur(6px);}
</style></head><body>
<div class="art">
  <div class="arte"></div>
  <div class="base"></div>
  <div class="emenda"></div>
</div>
</body></html>`;

(async () => {
  const tmp = join(tmpdir(), 'arte-4-mcp-encaixe.html');
  writeFileSync(tmp, html, 'utf8');
  const out = join(dir, 'capa.png');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
    await page.locator('.art').screenshot({ path: out });
  } finally {
    await browser.close();
  }
  console.log(`[arte] capa encaixada (subiu ${SUBIR}px) em server/carrossel/assets/4-mcp-gratis/capa.png`);
})();
