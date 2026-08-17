/**
 * apps/dobro — encaixa a foto do Tony Stark na capa do carrossel "hermes".
 *
 * POR QUE ESTE SCRIPT EXISTE: a foto é HORIZONTAL (740×425) e o slide é vertical.
 * Encaixada por largura, ela ocupa os 46% de cima e o resto do slide fica preto,
 * o que é bom (o texto cai no preto), mas a emenda vira uma linha reta atravessando
 * o slide. Aqui a base da foto se dissolve no preto, então não há linha nenhuma.
 *
 * A foto entra por largura de propósito: com `cover` ela seria escalada pela
 * altura e os braços abertos, que são o assunto, sairiam cortados nas laterais.
 *
 * Uso: node server/scripts/arte-hermes-capa.cjs
 * Entrada: server/carrossel/assets/hermes/capa-ironman.jpg
 * Saída:   server/carrossel/assets/hermes/capa-ironman-encaixada.jpg (1080×1350)
 */
const { chromium } = require('playwright');
const { readFileSync, existsSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');

const appRoot = resolve(__dirname, '..', '..');
const dir = resolve(appRoot, 'server', 'carrossel', 'assets', 'hermes');
const origem = join(dir, 'capa-ironman.jpg');

if (!existsSync(origem)) {
  console.error(`[arte] não achei ${origem}.`);
  process.exit(1);
}

const dataUri = `data:image/jpeg;base64,${readFileSync(origem).toString('base64')}`;

/** Altura da foto no slide: 1080 de largura na proporção 740×425. */
const ALTURA = Math.round((1080 * 425) / 740); // 620

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1350px;overflow:hidden;background:#000}
  .art{position:relative;width:1080px;height:1350px;background:#000;}
  .foto{position:absolute;top:0;left:0;width:1080px;height:${ALTURA}px;
    background-image:url('${dataUri}');background-size:100% 100%;background-repeat:no-repeat;
    /* A base da foto (dos 55% pra baixo) esmaece até sumir, e o preto do .art aparece por
       baixo. É isso que apaga a linha da emenda. */
    -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 55%,rgba(0,0,0,.78) 72%,rgba(0,0,0,.34) 87%,transparent 100%);
    mask-image:linear-gradient(to bottom,#000 0%,#000 55%,rgba(0,0,0,.78) 72%,rgba(0,0,0,.34) 87%,transparent 100%);}
</style></head><body>
<div class="art"><div class="foto"></div></div>
</body></html>`;

(async () => {
  const tmp = join(tmpdir(), `arte-hermes-capa-${Date.now()}.html`);
  writeFileSync(tmp, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: join(dir, 'capa-ironman-encaixada.jpg'), type: 'jpeg', quality: 95 });
  await browser.close();
  console.log('[arte] capa-ironman-encaixada.jpg em server/carrossel/assets/hermes/');
})().catch((e) => {
  console.error('[arte] FALHOU:', e.message);
  process.exit(1);
});
