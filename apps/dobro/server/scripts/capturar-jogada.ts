/**
 * apps/dobro — grava a RESOLUÇÃO de uma fase do Flexbox Froggy e devolve GIF + MP4,
 * montados em DOIS PLANOS, como uma edição de vídeo.
 *
 * POR QUE ISSO EXISTE: as capas e slides que performaram mostram o objeto, não a
 * descrição dele. Um print do jogo prova que ele existe; a jogada em movimento
 * mostra a ÚNICA coisa que interessa, que é a linha de CSS mexendo no sapo na
 * hora.
 *
 * OS DOIS PLANOS (é o que faz caber num slide de celular):
 *   Plano 1, fechado no editor: a linha sendo digitada tecla por tecla. Em plano
 *     aberto o código fica pequeno demais pra ler no feed.
 *   Plano 2, fechado no lago: o sapo deslizando até a vitória régia.
 * Os dois planos se SOBREPÕEM no tempo de propósito: o mesmo instante aparece
 * primeiro no código e depois no sapo, que é como se mostra causa e efeito.
 *
 * O ENQUADRAMENTO É MEDIDO, NÃO CHUTADO: o script lê a posição real do editor, do
 * sapo e da vitória régia na página e monta o corte em cima disso, então continua
 * certo se o site mudar o layout.
 *
 * DOIS FORMATOS, PORQUE OS DESTINOS SÃO DIFERENTES:
 *   .gif → presente do Notion e DM. O Notion toca GIF, igual ao da landing do GTA 6.
 *   .mp4 → slide de carrossel. O Instagram NÃO aceita GIF no carrossel; slide
 *          animado tem que ser vídeo, e aí o carrossel vira misto (foto + vídeo).
 *
 * Requer ffmpeg no PATH e Playwright chromium instalado.
 *
 * Uso (de dentro de apps/dobro):
 *   npx tsx server/scripts/capturar-jogada.ts [pasta] [nome] [largura] [altura]
 *   ex.: npx tsx server/scripts/capturar-jogada.ts css-jogos froggy-nivel1-zoom
 *   ex.: ...capturar-jogada.ts css-jogos froggy-nivel1-slide 984 796   (medida da
 *        janelinha do slide, que o `carrossel:render` imprime)
 * Saída: server/carrossel/assets/<pasta>/<nome>.gif e .mp4
 */

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..', '..'); // apps/dobro

/** O que vamos jogar. Trocar isto é o que muda a fase capturada. */
const JOGO = {
  url: 'https://flexboxfroggy.com/',
  /**
   * Resposta da fase 1, quebrada em duas partes de propósito: o jogo aplica o CSS
   * a cada tecla, então o sapo anda no instante em que "flex-end" fica completo.
   * Separar dá o timestamp exato do movimento, que é onde o plano 2 começa.
   */
  solucaoAteMover: 'justify-content: flex-end',
  solucaoResto: ';',
  /** Campo onde a pessoa escreve o CSS. */
  editor: '#code',
};

const VIEWPORT = { width: 1280, height: 800 };
/** Devagar o bastante pra dar pra LER o que está sendo digitado. */
const DELAY_TECLA_MS = 95;
/** Depois da última tecla: o sapo termina de deslizar e o jogo comemora. */
const ESPERA_ANIMACAO_MS = 2600;
/**
 * Proporção de saída dos dois planos (têm que ser igual, senão o corte "pula").
 * Dá pra mandar outra pela linha de comando: quando o destino é a janelinha de um
 * slide, o vídeo precisa NASCER na proporção dela, senão o `cover` do render apara
 * as laterais e come justo o começo da linha e a arrancada do sapo.
 */
const SAIDA = {
  w: Number(process.argv[4]) || 1080,
  h: Number(process.argv[5]) || 540,
};

/** Hosts de publicidade e medição. Sem isso o anúncio aparece no quadro. */
const BLOQUEADOS = [
  'googlesyndication',
  'doubleclick',
  'googletagservices',
  'google-analytics',
  'googletagmanager',
  'adservice',
  'ezoic',
  'carbonads',
];

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function ffmpeg(args: string[]): void {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });
}

/**
 * Transforma a área de interesse num corte com a proporção da saída, com folga em
 * volta, preso dentro de `limite` e em números pares (o h264 exige).
 *
 * O `limite` importa: enquadrando o sapo sem ele, o corte encosta na borda direita
 * do vídeo e entra barra verde da coluna do editor no quadro. Passando o tabuleiro
 * como limite, o plano fica dentro do lago.
 */
function enquadrar(alvo: Rect, folga: number, limite: Rect): Rect {
  const proporcao = SAIDA.w / SAIDA.h;
  let w = alvo.w + folga * 2;
  let h = alvo.h + folga * 2;
  // Cresce o lado que falta até bater a proporção (nunca corta o alvo).
  if (w / h < proporcao) w = h * proporcao;
  else h = w / proporcao;

  // Não pode passar do limite: se passar, encolhe mantendo a proporção.
  if (w > limite.w) {
    w = limite.w;
    h = w / proporcao;
  }
  if (h > limite.h) {
    h = limite.h;
    w = h * proporcao;
  }

  const centroX = alvo.x + alvo.w / 2;
  const centroY = alvo.y + alvo.h / 2;
  const x = Math.min(Math.max(limite.x, centroX - w / 2), limite.x + limite.w - w);
  const y = Math.min(Math.max(limite.y, centroY - h / 2), limite.y + limite.h - h);

  const par = (n: number): number => Math.floor(n / 2) * 2;
  return { x: par(x), y: par(y), w: par(w), h: par(h) };
}

/** Menor retângulo que contém todos os informados. */
function unir(rects: Rect[]): Rect {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const x2 = Math.max(...rects.map((r) => r.x + r.w));
  const y2 = Math.max(...rects.map((r) => r.y + r.h));
  return { x, y, w: x2 - x, h: y2 - y };
}

async function main(): Promise<void> {
  const pasta = process.argv[2] ?? 'css-jogos';
  const nome = process.argv[3] ?? 'froggy-nivel1-zoom';

  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', pasta);
  mkdirSync(outDir, { recursive: true });
  const videoDir = join(tmpdir(), `jogada-${nome}`);
  rmSync(videoDir, { recursive: true, force: true });
  mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: VIEWPORT },
  });
  const t0 = Date.now();

  const page = await ctx.newPage();
  await page.route('**/*', (route) => {
    const url = route.request().url();
    return BLOQUEADOS.some((h) => url.includes(h)) ? route.abort() : route.continue();
  });

  await page.goto(JOGO.url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  // O que sobrar de anúncio vira espaço em branco em vez de banner piscando.
  await page.addStyleTag({
    content: 'ins.adsbygoogle, iframe, #ad, .ad, [id^="google_ads"] { display: none !important; }',
  });
  await page.waitForSelector(JOGO.editor, { timeout: 30_000 });
  await page.waitForTimeout(1500); // fonte e animação de entrada assentarem

  // Onde as coisas ESTÃO de fato nesta página, agora.
  // Sem função auxiliar aqui dentro de propósito: o tsx injeta um helper (`__name`)
  // em função declarada dentro do evaluate, e esse helper não existe no navegador.
  const medidos = await page.evaluate((sels: string[]) => {
    const out: Record<string, { x: number; y: number; w: number; h: number } | null> = {};
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (!el) {
        out[sel] = null;
        continue;
      }
      const b = el.getBoundingClientRect();
      out[sel] = { x: b.x, y: b.y, w: b.width, h: b.height };
    }
    return out;
  }, ['#editor', '.frog', '.lilypad', '#board']);

  const medidas = {
    editor: medidos['#editor'],
    frog: medidos['.frog'],
    lily: medidos['.lilypad'],
    board: medidos['#board'],
  };
  if (!medidas.editor || !medidas.board) throw new Error('não achei o editor ou o tabuleiro na página');

  // A gravação útil começa aqui: o que veio antes é carregamento e vai ser cortado.
  const tClique = Date.now();
  await page.click(JOGO.editor);
  await page.waitForTimeout(400);
  await page.type(JOGO.editor, JOGO.solucaoAteMover, { delay: DELAY_TECLA_MS });
  const tMovimento = Date.now(); // aqui o CSS fica válido e o sapo sai do lugar
  await page.type(JOGO.editor, JOGO.solucaoResto, { delay: DELAY_TECLA_MS });
  const tFimDigitacao = Date.now();
  await page.waitForTimeout(ESPERA_ANIMACAO_MS);
  const tFim = Date.now();

  const video = page.video();
  await ctx.close(); // fecha o contexto pra o WebM ser finalizado em disco
  await browser.close();

  const webm = video ? await video.path() : readdirSync(videoDir).map((f) => join(videoDir, f))[0];
  if (!webm || !existsSync(webm)) throw new Error('o Playwright não gravou o vídeo');

  const seg = (t: number): number => (t - t0) / 1000;

  const telaInteira: Rect = { x: 0, y: 0, w: VIEWPORT.width, h: VIEWPORT.height };

  // Plano 1: o editor, do clique até um respiro depois da linha pronta.
  const corte1 = enquadrar(medidas.editor, 24, telaInteira);
  const p1 = { inicio: Math.max(0, seg(tClique) - 0.3), fim: seg(tFimDigitacao) + 0.7 };

  // Plano 2: a pista do sapo (dele até a vitória régia), voltando um pouco no
  // tempo pra pegar a arrancada. Sem os dois medidos, cai no tabuleiro inteiro.
  const pista =
    medidas.frog && medidas.lily ? unir([medidas.frog, medidas.lily]) : medidas.board;
  const corte2 = enquadrar(pista, 60, medidas.board);
  const p2 = { inicio: Math.max(0, seg(tMovimento) - 0.6), fim: seg(tFim) };

  // `setsar=1` nos dois planos não é enfeite: os cortes têm proporções um pouco
  // diferentes, o scale devolve pixel não quadrado, e o concat recusa juntar dois
  // trechos com SAR diferente ("parameters do not match").
  const filtro =
    `[0:v]trim=${p1.inicio.toFixed(2)}:${p1.fim.toFixed(2)},setpts=PTS-STARTPTS,` +
    `crop=${corte1.w}:${corte1.h}:${corte1.x}:${corte1.y},scale=${SAIDA.w}:${SAIDA.h}:flags=lanczos,setsar=1[v1];` +
    `[0:v]trim=${p2.inicio.toFixed(2)}:${p2.fim.toFixed(2)},setpts=PTS-STARTPTS,` +
    `crop=${corte2.w}:${corte2.h}:${corte2.x}:${corte2.y},scale=${SAIDA.w}:${SAIDA.h}:flags=lanczos,setsar=1[v2];` +
    `[v1][v2]concat=n=2:v=1[out]`;

  const mp4 = join(outDir, `${nome}.mp4`);
  const gif = join(outDir, `${nome}.gif`);

  ffmpeg([
    '-i', webm,
    '-filter_complex', filtro,
    '-map', '[out]',
    '-r', '30',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    '-an', mp4,
  ]);

  // GIF sai do MP4 já montado, então os dois mostram exatamente a mesma edição.
  // Paleta própria (palettegen/paletteuse), senão o verde do jogo sai em faixas.
  ffmpeg([
    '-i', mp4,
    '-vf', 'fps=12,scale=760:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3',
    '-loop', '0', gif,
  ]);

  rmSync(videoDir, { recursive: true, force: true });
  console.log('[jogada] OK');
  console.log(`  plano 1 (editor): ${corte1.w}x${corte1.h} em ${corte1.x},${corte1.y} · ${(p1.fim - p1.inicio).toFixed(1)}s`);
  console.log(`  plano 2 (sapo):   ${corte2.w}x${corte2.h} em ${corte2.x},${corte2.y} · ${(p2.fim - p2.inicio).toFixed(1)}s`);
  console.log(`  GIF: server/carrossel/assets/${pasta}/${nome}.gif`);
  console.log(`  MP4: server/carrossel/assets/${pasta}/${nome}.mp4`);
}

main().catch((err) => {
  console.error('[jogada] FALHOU:', err instanceof Error ? (err.stack ?? err.message) : err);
  process.exit(1);
});
