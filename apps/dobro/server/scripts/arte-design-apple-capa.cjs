/**
 * apps/dobro — encaixa a capa do carrossel "design-apple" no template.
 *
 * A foto escolhida pelo dono (`capa-origem.png`) é quase quadrada, 469×437, e o
 * slide é 4:5. Escalada pela largura ela ocupa os 74% de cima do quadro e para;
 * o resto ficaria vazio. Este script põe a foto no topo e RECOMPÕE o rodapé com
 * a própria base dela, que é a camisa preta, então a emenda não aparece e o
 * título de 3 linhas cai sobre preto chapado, com contraste de sobra.
 *
 * Sobre a resolução: a foto é pequena pro tamanho final (1080×1350), então ela
 * sobe cerca de 2,3×. O rosto fica levemente suave. Se aparecer uma versão maior
 * da mesma foto, é só trocar o `capa-origem.png` e rodar de novo.
 *
 * Uso: node server/scripts/arte-design-apple-capa.cjs
 * Entrada: server/carrossel/assets/design-apple/capa-origem.png
 * Saída:   server/carrossel/assets/design-apple/capa.png (1080×1350)
 */
const { chromium } = require('playwright');
const { readFileSync, existsSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');

const appRoot = resolve(__dirname, '..', '..');
const dir = resolve(appRoot, 'server', 'carrossel', 'assets', 'design-apple');
const origem = join(dir, 'capa-origem.png');

if (!existsSync(origem)) {
  console.error(`[arte] não achei ${origem}.`);
  process.exit(1);
}

const dataUri = `data:image/png;base64,${readFileSync(origem).toString('base64')}`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1350px;overflow:hidden;background:#000}
  .art{position:relative;width:1080px;height:1350px;overflow:hidden;background:#000;}
  /* 115% de largura (sangra um pouco pelas laterais) e subida de 100px. Duas
     razões: a foto passa a cobrir mais altura, o que afasta a emenda da vista, e
     o rosto fica maior. O DEDO, que é o que para o scroll, termina por volta dos
     774px, acima da faixa onde o título entra. */
  .foto{position:absolute;top:0;left:0;right:0;bottom:0;
    background-image:url('${dataUri}');background-size:115% auto;background-position:center -100px;
    background-repeat:no-repeat;}
  /* Repetir a base da foto não funcionou aqui: a parte de baixo dela tem o braço,
     não uma cor chapada, e a cópia virava um segundo dedo fantasma. O rodapé é
     preto e a foto se dissolve nele. O degradê tem que chegar a preto ANTES da
     linha onde a foto acaba (~1057px), senão a emenda reaparece como um risco. */
  .fade{position:absolute;left:0;right:0;bottom:0;height:570px;
    background:linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.35) 16%, rgba(0,0,0,.8) 33%, #000 49%, #000 100%);}
</style></head><body>
<div class="art">
  <div class="foto"></div>
  <div class="fade"></div>
</div>
</body></html>`;

(async () => {
  const tmp = join(tmpdir(), 'arte-design-apple-capa.html');
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
  console.log('[arte] capa em server/carrossel/assets/design-apple/capa.png');
})();
