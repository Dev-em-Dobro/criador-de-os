/**
 * apps/dobro — CAPTURA FRAMES do vídeo de um reels do Instagram, a partir do
 * link, usando a sessão logada (`ig:login`).
 *
 * POR QUE ELE EXISTE (19/08/2026): o `capturar-slides` resolve carrossel, mas num
 * reels ele devolve UM frame só, o `poster`. E o gancho do reels não está na
 * legenda: está no TEXTO NA TELA e na fala dos primeiros segundos. Sem isso a
 * casa lia a legenda ("comenta REPO") e chutava o assunto do post, que é
 * exatamente como uma referência de 10 mil comentários sobre SEO virou, aqui
 * dentro, uma referência sobre memória de código.
 *
 * O QUE ELE FAZ: abre o reel logado, escuta as respostas de rede até achar o
 * arquivo de vídeo no CDN, baixa esse arquivo com os cookies da sessão e corta N
 * frames com ffmpeg. Imprime um JSON com a pasta e os caminhos — quem chama (o
 * Claude Code) lê os frames com visão e transcreve o texto da tela.
 *
 * O QUE ELE NÃO FAZ: transcrever a FALA. O que está só no áudio continua fora do
 * alcance. Frame resolve o texto na tela, que é onde mora o gancho na maioria
 * dos reels de ferramenta.
 *
 * Só roda LOCAL (Playwright + sessão logada + ffmpeg no PATH).
 *
 * Uso:
 *   node server/scripts/capturar-reels.cjs "<url-do-reel>" [quantidade-de-frames]
 *   (via pnpm) pnpm --filter @app/dobro conteudo:capturar-reels "<url>" 10
 */
const { loadChromium, SESSION_PATH } = require('./lib/ig-playwright.cjs');
const { execFileSync } = require('node:child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

/** Quantos frames cortar, quando não vier nada na linha de comando. */
const FRAMES_PADRAO = 8;
/** Teto de espera pela resposta de vídeo do CDN, em ms. */
const ESPERA_VIDEO = 20000;

/**
 * Duração do vídeo em segundos, pelo ffprobe. Serve pra distribuir os frames ao
 * longo do reel inteiro em vez de amontoar no começo. Se o ffprobe não estiver
 * junto do ffmpeg, devolvemos null e o corte cai no modo "1 frame por segundo".
 */
function duracaoDoVideo(arquivo) {
  try {
    const saida = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', arquivo],
      { encoding: 'utf8' },
    );
    const s = Number(String(saida).trim());
    return Number.isFinite(s) && s > 0 ? s : null;
  } catch {
    return null;
  }
}

(async () => {
  const url = (process.argv[2] || '').split('?')[0];
  const quantos = Number(process.argv[3]) || FRAMES_PADRAO;
  if (!url) {
    console.error('uso: capturar-reels "<url-do-reel>" [quantidade-de-frames]');
    process.exit(1);
  }
  if (!fs.existsSync(SESSION_PATH)) {
    console.error('Sem sessão do Instagram. Rode uma vez: pnpm --filter @app/dobro ig:login');
    process.exit(1);
  }

  const chromium = loadChromium();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: SESSION_PATH,
    locale: 'pt-BR',
    viewport: { width: 1180, height: 1500 },
  });
  const page = await ctx.newPage();

  // O player usa MSE: o <video> fica com uma blob: URL, que não dá pra baixar. O
  // arquivo de verdade aparece nas respostas de rede, e é ele que interessa. Um
  // reel costuma servir várias qualidades; ficamos com a MAIOR resposta vista,
  // que é a de melhor resolução.
  const candidatos = new Map();
  page.on('response', (resp) => {
    const u = resp.url();
    if (!/\.mp4/i.test(u)) return;
    const tamanho = Number(resp.headers()['content-length'] || 0);
    // Sem o range na URL o CDN devolve o arquivo inteiro; guardamos a base.
    const base = u.split('&bytestart=')[0].split('&byteend=')[0];
    const anterior = candidatos.get(base) || 0;
    if (tamanho > anterior) candidatos.set(base, tamanho);
  });

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);

  // O modal de cadastro engole o clique de play. Escape resolve os dois casos.
  await page.keyboard.press('Escape').catch(() => {});

  // Dá play: sem tocar, o player nem pede o arquivo. `muted` primeiro, senão o
  // Chromium bloqueia o autoplay com som e o play() rejeita.
  await page
    .evaluate(async () => {
      const v = document.querySelector('video');
      if (!v) return;
      v.muted = true;
      await v.play().catch(() => {});
    })
    .catch(() => {});

  const limite = Date.now() + ESPERA_VIDEO;
  while (!candidatos.size && Date.now() < limite) await page.waitForTimeout(500);

  if (!candidatos.size) {
    await browser.close();
    console.error('[capturar-reels] nenhuma resposta de vídeo apareceu. O post é reels mesmo?');
    process.exit(1);
  }

  const melhor = [...candidatos.entries()].sort((a, b) => b[1] - a[1])[0][0];

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ig-reels-'));
  const mp4 = path.join(outDir, 'reel.mp4');
  const resp = await ctx.request.get(melhor, { timeout: 60000 });
  if (!resp.ok()) {
    await browser.close();
    console.error(`[capturar-reels] o CDN respondeu HTTP ${resp.status()} no arquivo de vídeo.`);
    process.exit(1);
  }
  fs.writeFileSync(mp4, await resp.body());
  await browser.close();

  // Corta os frames distribuídos ao longo do vídeo. O `fps` sai da duração: com
  // 30 segundos e 8 frames, um frame a cada 3,75 segundos.
  const dur = duracaoDoVideo(mp4);
  const fps = dur ? quantos / dur : 1;
  execFileSync(
    'ffmpeg',
    ['-hide_banner', '-loglevel', 'error', '-y', '-i', mp4,
      '-vf', `fps=${fps.toFixed(4)},scale=720:-2`, '-frames:v', String(quantos),
      path.join(outDir, 'frame-%02d.jpg')],
    { stdio: 'inherit' },
  );

  const frames = fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith('frame-'))
    .sort()
    .map((f) => path.join(outDir, f));

  console.log(JSON.stringify({ dir: outDir, video: mp4, duracao: dur, count: frames.length, frames }));
})().catch((e) => {
  console.error('FALHOU:', e instanceof Error ? e.message : e);
  process.exit(1);
});
