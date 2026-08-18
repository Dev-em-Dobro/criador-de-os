/**
 * apps/dobro — gera a ARTE da capa do carrossel "treinar-entrevista".
 *
 * O objeto aqui não é uma ferramenta com logo: é a CONVERSA acontecendo. A capa
 * mostra a IA no papel de entrevistadora (pergunta técnica de verdade) e, logo
 * abaixo, o feedback com nota por critério, que é o pulo do gato do post. Quem
 * vê a capa entende o produto sem ler o título.
 *
 * O texto da conversa é ilustrativo, escrito por nós: não é print de sessão real
 * e não afirma número nenhum sobre ferramenta de terceiro.
 *
 * Uso: node server/scripts/arte-treinar-entrevista.cjs
 * Saída: server/carrossel/assets/treinar-entrevista/capa.png (1080×1350)
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
  .art{position:relative;width:1080px;height:1350px;
    background:radial-gradient(120% 70% at 50% 0%, #2a1a4d 0%, #180f2e 46%, #0b0816 100%);}

  .win{position:absolute;top:44px;left:40px;width:1000px;height:690px;
    background:#14111f;border:1px solid #2e2748;border-radius:22px;overflow:hidden;
    box-shadow:0 50px 120px rgba(0,0,0,.75), 0 0 0 1px rgba(139,92,246,.10);}
  .bar{height:54px;background:#1b1729;border-bottom:1px solid #2a2440;
    display:flex;align-items:center;gap:10px;padding:0 22px}
  .dot{width:13px;height:13px;border-radius:50%}
  .tab{margin-left:18px;font-size:22px;color:#c9c3e6}

  .chat{padding:26px 28px;display:flex;flex-direction:column;gap:18px}
  .msg{max-width:88%;border-radius:16px;padding:18px 22px;font-size:25px;line-height:1.45}
  .ia{background:#1e1833;border:1px solid #342a55;color:#e9e5f7;align-self:flex-start}
  .eu{background:#7c46d6;color:#fff;align-self:flex-end;max-width:70%}
  .quem{font-size:17px;letter-spacing:.14em;color:#8f83f0;margin-bottom:9px;font-weight:700}
  .eu .quem{color:rgba(255,255,255,.75)}

  /* O feedback com nota é o que diferencia treinar com IA de conversar com IA. */
  .nota{margin-top:14px;border-top:1px solid #342a55;padding-top:14px;display:flex;flex-direction:column;gap:9px}
  .criterio{display:flex;align-items:center;gap:14px;font-size:21px;color:#b9b2d6}
  .criterio b{color:#fff;font-weight:700;width:210px;display:inline-block}
  /* display:block nos dois: como <span> inline, a barra ignora height e o
     preenchimento não aparece (a 1ª versão saiu com as três notas vazias). */
  .barra{flex:1;display:block;height:10px;border-radius:999px;background:#2b2347;overflow:hidden}
  .fill{display:block;height:10px;border-radius:999px;background:linear-gradient(90deg,#8b5cf6,#c4b5fd)}
  .val{width:56px;text-align:right;color:#f5c518;font-weight:700}

  .fade{position:absolute;inset:0;background:linear-gradient(180deg,
    rgba(11,8,22,0) 50%, rgba(11,8,22,.80) 60%, #0b0816 68%)}
</style></head><body>
<div class="art">
  <div class="win">
    <div class="bar">
      <div class="dot" style="background:#ff5f57"></div>
      <div class="dot" style="background:#febc2e"></div>
      <div class="dot" style="background:#28c840"></div>
      <div class="tab">Simulação · Vaga de dev júnior</div>
    </div>
    <div class="chat">
      <div class="msg ia">
        <div class="quem">ENTREVISTADORA</div>
        Me conta de um bug difícil que você resolveu. O que você
        tentou antes de achar a causa?
      </div>
      <div class="msg eu">
        <div class="quem">VOCÊ</div>
        Teve um formulário que salvava duas vezes...
      </div>
      <div class="msg ia" style="max-width:100%">
        <div class="quem">FEEDBACK DA RODADA</div>
        Você contou o problema, mas não disse o resultado.
        <div class="nota">
          <div class="criterio"><b>Clareza</b><span class="barra"><span class="fill" style="width:80%"></span></span><span class="val">8/10</span></div>
          <div class="criterio"><b>Profundidade</b><span class="barra"><span class="fill" style="width:50%"></span></span><span class="val">5/10</span></div>
          <div class="criterio"><b>Resultado</b><span class="barra"><span class="fill" style="width:30%"></span></span><span class="val">3/10</span></div>
        </div>
      </div>
    </div>
  </div>
  <div class="fade"></div>
</div>
</body></html>`;

(async () => {
  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', 'treinar-entrevista');
  mkdirSync(outDir, { recursive: true });

  const tmp = join(tmpdir(), `arte-treinar-entrevista-${Date.now()}.html`);
  writeFileSync(tmp, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(outDir, 'capa.png') });
  await browser.close();
  console.log('[arte] capa.png em server/carrossel/assets/treinar-entrevista/');
})().catch((e) => {
  console.error('[arte] FALHOU:', e.message);
  process.exit(1);
});
