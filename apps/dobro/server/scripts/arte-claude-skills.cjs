/**
 * apps/dobro — gera a ARTE da capa do carrossel "claude-skills".
 *
 * A referência (@kauandeploy, 2.267 comentários) abre com um ORGANOGRAMA: uma
 * caixa no topo com o workspace e linhas descendo até os times. Esta capa usa o
 * mesmo enquadramento, com duas diferenças que são o ponto do nosso post: a
 * caixa do topo é o repositório REAL (com a contagem de estrelas, que prova que
 * existe) e os times são os quatro em que as 17 skills oficiais se dividem.
 *
 * O terço de baixo fica escuro de propósito: é onde o template encaixa título,
 * subtítulo e a dica de swipe (ver memória capas-carrossel-padrao).
 *
 * Uso: node server/scripts/arte-claude-skills.cjs
 * Saída: server/carrossel/assets/claude-skills/capa.png (1080×1350)
 */
const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');

const appRoot = resolve(__dirname, '..', '..');

/** Os quatro times, na ordem em que aparecem no carrossel. */
const TIMES = [
  { nome: 'DOCUMENTOS', cor: '#5aa9ff', n: '4 skills' },
  { nome: 'DESIGN', cor: '#e879c7', n: '6 skills' },
  { nome: 'DEV', cor: '#ffb057', n: '4 skills' },
  { nome: 'COMUNICAÇÃO', cor: '#4ee1a0', n: '3 skills' },
];

/**
 * Mascote de bloco: um retângulo com dois "olhos" e três "pernas", desenhado só
 * com divs. É o espírito do bichinho pixel da referência sem copiar o desenho
 * dela, e o pixelado combina com a Ubuntu Mono do resto do carrossel.
 */
function mascote(cor) {
  return `
    <div class="masc">
      <div class="corpo" style="background:${cor}">
        <div class="olho"></div><div class="olho"></div>
      </div>
      <div class="pernas">
        <i style="background:${cor}"></i><i style="background:${cor}"></i><i style="background:${cor}"></i>
      </div>
    </div>`;
}

/**
 * Linhas ligando a caixa do topo a cada time (uma curva por time).
 *
 * A geometria toda vive na METADE DE CIMA do quadro de propósito: o template
 * encaixa o título da capa a partir de ~58% da altura, e na primeira versão os
 * mascotes e os rótulos ficavam justamente ali, com "DOCUMENTOS" e "DESIGN"
 * ilegíveis atrás do texto branco.
 */
function linhas() {
  // Origem: base da caixa central (x=540, y=356). Destino: topo de cada mascote.
  const destinos = [175, 405, 675, 905];
  return destinos
    .map((x, i) => {
      const cor = TIMES[i].cor;
      return `<path d="M540 358 C 540 470, ${x} 470, ${x} 560" stroke="${cor}" stroke-width="2.5" fill="none" opacity=".85"/>`;
    })
    .join('');
}

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1350px;font-family:'Ubuntu Mono',monospace;overflow:hidden}
  .art{position:relative;width:1080px;height:1350px;
    background:radial-gradient(120% 78% at 50% 2%, #2d1c52 0%, #1a1030 46%, #0c0917 100%);}

  /* Etiqueta de seção, no lugar do "SKILLS" que a referência usa no topo. */
  .kicker{position:absolute;top:44px;left:0;right:0;text-align:center;
    font-size:26px;font-weight:700;letter-spacing:.42em;color:#7b70a8;}

  /* A caixa do topo é o repositório: nome + estrelas. É a prova de que existe. */
  .repo{position:absolute;top:112px;left:50%;transform:translateX(-50%);
    width:620px;background:#191330;border:1px solid #3b2f66;border-radius:26px;
    padding:34px 30px 30px;text-align:center;
    box-shadow:0 34px 90px rgba(0,0,0,.6), 0 0 0 1px rgba(139,92,246,.10);}
  .repo .marca{display:flex;align-items:center;justify-content:center;gap:16px;}
  .repo .gh{width:52px;height:52px;fill:#e6e2f5;display:block}
  .repo .nome{font-size:46px;font-weight:700;color:#fff;letter-spacing:-.5px}
  .repo .nome b{color:#a78bfa}
  .repo .star{margin-top:20px;display:inline-flex;align-items:center;gap:12px;
    background:#241a44;border:1px solid #453675;border-radius:999px;padding:11px 26px;
    font-size:30px;font-weight:700;color:#f5c518}
  .repo .oficial{margin-top:18px;font-size:25px;color:#9a91bd;letter-spacing:.04em}

  svg.fios{position:absolute;top:0;left:0;width:1080px;height:1350px}

  .times{position:absolute;top:560px;left:0;right:0;display:flex;justify-content:space-between;padding:0 88px}
  .time{width:190px;text-align:center}
  .masc{display:flex;flex-direction:column;align-items:center;gap:5px}
  .corpo{width:86px;height:62px;border-radius:5px;display:flex;align-items:center;justify-content:center;gap:14px}
  .olho{width:16px;height:16px;background:#120e22;border-radius:2px}
  .pernas{display:flex;gap:13px}
  .pernas i{width:14px;height:18px;border-radius:0 0 3px 3px;display:block}
  .time .nm{margin-top:22px;font-size:26px;font-weight:700;letter-spacing:.06em}
  .time .qt{margin-top:7px;font-size:23px;color:#8a81ad}

  /* Escurece a partir de ~50%: o título do template começa em ~58% da altura, e
     o preto precisa já estar chapado quando ele chega. */
  .fade{position:absolute;inset:0;background:linear-gradient(180deg,
    rgba(12,9,23,0) 46%, rgba(12,9,23,.78) 55%, #0c0917 62%)}
</style></head><body>
<div class="art">
  <div class="kicker">AGENT SKILLS</div>

  <div class="repo">
    <div class="marca">
      <svg class="gh" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>
      <div class="nome">anthropics/<b>skills</b></div>
    </div>
    <div class="star">★ 168 mil estrelas</div>
    <div class="oficial">17 skills oficiais da Anthropic</div>
  </div>

  <svg class="fios">${linhas()}</svg>

  <div class="times">
    ${TIMES.map(
      (t) => `<div class="time">
        ${mascote(t.cor)}
        <div class="nm" style="color:${t.cor}">${t.nome}</div>
        <div class="qt">${t.n}</div>
      </div>`,
    ).join('')}
  </div>

  <div class="fade"></div>
</div>
</body></html>`;

(async () => {
  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', 'claude-skills');
  mkdirSync(outDir, { recursive: true });

  const tmp = join(tmpdir(), `arte-claude-skills-${Date.now()}.html`);
  writeFileSync(tmp, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  // Espera a Ubuntu Mono chegar: sem isso a arte sai na fonte de fallback.
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(outDir, 'capa.png') });
  await browser.close();
  console.log('[arte] capa.png em server/carrossel/assets/claude-skills/');
})().catch((e) => {
  console.error('[arte] FALHOU:', e.message);
  process.exit(1);
});
