/**
 * apps/dobro — encaixa a capa do carrossel "github-perfil" no template.
 *
 * A arte veio de um gerador de imagem (dois personagens: nível 1 com espada de
 * madeira e nível 99 de armadura, com as setas de level up no meio). Ela está em
 * `capa-origem.png` e tem 1122×1402, que é 4:5 exato.
 *
 * POR QUE ESTE SCRIPT EXISTE: o gerador carimbou um logo do **HackerRank** no
 * canto superior esquerdo, marca de outra empresa, num post sobre GitHub. Não dá
 * pra publicar assim. O corte de 110px no topo tira o logo inteiro e ainda sobe
 * os personagens. O rodapé que falta é preenchido com a base da própria imagem,
 * que ali é roxo liso, então a emenda não aparece.
 *
 * Uso: node server/scripts/arte-github-perfil-capa.cjs
 * Entrada: server/carrossel/assets/github-perfil/capa-origem.png
 * Saída:   server/carrossel/assets/github-perfil/capa.png (1080×1350)
 */
const { chromium } = require('playwright');
const { readFileSync, existsSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');

const appRoot = resolve(__dirname, '..', '..');
const dir = resolve(appRoot, 'server', 'carrossel', 'assets', 'github-perfil');
const origem = join(dir, 'capa-origem.png');

if (!existsSync(origem)) {
  console.error(`[arte] não achei ${origem}.`);
  process.exit(1);
}

/** Quanto some do topo, já na escala final (1080 de largura). Tira o logo. */
const CORTE = 106;
const dataUri = `data:image/png;base64,${readFileSync(origem).toString('base64')}`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1350px;overflow:hidden}
  .art{position:relative;width:1080px;height:1350px;overflow:hidden;}
  /* A base entra primeiro e ocupa o quadro inteiro: é o roxo liso do rodapé da
     própria arte, esticado. Serve de fundo pro pedaço que falta embaixo depois
     do corte do topo. */
  .base{position:absolute;inset:0;
    background-image:url('${dataUri}');background-size:100% auto;background-position:center bottom;
    background-repeat:no-repeat;}
  .foto{position:absolute;inset:0;
    background-image:url('${dataUri}');background-size:100% auto;background-position:center -${CORTE}px;
    background-repeat:no-repeat;}
</style></head><body>
<div class="art">
  <div class="base"></div>
  <div class="foto"></div>
</div>
</body></html>`;

(async () => {
  const tmp = join(tmpdir(), 'arte-github-perfil-capa.html');
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
  console.log(`[arte] capa encaixada (topo cortado em ${CORTE}px, sem o logo intruso) em ${out}`);
})();
