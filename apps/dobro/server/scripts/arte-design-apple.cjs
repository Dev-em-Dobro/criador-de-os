/**
 * apps/dobro — gera a COMPARAÇÃO do carrossel "design-apple": a mesma tela feita
 * sem regra nenhuma e feita com as regras da skill.
 *
 * A imagem vai na janelinha (`imagem`) do slide 2. Ela existe porque design se
 * mostra, não se descreve: dizer "fica com cara de produto" não convence ninguém
 * que já viu o antes e o depois lado a lado.
 *
 * As duas telas são ILUSTRAÇÃO nossa, não print de produto de ninguém. O lado
 * direito aplica de verdade o que o carrossel ensina, pra o slide não se
 * contradizer:
 *   · hierarquia por tamanho e peso, com o título em tracking negativo e a
 *     entrelinha apertada (regra 15);
 *   · camada translúcida com desfoque por cima do conteúdo (regra 12);
 *   · sombra curta e difusa em vez de sombra dura;
 *   · espaçamento desigual de propósito: o que é do mesmo grupo fica junto.
 * O lado esquerdo junta os vícios de tela gerada sem instrução: gradiente
 * berrante, tudo centralizado, tudo do mesmo tamanho, sombra preta dura, emoji
 * fazendo o trabalho da hierarquia.
 *
 * Uso: node server/scripts/arte-design-apple.cjs
 * Saída: server/carrossel/assets/design-apple/antes-depois.png (1232×800)
 */
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { writeFileSync } = require('node:fs');
const { pathToFileURL } = require('node:url');

const appRoot = resolve(__dirname, '..', '..');

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1232px;height:800px;font-family:Inter,system-ui,sans-serif;overflow:hidden}
  .par{display:flex;width:1232px;height:800px;}
  .lado{width:616px;height:800px;position:relative;overflow:hidden;}
  /* Etiqueta de cada lado, fora das telas pra não virar parte do "design". */
  .tag{position:absolute;top:0;left:0;right:0;height:52px;display:flex;align-items:center;
    justify-content:center;font-size:19px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;z-index:5;}
  .tag.ruim{background:#2a1230;color:#ff9b9b;}
  .tag.bom{background:#0f1a14;color:#8ce0ac;}
  .tela{position:absolute;top:52px;left:0;right:0;bottom:0;}

  /* ---------- ESQUERDA: sem regra nenhuma ---------- */
  .ia{background:linear-gradient(140deg,#7b2ff7 0%,#3f6fe4 50%,#12d8e8 100%);
    display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:34px;}
  .ia h2{font-size:42px;font-weight:700;color:#fff;text-align:center;text-shadow:3px 3px 0 rgba(0,0,0,.35);}
  .ia p{font-size:26px;font-weight:700;color:#fff;text-align:center;}
  .ia .cards{display:flex;gap:18px;width:100%;}
  /* Três caixas idênticas, sombra dura, tudo no mesmo peso: o vício clássico. */
  .ia .c{flex:1;background:#fff;border-radius:22px;padding:22px 14px;text-align:center;
    box-shadow:7px 7px 0 rgba(0,0,0,.45);}
  .ia .c b{display:block;font-size:32px;margin-bottom:8px;}
  .ia .c span{font-size:20px;font-weight:700;color:#333;}
  .ia .btn{background:linear-gradient(90deg,#ff6a3d,#ff2d78);color:#fff;font-size:26px;font-weight:700;
    padding:20px 54px;border-radius:999px;box-shadow:6px 6px 0 rgba(0,0,0,.4);}

  /* ---------- DIREITA: com as regras ---------- */
  .pro{background:#f4f4f6;padding:52px 46px;display:flex;flex-direction:column;}
  /* Regra 15: título grande, tracking negativo, entrelinha apertada. */
  .pro h2{font-size:44px;font-weight:700;color:#111114;letter-spacing:-.03em;line-height:1.05;}
  .pro .sub{font-size:22px;font-weight:400;color:#6b6b76;margin-top:12px;line-height:1.45;max-width:400px;}
  .pro .card{margin-top:30px;background:#fff;border-radius:20px;padding:8px 26px;position:relative;
    box-shadow:0 12px 30px rgba(17,17,20,.10), 0 1px 2px rgba(17,17,20,.08);}
  /* Espaçamento desigual de propósito: a linha respira dentro do card e o
     separador é fino, não uma borda dura. */
  .pro .linha{display:flex;align-items:center;gap:14px;padding:18px 0;border-top:1px solid #eeeef1;}
  .pro .linha:first-child{border-top:none;}
  .pro .dot{width:38px;height:38px;border-radius:12px;background:#111114;flex-shrink:0;}
  .pro .t{font-size:21px;font-weight:600;color:#111114;}
  .pro .s{font-size:17px;color:#8a8a95;margin-top:3px;}
  /* Regra 12: camada translúcida com o conteúdo passando por baixo. */
  .pro .vidro{position:absolute;right:20px;bottom:-16px;background:rgba(255,255,255,.72);
    backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.9);border-radius:14px;
    padding:12px 18px;font-size:17px;font-weight:600;color:#111114;
    box-shadow:0 10px 24px rgba(17,17,20,.12);}
  .pro .btn{margin-top:34px;align-self:flex-start;background:#111114;color:#fff;font-size:20px;
    font-weight:600;padding:15px 30px;border-radius:12px;box-shadow:0 6px 16px rgba(17,17,20,.22);}
</style></head><body>
<div class="par">
  <div class="lado">
    <div class="tag ruim">sem as regras</div>
    <div class="tela ia">
      <h2>🚀 Bem-vindo ao Futuro!</h2>
      <p>A melhor plataforma de todas</p>
      <div class="cards">
        <div class="c"><b>⚡</b><span>Rápido</span></div>
        <div class="c"><b>🔒</b><span>Seguro</span></div>
        <div class="c"><b>🎯</b><span>Preciso</span></div>
      </div>
      <div class="btn">COMEÇAR AGORA!</div>
    </div>
  </div>
  <div class="lado">
    <div class="tag bom">com as 17 regras</div>
    <div class="tela pro">
      <h2>Tudo o que entra<br>no seu projeto</h2>
      <div class="sub">Uma visão do que mudou desde ontem, sem você precisar procurar.</div>
      <div class="btn">Ver mudanças</div>
      <div class="card">
        <div class="linha">
          <div class="dot"></div>
          <div>
            <div class="t">Revisão concluída</div>
            <div class="s">há 2 minutos</div>
          </div>
        </div>
        <div class="linha">
          <div class="dot" style="background:#e8e8ec"></div>
          <div>
            <div class="t">Testes passando</div>
            <div class="s">128 de 128</div>
          </div>
        </div>
        <div class="linha">
          <div class="dot" style="background:#e8e8ec"></div>
          <div>
            <div class="t">Publicado</div>
            <div class="s">há 1 hora</div>
          </div>
        </div>
        <div class="vidro">4 arquivos</div>
      </div>
    </div>
  </div>
</div>
</body></html>`;

(async () => {
  const tmp = join(tmpdir(), 'arte-design-apple.html');
  writeFileSync(tmp, html, 'utf8');
  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', 'design-apple');
  mkdirSync(outDir, { recursive: true });
  const out = join(outDir, 'antes-depois.png');

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1232, height: 800 }, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.par').screenshot({ path: out });
  } finally {
    await browser.close();
  }
  console.log('[arte] comparação em server/carrossel/assets/design-apple/antes-depois.png');
})();
