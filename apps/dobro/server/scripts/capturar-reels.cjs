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
 * O QUE ELE FAZ: abre o reel logado, escuta as respostas de rede até achar os
 * arquivos no CDN, baixa com os cookies da sessão, corta N frames com ffmpeg,
 * monta TIRAS com a legenda queimada e tenta transcrever a fala. Imprime um JSON
 * com a pasta e os caminhos — quem chama (o Claude Code) lê tudo com visão.
 *
 * As TIRAS (`legendas`) são o que resolve na prática: cada imagem empilha 8
 * recortes da faixa de legenda, então 6 imagens cobrem 110 segundos de fala. Os
 * `frames` cheios servem pra ver a CENA (enquadramento, cenário, gestos).
 *
 * POR QUE ELE TRANSCREVE (20/08/2026): num reels de "yap" (a pessoa falando pra
 * câmera) o conteúdo inteiro está na FALA, e os frames só mostram a legenda
 * queimada de um instante. Amostrando 14 frames num vídeo de 110 segundos sobra
 * um buraco de 8 segundos entre um e outro, e é justamente aí que o método que a
 * gente queria copiar costuma estar.
 *
 * O CDN serve vídeo e áudio em arquivos SEPARADOS (DASH). Pegar só o maior mp4
 * devolve a faixa de vídeo, sem áudio nenhum — por isso baixamos todos os
 * candidatos e perguntamos ao ffprobe quem é quem.
 *
 * Só roda LOCAL (Playwright + sessão logada + ffmpeg no PATH). A transcrição
 * ainda precisa do `auto-editor` e de um modelo ggml do whisper; sem eles o
 * script segue normalmente e devolve `transcricao: null`.
 *
 * Uso:
 *   node server/scripts/capturar-reels.cjs "<url-do-reel>" [quantidade-de-frames]
 *   (via pnpm) pnpm --filter @app/dobro conteudo:capturar-reels "<url>" 10
 *
 * Variáveis de ambiente:
 *   WHISPER_MODEL   caminho do .bin do whisper (default: procura em
 *                   ~/.local/share/whisper-models/)
 *   SEM_TRANSCRICAO =1 pula a transcrição (é a etapa lenta)
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
/** Quantos candidatos baixar pra descobrir quem tem vídeo e quem tem áudio. */
const MAX_CANDIDATOS = 4;
/** Modelos aceitos, do melhor pro mais leve. */
const MODELOS_WHISPER = ['ggml-large-v3.bin', 'ggml-medium.bin', 'ggml-small.bin', 'ggml-base.bin'];

/** Streams de um arquivo, pelo ffprobe: diz se tem vídeo, áudio e a duração. */
function sondar(arquivo) {
  try {
    const saida = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'stream=codec_type', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', arquivo],
      { encoding: 'utf8' },
    );
    const linhas = String(saida).trim().split(/\r?\n/);
    return {
      video: linhas.includes('video'),
      audio: linhas.includes('audio'),
      duracao: linhas.map(Number).find((n) => Number.isFinite(n) && n > 0) ?? null,
    };
  } catch {
    return { video: false, audio: false, duracao: null };
  }
}

/** Primeiro modelo ggml que existir, ou null. Respeita WHISPER_MODEL. */
function acharModeloWhisper() {
  if (process.env.WHISPER_MODEL) {
    return fs.existsSync(process.env.WHISPER_MODEL) ? process.env.WHISPER_MODEL : null;
  }
  const base = path.join(os.homedir(), '.local', 'share', 'whisper-models');
  for (const nome of MODELOS_WHISPER) {
    const p = path.join(base, nome);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Recorta a faixa da legenda queimada ao longo do vídeo e empilha 8 recortes por
 * imagem. Amostra a cada ~2,4 segundos, que é mais curto que a duração de um
 * bloco de legenda: nenhuma fala escapa. As medidas assumem o quadro 720x1280 do
 * reels, com a legenda entre 59% e 77% da altura.
 */
function recortarLegendas(arquivoVideo, outDir, duracao) {
  if (!duracao) return [];
  const fps = 0.42;
  const paginas = Math.ceil((duracao * fps) / 8);
  try {
    execFileSync(
      'ffmpeg',
      ['-hide_banner', '-loglevel', 'error', '-y', '-i', arquivoVideo,
        '-vf', `fps=${fps},scale=720:-2,crop=720:230:0:755,tile=1x8`,
        '-frames:v', String(paginas),
        path.join(outDir, 'legenda-%02d.jpg')],
      { stdio: 'inherit' },
    );
  } catch {
    return [];
  }
  return fs
    .readdirSync(outDir)
    .filter((f) => f.startsWith('legenda-'))
    .sort()
    .map((f) => path.join(outDir, f));
}

/**
 * Transcreve a fala em português. Devolve o texto ou null quando a ferramenta,
 * o modelo ou o áudio não estão disponíveis — transcrição é bônus, nunca
 * bloqueia a captura dos frames.
 */
function transcrever(arquivoComAudio) {
  if (process.env.SEM_TRANSCRICAO === '1' || !arquivoComAudio) return null;
  const modelo = acharModeloWhisper();
  if (!modelo) return null;
  try {
    // stderr silenciado: quando o ffmpeg do auto-editor vem sem o filtro whisper
    // ele grita, e esse grito não é problema de quem só queria os frames.
    return execFileSync('auto-editor', ['whisper', arquivoComAudio, modelo, '-l', 'pt'], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null;
  } catch {
    return null;
  }
}

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
  // reel serve várias qualidades de VÍDEO e, separado, a faixa de ÁUDIO. Guardamos
  // todos e o ffprobe decide quem é quem depois do download.
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

  // Espera as respostas aparecerem. Vídeo e áudio chegam em momentos diferentes,
  // então não paramos no primeiro: seguimos até o teto de espera pra dar chance
  // da faixa de áudio também entrar na lista.
  const limite = Date.now() + ESPERA_VIDEO;
  while (Date.now() < limite && candidatos.size < 2) await page.waitForTimeout(500);

  if (!candidatos.size) {
    await browser.close();
    console.error('[capturar-reels] nenhuma resposta de vídeo apareceu. O post é reels mesmo?');
    process.exit(1);
  }

  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ig-reels-'));
  const ordenados = [...candidatos.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_CANDIDATOS);

  // Baixa cada candidato e pergunta ao ffprobe o que tem dentro. O maior com
  // vídeo vira a fonte dos frames; o primeiro com áudio vira a fonte da fala.
  const baixados = [];
  for (const [url] of ordenados) {
    const destino = path.join(outDir, `fonte-${baixados.length + 1}.mp4`);
    const resp = await ctx.request.get(url, { timeout: 60000 });
    if (!resp.ok()) continue;
    fs.writeFileSync(destino, await resp.body());
    baixados.push({ arquivo: destino, ...sondar(destino) });
  }
  await browser.close();

  const fonteVideo = baixados.find((b) => b.video);
  const fonteAudio = baixados.find((b) => b.audio);
  if (!fonteVideo) {
    console.error('[capturar-reels] baixei os arquivos mas nenhum tem faixa de vídeo.');
    process.exit(1);
  }

  const mp4 = fonteVideo.arquivo;
  const dur = fonteVideo.duracao ?? duracaoDoVideo(mp4);

  // Corta os frames distribuídos ao longo do vídeo. O `fps` sai da duração: com
  // 30 segundos e 8 frames, um frame a cada 3,75 segundos.
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

  // TIRAS de legenda: recorta só a faixa onde mora a legenda queimada e empilha
  // 8 recortes por imagem. É o caminho que REALMENTE funciona pra recuperar a
  // fala inteira quando o whisper não está disponível: 6 imagens cobrem 110
  // segundos de conversa, contra 14 frames cheios que deixam buracos de 8s.
  const tiras = recortarLegendas(mp4, outDir, dur);

  const transcricao = transcrever(fonteAudio?.arquivo);
  if (transcricao) fs.writeFileSync(path.join(outDir, 'fala.txt'), transcricao, 'utf8');

  console.log(
    JSON.stringify({
      dir: outDir,
      video: mp4,
      audio: fonteAudio?.arquivo ?? null,
      duracao: dur,
      count: frames.length,
      frames,
      legendas: tiras,
      transcricao,
    }),
  );
})().catch((e) => {
  console.error('FALHOU:', e instanceof Error ? e.message : e);
  process.exit(1);
});
