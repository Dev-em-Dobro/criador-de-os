/**
 * apps/dobro — renderiza um carrossel no estilo JARVIS e grava o card no board.
 *
 * O que faz, numa tacada:
 *   1. Lê a definição do carrossel em server/carrossel/carrosseis/<slug>.ts.
 *   2. Monta o HTML (template parametrizado) com a imagem de fundo inline.
 *   3. Renderiza cada slide como PNG 1080×1350 (Playwright, deviceScaleFactor 3)
 *      em apps/dobro/public/carrosseis/<slug>/.
 *   4. (Re)grava o card em conteudo_posts com `img+full` em cada slide, então o
 *      preview do board mostra a arte pronta direto. Idempotente (apaga o antigo),
 *      PRESERVANDO data programada e estado de quem já estava no board — quem
 *      manda no agendamento é a tela, não este arquivo.
 *
 * Uso: pnpm --filter @app/dobro carrossel:render <slug>   (ex.: gta6)
 * Requer Playwright chromium instalado (pnpm exec playwright install chromium).
 */

import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inArray } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts } from '../../db/schema';
import { getCarrossel, listSlugs } from '../carrossel/registry';
import { buildHtml } from '../carrossel/template';
import type { Carrossel } from '../carrossel/types';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..', '..'); // apps/dobro

/** Retângulo em pixels do PNG final (1080×1350). */
interface Caixa {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Pauta legível (AIDA) a partir dos slides. */
function montarPauta(car: Carrossel): string {
  const linhas = [`Gancho: ${car.gancho}`];
  car.slides.forEach((s, i) => linhas.push(`Slide ${i + 1} [${s.variant}]: ${s.titulo.replace(/\n/g, ' ')}. ${s.corpo ?? ''}`));
  linhas.push(`CTA: ${car.ctaFinal}`);
  return linhas.join('\n');
}


/**
 * Mime de um arquivo de imagem pela extensão. O mime precisa bater com o
 * conteúdo: com png declarado como jpeg o Chrome até costuma renderizar, mas não
 * é garantido, e webp declarado como jpeg não aparece.
 */
function mimeDe(caminho: string): string {
  const p = caminho.toLowerCase();
  if (p.endsWith('.png')) return 'image/png';
  if (p.endsWith('.webp')) return 'image/webp';
  if (p.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

/**
 * Converte a `dataProgramada` do carrossel em Date.
 *
 * 'YYYY-MM-DD' sozinho o JS lê como UTC, e no nosso fuso (UTC-3) isso joga o card
 * pro dia ANTERIOR: '2026-08-06' virava 05/08 às 21h no board. Ancoramos no
 * meio-dia LOCAL pra a data cair no dia que está escrito no arquivo.
 */
function parseDataProgramada(v: string | undefined): Date | null {
  if (!v) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : new Date(v);
}

async function main(): Promise<void> {
  const slug = process.argv[2];
  if (!slug) {
    console.error(`uso: carrossel:render <slug>   (disponíveis: ${listSlugs().join(', ')})`);
    process.exit(1);
  }
  const car = getCarrossel(slug);
  if (!car) {
    console.error(`[render] carrossel "${slug}" não encontrado. Disponíveis: ${listSlugs().join(', ')}`);
    process.exit(1);
  }

  // Imagem de fundo (capa/sangria) inline como data URI.
  let bgDataUri = '';
  if (car.bgImage) {
    const bgPath = resolve(appRoot, car.bgImage);
    if (!existsSync(bgPath)) {
      console.error(`[render] imagem de fundo ausente: ${bgPath}`);
      process.exit(1);
    }
    bgDataUri = `data:${mimeDe(bgPath)};base64,${readFileSync(bgPath).toString('base64')}`;
  }

  // Imagens por slide (o print em `imagem`, a foto do CTA em `foto`) — cada
  // caminho vira um data URI só uma vez.
  const shots: Record<string, string> = {};
  for (const s of car.slides) {
    for (const rel of [s.imagem, s.foto, s.selo]) {
      if (!rel || shots[rel]) continue;
      const p = resolve(appRoot, rel);
      if (!existsSync(p)) {
        console.error(`[render] imagem de slide ausente: ${p}`);
        process.exit(1);
      }
      shots[rel] = `data:${mimeDe(p)};base64,${readFileSync(p).toString('base64')}`;
    }
  }

  const html = buildHtml(car, bgDataUri, shots);
  const tmpHtml = join(tmpdir(), `carrossel-${slug}.html`);
  writeFileSync(tmpHtml, html, { encoding: 'utf8' });

  const outDir = resolve(appRoot, 'public', 'carrosseis', slug);
  mkdirSync(outDir, { recursive: true });

  const n = car.slides.length;
  console.log(`[render] ${slug}: renderizando ${n} slides (1080×1350)...`);

  /** Onde a janelinha de cada slide com vídeo está, em pixels do PNG final. */
  const caixasDeVideo = new Map<number, Caixa>();
  /** Capa com vídeo: PNG transparente (escurecido + texto) que vai por cima. */
  const overlayPorSlide = new Map<number, string>();

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1680, height: 1120 }, deviceScaleFactor: 3 });
    await page.goto(pathToFileURL(tmpHtml).href, { waitUntil: 'networkidle' });
    await page.evaluate(() => (document as unknown as { fonts: { ready: Promise<unknown> } }).fonts.ready);
    for (let i = 0; i < n; i++) {
      const slide = page.locator('.slide').nth(i);
      await slide.screenshot({ path: join(outDir, `slide-${i + 1}.png`) });

      // Mede a janelinha ENQUANTO a página está aberta: é a única hora em que dá
      // pra saber onde ela caiu, já que o layout é flex e depende do texto acima.
      if (!car.slides[i]?.videoArquivo) continue;

      // CAPA COM VÍDEO: aqui não existe janelinha pra medir. O vídeo é o fundo,
      // entra na caixa declarada em `videoCaixa` e o TEXTO precisa ficar por
      // cima dele. Pra isso o slide é fotografado uma segunda vez sem a arte de
      // fundo e sem cor de fundo nenhuma: sai um PNG transparente com só o
      // escurecido e o texto, que o ffmpeg carimba por último.
      if (car.slides[i]!.cover) {
        const caixa = car.slides[i]!.videoCaixa;
        if (!caixa) {
          console.error(`[render] slide ${i + 1} é capa com vídeo mas não declara \`videoCaixa\`.`);
          process.exit(1);
        }
        caixasDeVideo.set(i, caixa);

        await page.evaluate((idx) => {
          document.body.style.background = 'transparent';
          const el = document.querySelectorAll('.slide')[idx] as HTMLElement;
          el.style.background = 'transparent';
          const arte = el.querySelector('.imgbg') as HTMLElement | null;
          if (arte) arte.style.display = 'none';
        }, i);
        // Vai pro tmp, não pro outDir: é insumo do ffmpeg, e em public/ ele
        // apareceria como se fosse mais um slide do carrossel.
        const overlay = join(tmpdir(), `carrossel-${slug}-overlay-${i + 1}.png`);
        await slide.screenshot({ path: overlay, omitBackground: true });
        overlayPorSlide.set(i, overlay);
        await page.evaluate((idx) => {
          document.body.style.background = '';
          const el = document.querySelectorAll('.slide')[idx] as HTMLElement;
          el.style.background = '';
          const arte = el.querySelector('.imgbg') as HTMLElement | null;
          if (arte) arte.style.display = '';
        }, i);
        continue;
      }

      const bSlide = await slide.boundingBox();
      const bPic = await slide.locator('.shot .pic').boundingBox();
      if (!bSlide || !bPic) {
        console.error(`[render] slide ${i + 1} pede vídeo mas não tem janelinha (falta \`imagem\`?)`);
        process.exit(1);
      }
      // O screenshot sai em deviceScaleFactor 3, então as medidas de CSS px viram
      // px do PNG multiplicando por 3. Par, porque o h264 não aceita ímpar.
      //
      // Canto arredondado pra BAIXO na origem e pra CIMA no tamanho, mais 2px de
      // sangria: sem isso sobra uma fresta de 1 ou 2 px na borda da janelinha, e
      // pela fresta aparece o print parado que está no PNG embaixo do vídeo.
      const parBaixo = (v: number): number => Math.floor(v / 2) * 2;
      const parCima = (v: number): number => Math.ceil(v / 2) * 2;
      const x = parBaixo((bPic.x - bSlide.x) * 3);
      const y = parBaixo((bPic.y - bSlide.y) * 3);
      caixasDeVideo.set(i, {
        x,
        y,
        w: parCima((bPic.x - bSlide.x) * 3 + bPic.width * 3 - x) + 2,
        h: parCima((bPic.y - bSlide.y) * 3 + bPic.height * 3 - y) + 2,
      });
    }
  } finally {
    await browser.close();
  }
  console.log(`[render] ${n} PNGs em public/carrosseis/${slug}/`);

  // Carrossel que ENCOLHEU deixa os arquivos do tamanho antigo pra trás, e eles
  // não somem sozinhos: a pasta é a fonte da verdade na hora de subir no
  // Instagram, então um slide-8.png de duas versões atrás entraria no post.
  for (let k = n + 1; ; k++) {
    const png = join(outDir, `slide-${k}.png`);
    const mp4 = join(outDir, `slide-${k}.mp4`);
    if (!existsSync(png) && !existsSync(mp4)) break;
    if (existsSync(png)) rmSync(png);
    if (existsSync(mp4)) rmSync(mp4);
    console.log(`[render] sobra do render anterior apagada: slide-${k}`);
  }

  // Slides com vídeo viram TAMBÉM um MP4 do slide inteiro, com o vídeo encaixado
  // exatamente onde estava o print. É esse arquivo que sobe no Instagram.
  const mp4PorSlide = new Map<number, string>();
  for (const [i, caixa] of caixasDeVideo) {
    const origem = resolve(appRoot, car.slides[i]!.videoArquivo!);
    if (!existsSync(origem)) {
      console.error(`[render] vídeo do slide ${i + 1} não encontrado: ${origem}`);
      process.exit(1);
    }
    const fundo = join(outDir, `slide-${i + 1}.png`);
    const saida = join(outDir, `slide-${i + 1}.mp4`);
    // `increase` + `crop` reproduz o `background-size:cover` da janelinha: o vídeo
    // preenche a caixa e o que sobra é aparado, em vez de deformar a imagem.
    //
    // Na CAPA entra uma terceira camada: o PNG transparente com o texto, por
    // último, senão o vídeo passa por cima do selo e do título.
    const overlay = overlayPorSlide.get(i);
    const encaixe =
      `[1:v]scale=${caixa.w}:${caixa.h}:force_original_aspect_ratio=increase,` +
      `crop=${caixa.w}:${caixa.h},setsar=1[v];`;
    // O `shortest=1` do segundo overlay não é decoração: o PNG do texto entra com
    // `-loop 1`, então sem ele o overlay repete o último quadro pra sempre, o
    // `-shortest` global nunca dispara e o ffmpeg escreve um mp4 sem fim (o
    // arquivo passou de 37MB e saiu sem moov atom antes disso ser corrigido).
    const filtro = overlay
      ? `${encaixe}[0:v][v]overlay=${caixa.x}:${caixa.y}:shortest=1[base];[base][3:v]overlay=0:0:shortest=1[out]`
      : `${encaixe}[0:v][v]overlay=${caixa.x}:${caixa.y}:shortest=1[out]`;
    // A entrada 2 é uma faixa AAC muda. Vídeo sem trilha nenhuma costuma passar no
    // app, mas trava o processamento assíncrono da API de publicação da Meta sem
    // dizer por quê. Custa alguns KB e elimina a categoria inteira de problema.
    execFileSync(
      'ffmpeg',
      ['-hide_banner', '-loglevel', 'error', '-y',
        '-loop', '1', '-i', fundo, '-i', origem,
        '-f', 'lavfi', '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
        ...(overlay ? ['-loop', '1', '-i', overlay] : []),
        '-filter_complex', filtro, '-map', '[out]', '-map', '2:a',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '64k',
        '-movflags', '+faststart', '-shortest', saida],
      { stdio: 'inherit' },
    );
    mp4PorSlide.set(i, `/carrosseis/${slug}/slide-${i + 1}.mp4`);
    console.log(`[render] slide ${i + 1}: vídeo encaixado em ${caixa.w}x${caixa.h} (${caixa.x},${caixa.y}) → slide-${i + 1}.mp4`);
  }

  // Roteiro com img+full (o preview do board mostra a arte pronta). Onde há vídeo,
  // `mp4` fica junto: é o que precisa subir no lugar do PNG na hora de postar.
  const slidesRoteiro = car.slides.map((s, i) => ({
    ...s,
    img: `/carrosseis/${slug}/slide-${i + 1}.png`,
    full: true,
    ...(mp4PorSlide.has(i) ? { mp4: mp4PorSlide.get(i) } : {}),
  }));

  console.log('[render] gravando o card no board (idempotente)...');

  // O AGENDAMENTO é da tela, não do arquivo. Quem manda na data e no estado é o
  // board (você arrasta o card, marca "pronto"), então um re-render que reescreve
  // a arte NÃO pode devolver o card pra `dataProgramada` do .ts: isso jogava o
  // post pra uma semana passada e ele "sumia" do cronograma, que mostra uma
  // semana por vez. A data do arquivo só vale pra card NOVO.
  const [anterior] = await db
    .select({ dataProgramada: conteudoPosts.dataProgramada, estado: conteudoPosts.estado })
    .from(conteudoPosts)
    .where(inArray(conteudoPosts.titulo, [car.titulo]))
    .limit(1);
  const dataProgramada = anterior?.dataProgramada ?? parseDataProgramada(car.dataProgramada);
  const estado = anterior?.estado ?? 'rascunho';
  if (anterior) {
    // Em UTC, que é como o board lê a data (toDayKey/toTimeStr leem a string ISO).
    // Em horário local o log mostraria o dia anterior às 21h e assustaria à toa.
    const iso = dataProgramada?.toISOString();
    const quando = iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}${iso.slice(11, 16) === '00:00' ? ', sem hora' : ` ${iso.slice(11, 16)}`}` : 'sem data';
    console.log(`[render] card já existia: mantendo agendamento (${quando}) e estado "${estado}".`);
  }

  await db.delete(conteudoPosts).where(inArray(conteudoPosts.titulo, [car.titulo]));
  const [row] = await db
    .insert(conteudoPosts)
    .values({
      titulo: car.titulo,
      estado,
      plataforma: 'instagram',
      formato: 'carrossel',
      dataProgramada,
      capaUrl: `/carrosseis/${slug}/slide-1.png`,
      linkPresenteNotion: car.linkPresente ?? null,
      gancho: car.gancho,
      pauta: montarPauta(car),
      legenda: car.legenda,
      hashtags: car.hashtags,
      ctaFinal: car.ctaFinal,
      briefing: car.briefing ?? null,
      refsLinks: car.refsLinks ?? null,
      roteiro: { formato: 'carrossel', estilo: 'jarvis', slug, slides: slidesRoteiro },
    })
    .returning({ id: conteudoPosts.id });

  console.log(`[render] OK — "${car.titulo}" pronto no board (card ${row?.id}). Dá refresh no /conteudo.`);
}

main().catch((err) => {
  console.error('[render] FALHOU:', err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
