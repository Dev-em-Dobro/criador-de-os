/**
 * apps/dobro — busca o conteúdo REAL de um post do Instagram (legenda, formato,
 * métricas, thumbnail) para o pipeline poder analisar a referência de verdade.
 *
 * O Instagram não expõe o conteúdo de forma confiável sem autenticação (a página
 * pública não traz mais tags OpenGraph úteis). Então:
 *  - PRIMÁRIO: Apify (actor de Instagram) via REST — precisa de APIFY_TOKEN.
 *    Retorna legenda, tipo (Image/Video/Sidecar), curtidas, comentários, etc.
 *  - FALLBACK: raspagem best-effort de og:/ld+json (frágil; costuma vir vazio).
 *
 * Graceful degradation: sem token e sem og, retorna vazio — o pipeline segue
 * (só sem o teardown embasado). Nunca lança para não derrubar a geração.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { getApifyToken } from './env';

const execFileP = promisify(execFile);

export interface IgContent {
  caption: string | null;
  /** Formato inferido do tipo de mídia. */
  formato: 'carrossel' | 'reels' | 'imagem' | null;
  /** Nº de mídias (slides do carrossel). */
  mediaCount: number | null;
  likes: number | null;
  comments: number | null;
  thumbnailUrl: string | null;
  autor: string | null;
  fonte: 'ytdlp' | 'apify' | 'opengraph' | null;
}

const EMPTY: IgContent = {
  caption: null,
  formato: null,
  mediaCount: null,
  likes: null,
  comments: null,
  thumbnailUrl: null,
  autor: null,
  fonte: null,
};

/** Actor do Apify (sobrescrevível por env). Default: o Instagram Scraper oficial. */
const APIFY_ACTOR = process.env.APIFY_IG_ACTOR?.trim() || 'apify~instagram-scraper';

export async function fetchInstagramContent(url: string): Promise<IgContent> {
  // 1) yt-dlp (GRÁTIS, sem login) — legenda + métricas + autor. Provider primário.
  try {
    const viaYt = await viaYtDlp(url);
    if (viaYt && (viaYt.caption || viaYt.likes != null)) return viaYt;
  } catch (err) {
    console.warn('[instagram] yt-dlp falhou:', err instanceof Error ? err.message : err);
  }
  // 2) Apify (PAGO) — fallback robusto quando o yt-dlp não achar (token opcional).
  const token = getApifyToken();
  if (token) {
    try {
      const viaApi = await viaApify(url, token);
      if (viaApi) return viaApi;
    } catch (err) {
      console.warn('[instagram] apify falhou:', err instanceof Error ? err.message : err);
    }
  }
  // 3) OpenGraph — último recurso (costuma vir vazio hoje).
  try {
    return await viaOpenGraph(url);
  } catch (err) {
    console.warn('[instagram] og fallback falhou:', err instanceof Error ? err.message : err);
    return EMPTY;
  }
}

/** Executa o yt-dlp (tentando variações do binário); devolve stdout ou null se ausente. */
async function tryYtDlp(args: string[]): Promise<string | null> {
  const cmds = [process.env.YTDLP_PATH, 'yt-dlp', 'yt-dlp.exe'].filter((c): c is string => !!c);
  for (const cmd of cmds) {
    try {
      const { stdout } = await execFileP(cmd, args, { maxBuffer: 32 * 1024 * 1024, windowsHide: true });
      return stdout;
    } catch (err) {
      const e = err as { code?: string; stdout?: string };
      if (e.code === 'ENOENT') continue; // binário não encontrado — tenta a próxima variação
      if (e.stdout) return e.stdout; // saiu != 0 (ex.: slide de imagem) mas emitiu o JSON
      throw err;
    }
  }
  return null; // yt-dlp não está instalado
}

/** Provider grátis: yt-dlp extrai legenda/métricas/autor do post público (sem login). */
async function viaYtDlp(url: string): Promise<IgContent | null> {
  const base = url.split('?')[0]; // sem query string (evita problemas de arg)
  const out = await tryYtDlp(['--dump-single-json', '--skip-download', '--no-warnings', base]);
  if (!out) return null;

  let j: Record<string, unknown>;
  try {
    j = JSON.parse(out) as Record<string, unknown>;
  } catch {
    return null;
  }

  const isPlaylist = j._type === 'playlist' || Array.isArray(j.entries);
  const count =
    (typeof j.playlist_count === 'number' && j.playlist_count) ||
    (typeof j.n_entries === 'number' && j.n_entries) ||
    (Array.isArray(j.entries) ? j.entries.length : null);
  const formato: IgContent['formato'] = isPlaylist ? 'carrossel' : j.vcodec || j.ext === 'mp4' ? 'reels' : 'imagem';
  const caption =
    typeof j.description === 'string' ? j.description : typeof j.title === 'string' ? j.title : null;

  return {
    caption,
    formato,
    mediaCount: typeof count === 'number' ? count : null,
    likes: typeof j.like_count === 'number' ? j.like_count : null,
    comments: typeof j.comment_count === 'number' ? j.comment_count : null,
    thumbnailUrl: typeof j.thumbnail === 'string' ? j.thumbnail : null,
    autor:
      (typeof j.channel === 'string' && j.channel) ||
      (typeof j.uploader === 'string' && j.uploader) ||
      null,
    fonte: 'ytdlp',
  };
}

/** Roda o actor do Apify de forma síncrona e mapeia o 1º item. */
async function viaApify(url: string, token: string): Promise<IgContent | null> {
  const endpoint = `https://api.apify.com/v2/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ directUrls: [url], resultsType: 'posts', resultsLimit: 1, addParentData: false }),
  });
  if (!res.ok) throw new Error(`apify HTTP ${res.status}`);
  const items = (await res.json()) as Array<Record<string, unknown>>;
  const p = items?.[0];
  if (!p) return null;

  const type = String(p.type ?? '');
  const formato =
    type === 'Sidecar' ? 'carrossel' : type === 'Video' ? 'reels' : type === 'Image' ? 'imagem' : null;
  const childPosts = Array.isArray(p.childPosts) ? p.childPosts.length : null;
  const images = Array.isArray(p.images) ? p.images.length : null;

  return {
    caption: typeof p.caption === 'string' ? p.caption : null,
    formato,
    mediaCount: childPosts ?? images,
    likes: typeof p.likesCount === 'number' ? p.likesCount : null,
    comments: typeof p.commentsCount === 'number' ? p.commentsCount : null,
    thumbnailUrl: typeof p.displayUrl === 'string' ? p.displayUrl : null,
    autor: typeof p.ownerUsername === 'string' ? p.ownerUsername : null,
    fonte: 'apify',
  };
}

/** Fallback sem token: tenta og: e ld+json (best-effort; costuma falhar hoje). */
async function viaOpenGraph(url: string): Promise<IgContent> {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
      'accept-language': 'pt-BR,pt;q=0.9',
    },
  });
  const html = await res.text();

  const og = (prop: string): string | null => {
    const m =
      html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']*)["']`, 'i')) ??
      html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:${prop}["']`, 'i'));
    return m?.[1] ? decodeHtml(m[1]) : null;
  };

  let caption = og('description');
  // Segunda tentativa: JSON-LD com "caption" ou "articleBody".
  if (!caption) {
    const ld = html.match(/"(?:caption|articleBody)"\s*:\s*"((?:[^"\\]|\\.)*)"/i);
    if (ld?.[1]) caption = decodeHtml(ld[1].replace(/\\"/g, '"'));
  }

  return {
    ...EMPTY,
    caption,
    thumbnailUrl: og('image'),
    autor: og('title'),
    fonte: caption || og('image') ? 'opengraph' : null,
  };
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&#x27;/gi, "'")
    .replace(/\\n/g, '\n');
}
