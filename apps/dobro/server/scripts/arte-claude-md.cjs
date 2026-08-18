/**
 * apps/dobro — gera a ARTE da capa do carrossel "claude-md".
 *
 * O padrão das capas campeãs é o objeto em tela cheia com o texto no rodapé (ver
 * memória capas-carrossel-padrao). Aqui o objeto é o próprio arquivo: uma janela
 * de editor com o CLAUDE.md aberto na raiz do projeto, sangrando pelas laterais.
 * O terço de baixo fica escuro de propósito, porque é onde o template encaixa o
 * título, o subtítulo e a dica de swipe.
 *
 * Uso: node server/scripts/arte-claude-md.cjs
 * Saída: server/carrossel/assets/claude-md/capa.png (1080×1350)
 */
const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');

const appRoot = resolve(__dirname, '..', '..');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1350px;font-family:'Ubuntu Mono',monospace;overflow:hidden}
  .art{
    position:relative;width:1080px;height:1350px;
    background:
      radial-gradient(120% 80% at 50% 0%, #2a1a4d 0%, #1a1030 45%, #0d0a18 100%);
  }
  /* A janela sangra pelo TOPO, não pelas laterais: sangrar de lado cortava os
     nomes dos arquivos na barra lateral, e é justamente o CLAUDE.md que precisa
     ser lido. Ela termina em ~57% da altura, deixando o rodapé pro texto. */
  .win{
    position:absolute;top:-64px;left:36px;width:1008px;height:700px;
    background:#14111f;border-radius:26px;overflow:hidden;
    border:1px solid #2e2748;
    box-shadow:0 60px 140px rgba(0,0,0,.75), 0 0 0 1px rgba(139,92,246,.10);
    display:flex;flex-direction:column;
  }
  .bar{height:62px;background:#1b1729;display:flex;align-items:center;gap:11px;padding:0 26px;border-bottom:1px solid #2a2440}
  .dot{width:15px;height:15px;border-radius:50%}
  .tab{margin-left:26px;background:#14111f;border-radius:8px 8px 0 0;padding:10px 22px;font-size:25px;color:#c9c3e6;border-top:3px solid #8b5cf6}
  .body{flex:1;display:flex;min-height:0}
  .side{width:352px;background:#171324;border-right:1px solid #2a2440;padding:26px 0}
  .side .root{font-size:26px;color:#6f6790;padding:0 30px 16px;letter-spacing:.5px}
  .f{display:flex;align-items:center;gap:14px;padding:13px 30px 13px 46px;font-size:29px;color:#8079a3}
  /* O arquivo é o herói: fundo roxo, texto claro e um brilho pra puxar o olho. */
  .f.on{
    color:#fff;font-weight:700;
    background:linear-gradient(90deg, rgba(139,92,246,.34), rgba(139,92,246,.04));
    box-shadow:inset 4px 0 0 #8b5cf6;
    text-shadow:0 0 26px rgba(167,139,250,.75);
  }
  .code{flex:1;padding:34px 40px;font-size:29px;line-height:1.62;color:#b9b2d6;min-width:0}
  .h{color:#a78bfa;font-weight:700}
  .k{color:#f0ece1}
  .c{color:#5f5880}
  .cursor{display:inline-block;width:14px;height:30px;background:#a78bfa;vertical-align:-5px;margin-left:3px}
  /* Escurece a partir da base da janela: é onde o título do template vai cair. */
  .fade{position:absolute;inset:0;background:linear-gradient(180deg,
    rgba(13,10,24,0) 34%, rgba(13,10,24,.80) 48%, #0d0a18 58%)}
</style></head><body>
<div class="art">
  <div class="win">
    <div class="bar">
      <div class="dot" style="background:#ff5f57"></div>
      <div class="dot" style="background:#febc2e"></div>
      <div class="dot" style="background:#28c840"></div>
      <div class="tab">CLAUDE.md</div>
    </div>
    <div class="body">
      <div class="side">
        <div class="root">seu-projeto</div>
        <div class="f on">CLAUDE.md</div>
        <div class="f">src</div>
        <div class="f">tests</div>
        <div class="f">package.json</div>
        <div class="f">README.md</div>
      </div>
      <div class="code">
        <div class="h"># Este projeto</div>
        <div class="k">Next.js 15, TypeScript, Tailwind.</div>
        <div style="height:22px"></div>
        <div class="h">## Comandos</div>
        <div class="k">pnpm dev · pnpm test · pnpm lint</div>
        <div style="height:22px"></div>
        <div class="h">## Estilo</div>
        <div class="k">Um componente por pasta.</div>
        <div style="height:22px"></div>
        <div class="h">## Não faça</div>
        <div class="k">Não mexa em /legacy.</div>
        <div class="k">Não commite direto na main.<span class="cursor"></span></div>
      </div>
    </div>
  </div>
  <div class="fade"></div>
</div>
</body></html>`;

(async () => {
  const tmp = join(tmpdir(), 'arte-claude-md.html');
  writeFileSync(tmp, html, 'utf8');
  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', 'claude-md');
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, 'capa.png');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.art').screenshot({ path: out });
  } finally {
    await browser.close();
  }
  console.log(`[arte] capa em server/carrossel/assets/claude-md/capa.png`);
})();
