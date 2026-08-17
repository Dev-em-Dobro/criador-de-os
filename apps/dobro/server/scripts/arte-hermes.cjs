/**
 * apps/dobro — gera a ARTE da capa do carrossel "hermes" (Um JARVIS que aprende
 * sozinho).
 *
 * O padrão das capas campeãs é o objeto em tela cheia com o texto no rodapé (ver
 * memória capas-carrossel-padrao). Aqui o objeto não é a ferramenta, é a PROVA
 * dela: a conversa que chega sozinha no seu celular às 7h da manhã, sem você
 * abrir nada. É o item sensorial declarado no briefing do post (o "2 palmas" do
 * JARVIS) e é o que dá vontade de testar hoje.
 *
 * O terço de baixo escurece de propósito: é onde o template encaixa o selo do
 * quadro, o título, o subtítulo e a dica de swipe.
 *
 * O texto da conversa é ILUSTRATIVO, escrito por nós. Não é print de sessão real
 * e não afirma número nenhum sobre ferramenta de terceiro. O que ele mostra (o
 * agendador que roda sem ninguém pedir na hora, e a conversa por mensageiro) está
 * no README da fonte primária, lido em 15/08/2026.
 *
 * NÃO aparece endereço nem comando de instalação, de propósito: é a alavanca do
 * CTA do post inteiro (ver memória carrossel-lacuna-do-endereco).
 *
 * Uso: node server/scripts/arte-hermes.cjs
 * Saída: server/carrossel/assets/hermes/capa.png (1080×1350)
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
  /* Mesmo gradiente do fallback JARVIS do template: a arte e o rodapé viram a
     mesma peça, sem emenda visível. */
  .art{position:relative;width:1080px;height:1350px;
    background:radial-gradient(120% 90% at 70% 15%,#2a1650 0%,#140a26 55%,#070410 100%);}

  /* A tela sangra pelo topo: o aparelho não cabe inteiro nos 45% úteis, então a
     gente mostra o CLOSE da conversa, que é o que interessa. */
  .fone{position:absolute;top:-18px;left:96px;width:888px;height:900px;
    background:#0b1a24;border:14px solid #1c1730;border-radius:64px;overflow:hidden;
    box-shadow:0 60px 130px rgba(0,0,0,.8), 0 0 0 1px rgba(139,92,246,.18);}

  /* A hora aqui é a mesma da mensagem: quem olha entende que ela chegou antes de
     a pessoa pegar o celular. */
  .status{height:66px;display:flex;align-items:flex-end;justify-content:space-between;
    padding:0 44px 6px;font-size:26px;color:#cfe3f2;letter-spacing:.02em}
  .sinal{display:flex;gap:8px;align-items:flex-end}
  .bar{width:7px;background:#cfe3f2;border-radius:2px}

  .topo{display:flex;align-items:center;gap:20px;padding:14px 34px 18px;
    background:#12222e;border-bottom:1px solid #1d3543}
  .av{width:78px;height:78px;border-radius:50%;flex:none;
    background:linear-gradient(150deg,#8b5cf6,#5b21b6);
    display:flex;align-items:center;justify-content:center;
    font-size:40px;font-weight:700;color:#fff}
  .nome{font-size:34px;font-weight:700;color:#eef6ff;line-height:1.15}
  .estado{font-size:22px;color:#7fd4a8;margin-top:4px}

  .chat{padding:26px 34px 0;display:flex;flex-direction:column;gap:18px}
  .dia{align-self:center;background:rgba(255,255,255,.08);color:#bcd4e4;
    font-size:20px;letter-spacing:.16em;padding:9px 22px;border-radius:999px;margin-bottom:6px}
  .msg{max-width:80%;align-self:flex-start;background:#1a2b38;border:1px solid #24404f;
    border-radius:22px;border-bottom-left-radius:8px;padding:22px 26px 16px;
    font-size:29px;line-height:1.42;color:#eaf3fb;position:relative}
  .hora{display:block;text-align:right;font-size:20px;color:#8fb0c6;margin-top:10px}
  .destaque{color:#c4b5fd;font-weight:700}

  /* O escurecido começa antes da metade porque o selo do quadro entra em ~48%. */
  /* O escurecido só começa DEPOIS da segunda bolha (ela termina em ~44% da
     altura): na 1ª versão o gradiente subia até 26% e comia o texto dela. Em 51%
     já está quase sólido, que é onde o selo do quadro encosta. */
  .fade{position:absolute;inset:0;background:linear-gradient(180deg,
    rgba(7,4,16,0) 40%, rgba(7,4,16,.45) 46%, rgba(7,4,16,.88) 51%, #070410 56%)}
</style></head><body>
<div class="art">
  <div class="fone">
    <div class="status">
      <span>7:00</span>
      <span class="sinal">
        <span class="bar" style="height:12px"></span>
        <span class="bar" style="height:18px"></span>
        <span class="bar" style="height:24px"></span>
        <span class="bar" style="height:30px"></span>
      </span>
    </div>
    <div class="topo">
      <div class="av">H</div>
      <div>
        <div class="nome">Hermes</div>
        <div class="estado">ligado no seu computador</div>
      </div>
    </div>
    <div class="chat">
      <div class="dia">HOJE</div>
      <div class="msg">
        Bom dia. Rodei o relatório <span class="destaque">enquanto você dormia</span>.
        <span class="hora">7:00</span>
      </div>
      <div class="msg">
        3 tarefas fecharam ontem, 1 travou. Resolvo agora?
        <span class="hora">7:00</span>
      </div>
    </div>
  </div>
  <div class="fade"></div>
</div>
</body></html>`;

(async () => {
  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', 'hermes');
  mkdirSync(outDir, { recursive: true });

  const tmp = join(tmpdir(), `arte-hermes-${Date.now()}.html`);
  writeFileSync(tmp, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: join(outDir, 'capa.png') });
  await browser.close();
  console.log('[arte] capa.png em server/carrossel/assets/hermes/');
})().catch((e) => {
  console.error('[arte] FALHOU:', e.message);
  process.exit(1);
});
