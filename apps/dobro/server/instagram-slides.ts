/**
 * apps/dobro — LÊ o conteúdo de dentro dos slides de um carrossel do Instagram.
 *
 * O problema que isto resolve: `instagram.ts` traz legenda, métricas e thumbnail.
 * Mas num CARROSSEL o conteúdo está DENTRO das imagens, e a legenda costuma ser só
 * isca ("comenta X que eu mando"). Sem ler os slides, o pipeline gerava rascunho a
 * partir de hashtags e chutava o tema (foi o que aconteceu com o post do design lab:
 * o carrossel era "5 free sites that make your website look expensive" e o rascunho
 * saiu "Portfólio dev de graça no Claude Code").
 *
 * Como funciona: `scripts/capturar-slides.cjs` abre o post com a sessão logada
 * (Playwright), navega slide a slide e baixa as imagens originais do CDN; aqui a
 * gente manda essas imagens para a Claude LER (visão nativa, sem OCR) e devolve a
 * transcrição em texto, que vira o `conteudo_bruto` da referência.
 *
 * SÓ RODA LOCAL. Playwright e a sessão logada não existem na function da Vercel, e
 * é assim de propósito: na nuvem esta função devolve `null` e o pipeline segue com
 * a legenda, exatamente como antes. Quem quiser o teardown bom roda os scripts
 * admin no PC (`conteudo:processar`, `conteudo:gerar-url`).
 */

import { execFile } from 'node:child_process';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';

const execFileP = promisify(execFile);

/** Sessão logada do Instagram, salva por `ig:login` (gitignored). */
const SESSION_PATH = fileURLToPath(new URL('../.ig-session.json', import.meta.url));
const SCRIPT_PATH = fileURLToPath(new URL('./scripts/capturar-slides.cjs', import.meta.url));

/** Teto de tempo da captura (abrir o post + navegar todos os slides). */
const TIMEOUT_CAPTURA_MS = 180_000;

/** Modelo que lê as imagens. Transcrição é tarefa mecânica: efeito baixo basta. */
const MODELO_LEITURA = 'claude-opus-5';

/** Saída do script de captura. */
interface CapturaResult {
  dir: string;
  coletadas: number;
  count: number;
  slides: string[];
}

/** Tipos de imagem que a API aceita, mapeados pela extensão do arquivo. */
const MEDIA_TYPES: Record<string, 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif'> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Diz se dá pra ler slides neste ambiente. Barra a Vercel de cara (lá não há
 * navegador nem sessão) e evita pagar o custo de tentar quando não há login.
 */
export function podeLerSlides(): boolean {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
  return existsSync(SESSION_PATH) && existsSync(SCRIPT_PATH);
}

/** Roda o script de captura e devolve os caminhos das imagens baixadas. */
async function capturarSlides(url: string): Promise<CapturaResult | null> {
  const { stdout } = await execFileP('node', [SCRIPT_PATH, url], {
    timeout: TIMEOUT_CAPTURA_MS,
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  // O script imprime diagnóstico em stderr e o JSON na última linha do stdout.
  const linha = stdout.trim().split('\n').pop();
  if (!linha) return null;
  const r = JSON.parse(linha) as CapturaResult;
  return r.slides?.length ? r : null;
}

/** Monta os blocos de imagem (base64) que vão no prompt. */
function blocosDeImagem(caminhos: string[]): Anthropic.ImageBlockParam[] {
  const blocos: Anthropic.ImageBlockParam[] = [];
  for (const p of caminhos) {
    const ext = p.split('.').pop()?.toLowerCase() ?? '';
    const media_type = MEDIA_TYPES[ext];
    if (!media_type) continue;
    blocos.push({
      type: 'image',
      source: { type: 'base64', media_type, data: readFileSync(p).toString('base64') },
    });
  }
  return blocos;
}

const INSTRUCAO_TRANSCRICAO = [
  'As imagens acima são os slides de UM carrossel do Instagram, na ordem.',
  '',
  'Transcreva o conteúdo de cada slide, em ordem, no formato:',
  'Slide 1: <todo o texto do slide, na ordem em que aparece>',
  'Slide 2: ...',
  '',
  'Regras:',
  '- Transcreva o texto COMO ESTÁ, palavra por palavra, inclusive nomes de',
  '  ferramentas, URLs, números e a numeração do slide se houver.',
  '- Se o slide tiver um print de tela ou uma imagem relevante, descreva em uma',
  '  frase curta o que ela mostra, entre colchetes. Ex.: [print do site X].',
  '- NÃO resuma, NÃO interprete, NÃO opine sobre a qualidade e NÃO invente nada',
  '  que não esteja visível. Isto é uma transcrição, não uma análise.',
  '- Se um slide estiver ilegível, escreva "Slide N: (ilegível)".',
  '',
  'Ao final, escreva uma linha "TEMA: <o assunto do carrossel em até 12 palavras>".',
].join('\n');

/**
 * Lê os slides de um post e devolve a transcrição em texto (ou null se não der).
 *
 * Nunca lança: qualquer falha (sem sessão, Playwright ausente, post privado,
 * timeout) vira `null` e o pipeline segue com a legenda. Ler os slides é um
 * upgrade do teardown, não um pré-requisito para gerar o rascunho.
 */
export async function transcreverSlides(url: string, apiKey: string): Promise<string | null> {
  if (!podeLerSlides()) return null;

  let captura: CapturaResult | null = null;
  try {
    captura = await capturarSlides(url);
  } catch (err) {
    console.warn('[slides] captura falhou:', err instanceof Error ? err.message : err);
    return null;
  }
  if (!captura) return null;

  try {
    const imagens = blocosDeImagem(captura.slides);
    if (!imagens.length) return null;

    const client = new Anthropic({ apiKey });
    const res = await client.messages.create({
      model: MODELO_LEITURA,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      messages: [{ role: 'user', content: [...imagens, { type: 'text', text: INSTRUCAO_TRANSCRICAO }] }],
    });

    if (res.stop_reason === 'refusal') return null;
    const texto = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    if (!texto) return null;

    const faltou = captura.coletadas > captura.count ? ' (algum slide não pôde ser baixado)' : '';
    return `[Transcrição dos slides do carrossel, ${captura.count} slide(s) lido(s)${faltou}]\n${texto}`;
  } catch (err) {
    console.warn('[slides] leitura falhou:', err instanceof Error ? err.message : err);
    return null;
  } finally {
    // As imagens são temporárias: já viraram texto, não precisam sobreviver.
    try {
      rmSync(captura.dir, { recursive: true, force: true });
    } catch {
      /* pasta temporária some sozinha depois; não é motivo pra falhar */
    }
  }
}
