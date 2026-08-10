/**
 * apps/dobro — DESMONTAGEM do melhor post por IA (a seção 5 da pauta, pré-preenchida).
 *
 * A tabela do doc pede oito leituras que nenhum número responde: público, dor ou
 * desejo, gancho, promessa, linguagem, desenvolvimento, visual e CTA. Preencher
 * isso na mão toda semana é o tipo de trabalho que trava a reunião — mas o
 * material para responder existe no OS quando o post medido está vinculado ao
 * card que o gerou (o elo que o casamento medição↔card criou).
 *
 * Aqui a IA lê esse material e devolve um RASCUNHO. Quem fecha a semana é gente:
 * a desmontagem é o produto da conversa, e uma resposta automática aceita sem
 * leitura vale menos que campo vazio.
 *
 * A honestidade da base é parte do contrato:
 *   · COMPLETA — o post tem card com roteiro: slides/cenas, legenda e CTA inteiros;
 *   · PARCIAL  — só a legenda que o sync guardou (300 caracteres). Dá para ler
 *     público e gancho; estrutura e visual viram hipótese, e o prompt manda deixar
 *     o campo VAZIO em vez de inventar.
 *
 * O campo Visual é o único que texto nenhum responde, então a CAPA REAL vai junto
 * na requisição (o `slide-1.png` que o card aponta em `capa_url`). O modelo olha
 * a arte em vez de deduzir pelo brief. Sem capa acessível, o campo volta vazio.
 */

import Anthropic from '@anthropic-ai/sdk';
import { eq } from 'drizzle-orm';
import { readFile } from 'node:fs/promises';
import type { db } from '../db/client.js';
import { conteudoDesempenho, conteudoPosts } from '../db/schema.js';

type Database = typeof db;

/** Tipos de imagem que a API aceita, pela extensão do arquivo da capa. */
const TIPOS_IMAGEM: Record<string, 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

/**
 * Teto da capa enviada. As capas do repo ficam entre 0,5 MB e 1,7 MB, bem abaixo
 * do limite da API; o corte existe para um arquivo fora do padrão não estourar a
 * requisição inteira e derrubar uma análise que funcionaria sem imagem.
 */
const MAX_CAPA_BYTES = 4 * 1024 * 1024;

/** A capa pronta para o modelo ver. */
interface Capa {
  base64: string;
  mediaType: 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';
}

function tipoDaImagem(caminho: string): Capa['mediaType'] | null {
  const ext = caminho.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return TIPOS_IMAGEM[ext] ?? null;
}

async function baixarCapa(url: string, mediaType: Capa['mediaType']): Promise<Capa | null> {
  const res = await fetch(url);
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length || buf.length > MAX_CAPA_BYTES) return null;
  return { base64: buf.toString('base64'), mediaType };
}

/**
 * Carrega a capa do card para o modelo VER, em vez de adivinhar pelo brief.
 *
 * `capa_url` dos cards gerados aponta para `/carrosseis/<slug>/slide-1.png`, que
 * é arquivo do próprio repo. Dois caminhos porque os dois ambientes são
 * diferentes: no PC o arquivo está em `public/` e se lê do disco; na Vercel a
 * function NÃO enxerga `public/` (é servido como estático), então busca pela
 * própria origem da requisição.
 *
 * Best-effort de ponta a ponta: qualquer falha devolve null e a análise segue
 * sem imagem, com o campo Visual vazio. Ver a capa é ganho, não pré-requisito.
 */
async function carregarCapa(capaUrl: string | null, origem: string | null): Promise<Capa | null> {
  if (!capaUrl) return null;
  const mediaType = tipoDaImagem(capaUrl);
  if (!mediaType) return null;

  try {
    if (/^https?:\/\//i.test(capaUrl)) return await baixarCapa(capaUrl, mediaType);

    // Caminho relativo: só o que a própria geração escreve, e sem subir diretório.
    if (!capaUrl.startsWith('/carrosseis/') || capaUrl.includes('..')) return null;

    try {
      const arquivo = new URL(`../public${capaUrl}`, import.meta.url);
      const buf = await readFile(arquivo);
      if (buf.length && buf.length <= MAX_CAPA_BYTES) {
        return { base64: buf.toString('base64'), mediaType };
      }
    } catch {
      /* sem disco (serverless): cai no fetch pela origem abaixo */
    }

    if (origem) return await baixarCapa(new URL(capaUrl, origem).toString(), mediaType);
    return null;
  } catch {
    return null;
  }
}

/** As oito chaves gravadas em `relatorio_semanal.dna` (batem com a rota e a tela). */
export const DNA_CAMPOS = [
  'publico',
  'dorDesejo',
  'gancho',
  'promessa',
  'linguagem',
  'desenvolvimento',
  'visual',
  'cta',
] as const;

export type DnaCampo = (typeof DNA_CAMPOS)[number];

export interface DesmontagemIa {
  dna: Partial<Record<DnaCampo, string>>;
  /** 'completa' = leu o post inteiro; 'parcial' = só a legenda truncada. */
  base: 'completa' | 'parcial';
  /** Frase para a tela mostrar sobre a qualidade da base. */
  aviso: string;
}

/**
 * Tool que FORÇA a saída estruturada (uma chamada, oito campos).
 *
 * A descrição do campo `visual` muda conforme a capa tenha sido carregada ou
 * não: com a imagem em mãos, pedir "responda só se houver brief" desperdiçaria
 * justamente o que o modelo está vendo; sem ela, pedir para descrever a arte
 * seria um convite a inventar.
 */
function dnaTool(temCapa: boolean): Anthropic.Tool {
  const tool = structuredClone(DNA_TOOL_BASE);
  const props = tool.input_schema.properties as Record<string, { description: string }>;
  props.visual.description = temCapa
    ? 'Você ESTÁ VENDO a capa do post (primeira imagem desta mensagem). Descreva o que ' +
      'chama atenção nela e por que faz parar o dedo: composição, contraste, o peso do ' +
      'texto, o elemento visual dominante. Seja concreto sobre o que está na imagem.'
    : 'O que chamou atenção na capa ou edição? Você NÃO vê a imagem: responda só se houver ' +
      'brief de capa no material, e diga que é o brief. Senão, deixe VAZIO.';
  return tool;
}

const DNA_TOOL_BASE: Anthropic.Tool = {
  name: 'registrar_dna',
  description:
    'Registra a desmontagem do post. Chame UMA vez, ao terminar. Deixe VAZIO ' +
    'qualquer campo que o material não permita responder com honestidade.',
  input_schema: {
    type: 'object',
    properties: {
      publico: {
        type: 'string',
        description:
          'Para quem o post parecia ter sido criado? Seja específico (ex.: "quem já sabe o básico de JS e trava em lógica"), não "devs em geral".',
      },
      dorDesejo: {
        type: 'string',
        description: 'Qual problema ou objetivo ele abordou? Uma frase.',
      },
      gancho: {
        type: 'string',
        description:
          'O que fez a pessoa parar? Cite o elemento concreto (a frase da capa, o número, a promessa) e a técnica por trás.',
      },
      promessa: { type: 'string', description: 'O que a pessoa esperava descobrir ao abrir?' },
      linguagem: {
        type: 'string',
        description: 'Técnica, simples, provocativa ou emocional? Escolha e justifique em meia frase.',
      },
      desenvolvimento: {
        type: 'string',
        description:
          'Lista, comparação, história ou passo a passo? Só responda se o material mostrar a estrutura do conteúdo; se você só tem a legenda, deixe VAZIO.',
      },
      visual: {
        type: 'string',
        description:
          'O que chamou atenção na capa ou edição? Você NÃO vê a imagem: responda só se houver brief de capa no material, e diga que é o brief. Senão, deixe VAZIO.',
      },
      cta: { type: 'string', description: 'Qual ação foi solicitada? Cite a palavra-gatilho se houver.' },
    },
    required: ['publico', 'dorDesejo', 'gancho', 'promessa', 'linguagem', 'cta'],
  },
};

/** Modelo e teto de espera — a tela espera por isto, então não pode arrastar. */
const MODELO = 'claude-opus-4-8';
const TIMEOUT_MS = 40_000;

/** Remove travessão (cara de texto de IA), como no resto do módulo de conteúdo. */
function semTravessao(s: string): string {
  return (s ?? '')
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\s*,\s*,/g, ',')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

interface Material {
  linhas: string[];
  base: 'completa' | 'parcial';
}

/** Monta o material de leitura a partir da medição e do card (quando existe). */
function montarMaterial(
  medicao: { tema: string | null; formato: string | null; alcance: number | null; salvamentos: number | null; comentarios: number | null; compartilhamentos: number | null },
  card: CardDoPost,
): Material {
  const linhas: string[] = [
    `Formato: ${medicao.formato ?? 'desconhecido'}`,
    `Números reais: ${medicao.alcance ?? '?'} de alcance, ${medicao.salvamentos ?? '?'} salvamentos, ` +
      `${medicao.compartilhamentos ?? '?'} compartilhamentos, ${medicao.comentarios ?? '?'} comentários`,
  ];

  const roteiro = (card?.roteiro ?? null) as
    | { slides?: Array<{ titulo: string; corpo: string }>; cenas?: Array<{ tempo: string; fala: string; texto_tela: string }>; capa_brief?: string }
    | null;

  if (card && roteiro && ((roteiro.slides?.length ?? 0) > 0 || (roteiro.cenas?.length ?? 0) > 0)) {
    linhas.push(`Título do card: ${card.titulo}`, `Gancho/capa: ${card.gancho ?? '(não informado)'}`);
    (roteiro.slides ?? []).forEach((s, i) => linhas.push(`Slide ${i + 1} | ${s.titulo} | ${s.corpo}`));
    (roteiro.cenas ?? []).forEach((c, i) =>
      linhas.push(`Cena ${i + 1} [${c.tempo}] | tela: ${c.texto_tela} | fala: ${c.fala}`),
    );
    linhas.push(`Legenda: ${card.legenda ?? '(sem legenda)'}`, `CTA final: ${card.ctaFinal ?? '(sem CTA)'}`);
    if (card.hashtags) linhas.push(`Hashtags: ${card.hashtags}`);
    if (roteiro.capa_brief) linhas.push(`Brief da capa (o que a arte deveria mostrar): ${roteiro.capa_brief}`);
    return { linhas, base: 'completa' };
  }

  // Sem card: sobra o que o sync guardou da legenda, que vem cortado em 300
  // caracteres. É pouco, e o prompt precisa saber disso para não fingir que leu
  // o post inteiro.
  linhas.push(
    'ATENÇÃO: este post NÃO está vinculado a um card do board. O único texto disponível',
    'é o começo da legenda publicada, cortado em 300 caracteres. Você não viu os slides,',
    'nem o fim da legenda, nem a arte.',
    `Início da legenda publicada: ${medicao.tema ?? '(indisponível)'}`,
  );
  return { linhas, base: 'parcial' };
}

function buildPrompt(material: Material, temCapa: boolean): string {
  return [
    'Você é um estrategista de conteúdo desmontando o post que MAIS performou na semana do',
    'perfil @devemdobro (ensino de programação e carreira tech). O objetivo é descobrir o',
    '"DNA" do post: a estrutura que fez ele funcionar, para poder repetir a lógica em outros',
    'temas. Não basta descrever o assunto.',
    '',
    '## Regras duras',
    '- NÃO INVENTE. Se o material não permite responder um campo, deixe-o VAZIO. Campo vazio',
    '  é honesto; resposta inventada contamina a reunião e vira decisão errada depois.',
    '- Responda o que o post FEZ, não o que você acha que ele deveria ter feito.',
    '- Uma a duas frases por campo. É material de reunião, ninguém vai ler parágrafo.',
    '- Em nenhum campo use travessão "—" nem meia-risca "–".',
    ...(temCapa
      ? ['- A PRIMEIRA IMAGEM desta mensagem é a CAPA real do post, o slide 1. Use-a para',
         '  responder o campo visual, e leve em conta o que ela mostra ao julgar o gancho.']
      : []),
    ...(material.base === 'parcial'
      ? [
          '- Você está com material PARCIAL (só o começo da legenda). Responda público, dor,',
          '  gancho, promessa, linguagem e CTA se der, e deixe desenvolvimento e visual VAZIOS.',
        ]
      : []),
    '',
    '## O post',
    ...material.linhas,
    '',
    'Chame `registrar_dna` UMA vez.',
  ].join('\n');
}

/**
 * Desmonta UMA medição e devolve o rascunho dos oito campos. Lança em erro de
 * API; quem chama transforma em resposta HTTP.
 */
export async function desmontarPostPorIa(
  database: Database,
  apiKey: string,
  medicaoId: string,
  /** Origem da requisição, para buscar a capa quando não há disco (Vercel). */
  origem: string | null = null,
): Promise<DesmontagemIa | null> {
  const [medicao] = await database
    .select({
      id: conteudoDesempenho.id,
      postId: conteudoDesempenho.postId,
      tema: conteudoDesempenho.tema,
      formato: conteudoDesempenho.formato,
      alcance: conteudoDesempenho.alcance,
      salvamentos: conteudoDesempenho.salvamentos,
      comentarios: conteudoDesempenho.comentarios,
      compartilhamentos: conteudoDesempenho.compartilhamentos,
    })
    .from(conteudoDesempenho)
    .where(eq(conteudoDesempenho.id, medicaoId))
    .limit(1);

  if (!medicao) return null;

  let card: CardDoPost = null;
  if (medicao.postId) card = await buscarCard(database, medicao.postId);

  const material = montarMaterial(medicao, card);
  const capa = await carregarCapa(card?.capaUrl ?? null, origem);

  // A capa vai ANTES do texto: a ordem importa para o modelo associar a imagem ao
  // post que ele vai ler em seguida, em vez de tratá-la como anexo solto.
  const conteudo: Anthropic.ContentBlockParam[] = [];
  if (capa) {
    conteudo.push({
      type: 'image',
      source: { type: 'base64', media_type: capa.mediaType, data: capa.base64 },
    });
  }
  conteudo.push({ type: 'text', text: buildPrompt(material, !!capa) });

  const client = new Anthropic({ apiKey });
  const res = await client.messages.create(
    {
      model: MODELO,
      max_tokens: 4000,
      tools: [dnaTool(!!capa)],
      tool_choice: { type: 'tool', name: 'registrar_dna' },
      messages: [{ role: 'user', content: conteudo }],
    },
    { timeout: TIMEOUT_MS },
  );

  if (res.stop_reason === 'refusal') throw new Error('O modelo recusou analisar este post.');
  const bloco = res.content.find(
    (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'registrar_dna',
  );
  if (!bloco) throw new Error('O modelo terminou sem registrar a desmontagem.');

  const bruto = bloco.input as Record<string, unknown>;
  const dna: Partial<Record<DnaCampo, string>> = {};
  for (const campo of DNA_CAMPOS) {
    const texto = typeof bruto[campo] === 'string' ? semTravessao(bruto[campo] as string) : '';
    if (texto) dna[campo] = texto.slice(0, 500);
  }

  return {
    dna,
    base: material.base,
    aviso:
      material.base === 'completa'
        ? `Leitura do post inteiro (slides, legenda e CTA do card)${capa ? ', com a capa analisada' : ', sem a capa'}. Revise antes de fechar.`
        : 'Post sem card no board: a IA leu só os 300 primeiros caracteres da legenda. Estrutura e visual ficam para você.',
  };
}

/** O card do board, quando o post medido está vinculado a um. */
type CardDoPost = {
  titulo: string;
  capaUrl: string | null;
  gancho: string | null;
  legenda: string | null;
  ctaFinal: string | null;
  hashtags: string | null;
  roteiro: unknown;
} | null;

/** Card do board que originou o post medido (com o roteiro completo). */
async function buscarCard(database: Database, postId: string): Promise<CardDoPost> {
  const [card] = await database
    .select({
      titulo: conteudoPosts.titulo,
      capaUrl: conteudoPosts.capaUrl,
      gancho: conteudoPosts.gancho,
      legenda: conteudoPosts.legenda,
      ctaFinal: conteudoPosts.ctaFinal,
      hashtags: conteudoPosts.hashtags,
      roteiro: conteudoPosts.roteiro,
    })
    .from(conteudoPosts)
    .where(eq(conteudoPosts.id, postId))
    .limit(1);
  return card ?? null;
}
