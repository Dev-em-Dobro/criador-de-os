/**
 * apps/dobro — o DOSSIÊ: o que os números reais do perfil ensinam, em texto que
 * cabe num prompt.
 *
 * É a peça que faz o gerador "ficar melhor a cada análise". Antes, o que a IA
 * sabia sobre o perfil era uma constante escrita à mão (`VOZ_E_VEREDITO`), com os
 * campeões de uma análise feita uma vez. Ela envelhecia sozinha: um post que
 * estourou semana passada não entrava, e um ângulo que parou de funcionar
 * continuava sendo recomendado.
 *
 * Aqui o mesmo conteúdo sai do banco, a cada geração:
 *   · RANKING por estrutura narrativa, com as taxas medianas reais;
 *   · CAMPEÕES e FRACASSOS recentes, com o texto do post.
 *
 * Por que isso importa mais do que parece: a mediana de salvamento de um
 * carrossel de FERRAMENTA neste perfil é 4,04%, e a de NOTÍCIA é 0,30% — treze
 * vezes menos. Sem ver esses números, o avaliador prevê a média para tudo e todo
 * post sai "Saudável", que é exatamente o que aconteceu nas 12 primeiras
 * previsões automáticas.
 *
 * Duas escolhas de engenharia:
 *   · BEST-EFFORT. Se a consulta falhar, quem chama usa o texto fixo de sempre.
 *     Aprender com o histórico é melhoria, não pré-requisito para gerar um post.
 *   · CACHE em memória (TTL curto). O dossiê muda quando o sync roda, não a cada
 *     geração; numa instância quente isso evita repetir a mesma query.
 *
 * ATENÇÃO ao texto dos exemplos: `conteudo_desempenho.tema` guarda só os ~300
 * primeiros caracteres da legenda publicada (ver `desempenho-sync.ts`). Serve de
 * exemplo de ABERTURA, não do post inteiro — e o prompt diz isso ao modelo.
 */

import { isNotNull, sql } from 'drizzle-orm';
import type { db } from '../db/client.js';
import { conteudoDesempenho } from '../db/schema.js';

type Database = typeof db;

/** Quanto tempo o dossiê vale antes de ser recalculado. */
const TTL_MS = 10 * 60 * 1000;

/**
 * Alcance mínimo para uma medição entrar no dossiê. Post com alcance minúsculo
 * produz taxa instável (3 salvamentos em 40 de alcance = 7,5%) e viraria "campeão"
 * sem ter sido campeão de nada.
 */
const ALCANCE_MINIMO = 500;

/** Abaixo disto, a estrutura entra no ranking mas marcada como amostra fraca. */
const AMOSTRA_FRACA = 5;

/** Uma estrutura narrativa e o que ela rende de verdade. */
export interface LinhaEstrutura {
  estrutura: string;
  n: number;
  /** Medianas em % do alcance. */
  salvPct: number;
  compPct: number;
  /** Por 1000 de alcance (comparação justa entre posts de alcance diferente). */
  seguidoresPor1k: number;
  comentariosPor1k: number;
  amostraFraca: boolean;
}

/** Um post real usado como exemplo no prompt. */
export interface Exemplo {
  estrutura: string | null;
  texto: string;
  salvPct: number;
  alcance: number;
}

export interface Dossie {
  /** Quantas medições sustentam este dossiê. */
  base: number;
  estruturas: LinhaEstrutura[];
  campeoes: Exemplo[];
  fracassos: Exemplo[];
}

interface Medicao {
  tema: string | null;
  estrutura: string | null;
  alcance: number | null;
  salvamentos: number | null;
  compartilhamentos: number | null;
  comentarios: number | null;
  seguidores: number | null;
}

function mediana(v: number[]): number {
  if (!v.length) return 0;
  const a = [...v].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/** Taxa em % do alcance (0 quando não dá para calcular). */
function taxaPct(valor: number | null, alcance: number | null): number {
  if (!valor || !alcance) return 0;
  return (valor / alcance) * 100;
}

/** Primeira frase útil do post medido, para caber numa linha do prompt. */
function trecho(tema: string | null, max = 110): string {
  const s = (tema ?? '')
    .replace(/\s+/g, ' ')
    // A linha de follow é padrão da casa e não diz nada sobre o post.
    .replace(/^\s*segue\s+@[a-z0-9_.]+[^.!?]*[.!?]?\s*/i, '')
    .trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Monta o dossiê a partir das medições (função pura, testável sem banco). */
export function montarDossie(medicoes: Medicao[]): Dossie {
  const validas = medicoes.filter((m) => (m.alcance ?? 0) >= ALCANCE_MINIMO);

  const grupos = new Map<string, Medicao[]>();
  for (const m of validas) {
    const e = (m.estrutura ?? '').trim();
    if (!e) continue;
    grupos.set(e, [...(grupos.get(e) ?? []), m]);
  }

  const estruturas: LinhaEstrutura[] = [...grupos.entries()]
    .map(([estrutura, g]) => {
      const totalAlcance = g.reduce((s, m) => s + (m.alcance ?? 0), 0);
      const soma = (f: (m: Medicao) => number | null): number =>
        g.reduce((s, m) => s + (f(m) ?? 0), 0);
      return {
        estrutura,
        n: g.length,
        salvPct: mediana(g.map((m) => taxaPct(m.salvamentos, m.alcance))),
        compPct: mediana(g.map((m) => taxaPct(m.compartilhamentos, m.alcance))),
        seguidoresPor1k: totalAlcance ? (soma((m) => m.seguidores) / totalAlcance) * 1000 : 0,
        comentariosPor1k: totalAlcance ? (soma((m) => m.comentarios) / totalAlcance) * 1000 : 0,
        amostraFraca: g.length < AMOSTRA_FRACA,
      };
    })
    .sort((a, b) => b.salvPct - a.salvPct);

  // Exemplos: os extremos de salvamento, que é o melhor sinal de valor percebido.
  //
  // Post de VENDA fica fora dos exemplos (mas continua no ranking): anúncio de
  // evento, certificado e chamada de inscrição têm lógica própria e não servem
  // nem de modelo nem de contra-exemplo para o conteúdo do dia a dia. Sem este
  // filtro, os três "fracassos" eram todos posts de campanha da Semana, e o
  // gerador aprenderia a evitar um padrão que ele nem escreve.
  const comTexto = validas
    // Só posts COM estrutura: são os mesmos que sustentam o ranking, e um exemplo
    // sem rótulo ("sem tipo") não ensina nada — o modelo não sabe do que imitar.
    .filter((m) => (m.estrutura ?? '').trim() && m.estrutura !== 'venda')
    .filter((m) => (m.tema ?? '').trim().length > 30)
    .map((m) => ({
      estrutura: m.estrutura,
      texto: trecho(m.tema),
      salvPct: taxaPct(m.salvamentos, m.alcance),
      alcance: m.alcance ?? 0,
    }))
    .sort((a, b) => b.salvPct - a.salvPct);

  return {
    // A base é o que sustenta o RANKING (carrosséis classificados), não o total
    // medido: dizer "220 posts" quando o ranking sai de 111 seria inflar a
    // autoridade do número na frente do modelo.
    base: [...grupos.values()].reduce((s, g) => s + g.length, 0),
    estruturas,
    campeoes: comTexto.slice(0, 5),
    fracassos: comTexto.slice(-3).reverse(),
  };
}

/** Formata "4,04%". */
function pct(v: number): string {
  return `${v.toFixed(2).replace('.', ',')}%`;
}

/**
 * O dossiê como bloco de prompt para QUEM ESCREVE o post: o ranking manda no
 * ângulo a escolher, os exemplos mostram o tipo de abertura que rende.
 */
export function dossieParaGerador(d: Dossie): string[] {
  if (!d.estruturas.length) return [];

  const linhas = [
    `## O que os NOSSOS números dizem (base real: ${d.base} posts medidos)`,
    'Ranking por estrutura de carrossel, pela mediana de salvamentos sobre alcance.',
    'Salvamento mede se a pessoa quis GUARDAR; seguidores/1k e comentários/1k são as',
    'metas de negócio. As três taxas estão aí para você escolher com os olhos abertos.',
    '',
  ];

  for (const e of d.estruturas) {
    linhas.push(
      `- ${e.estrutura}: ${pct(e.salvPct)} salvamentos, ${pct(e.compPct)} compartilhamentos, ` +
        `${e.comentariosPor1k.toFixed(1)} comentários/1k, ${e.seguidoresPor1k.toFixed(1)} seguidores/1k ` +
        `(${e.n} posts${e.amostraFraca ? ', amostra pequena' : ''})`,
    );
  }

  const melhor = d.estruturas[0];
  const pior = d.estruturas[d.estruturas.length - 1];
  // O líder de salvamento nem sempre é o líder das metas de negócio — quando não
  // é, dizer isso evita que o gerador otimize a métrica errada.
  const liderSeg = [...d.estruturas].sort((a, b) => b.seguidoresPor1k - a.seguidoresPor1k)[0];
  const liderCom = [...d.estruturas].sort((a, b) => b.comentariosPor1k - a.comentariosPor1k)[0];

  linhas.push(
    '',
    `Leitura: "${melhor.estrutura}" rende ${(melhor.salvPct / Math.max(pior.salvPct, 0.01)).toFixed(0)}x ` +
      `mais salvamento que "${pior.estrutura}". A estrutura que você escolher pesa MAIS que a qualidade`,
    'do texto. Prefira as do topo, e só use as de baixo se o tema exigir mesmo.',
    liderSeg.estrutura === liderCom.estrutura
      ? `Nas metas de negócio (seguidor e comentário), quem puxa as duas é "${liderSeg.estrutura}".`
      : `Nas metas de negócio, quem puxa seguidor é "${liderSeg.estrutura}" e quem puxa ` +
        `comentário é "${liderCom.estrutura}".`,
  );

  if (d.campeoes.length) {
    linhas.push(
      '',
      'Aberturas que MAIS renderam (só o começo da legenda publicada, para dar o tom):',
      ...d.campeoes.map((c) => `- [${c.estrutura ?? 'sem tipo'} · ${pct(c.salvPct)}] ${c.texto}`),
    );
  }
  if (d.fracassos.length) {
    linhas.push(
      '',
      'Aberturas que renderam MENOS (não repita este padrão):',
      ...d.fracassos.map((c) => `- [${c.estrutura ?? 'sem tipo'} · ${pct(c.salvPct)}] ${c.texto}`),
    );
  }
  return linhas;
}

/**
 * O dossiê como bloco de prompt para QUEM AVALIA: as âncoras numéricas.
 *
 * Aqui o objetivo é o oposto do gerador. O avaliador não precisa de inspiração,
 * precisa de referência: sem ver que "ferramenta" mediana dá 4,04% e "notícia"
 * 0,30%, ele chuta a média para todo post e o placar nunca varia.
 */
export function dossieParaAvaliador(d: Dossie): string[] {
  if (!d.estruturas.length) return [];
  return [
    `## Âncoras REAIS deste perfil (${d.base} posts medidos)`,
    'Mediana por estrutura de carrossel, salvamentos e compartilhamentos sobre alcance:',
    ...d.estruturas.map(
      (e) =>
        `- ${e.estrutura}: salvamentos ${pct(e.salvPct)} · compartilhamentos ${pct(e.compPct)}` +
        ` (${e.n} posts${e.amostraFraca ? ', amostra pequena, use com reserva' : ''})`,
    ),
    '',
    'COMO USAR: primeiro decida de que tipo é o post que você está julgando, depois',
    'parta da mediana daquele tipo e ajuste para cima ou para baixo conforme a força',
    'do material concreto (ferramenta com nome próprio, número, cheatsheet salvável).',
    'NÃO devolva a média de tudo: a diferença entre o melhor e o pior tipo aqui passa',
    'de dez vezes, e prever sempre o meio é o mesmo que não prever nada.',
  ];
}

// ============================================================
// VIÉS — o que o placar já sabe sobre os erros da própria IA
// ============================================================

/** Erro médio COM SINAL das previsões passadas, em pontos percentuais. */
export interface Vies {
  /** Quantos posts previstos já têm resultado medido. */
  n: number;
  /** Positivo = a IA previu mais salvamento do que o post entregou. */
  salvPp: number;
  compPp: number;
  /** Acertos de classe sobre o total comparável. */
  acertos: number;
}

/**
 * Amostra mínima para dizer ao modelo que ele tem um viés. Com 2 posts, o "erro
 * médio" é ruído, e mandar o avaliador corrigir por ruído piora a previsão.
 */
const MIN_PARES_VIES = 5;

/**
 * Lê o viés já medido em `v_conteudo_placar` — a MESMA view da tela do Placar,
 * de propósito: ela já resolve qual previsão vale por post (a última feita antes
 * de publicar), e refazer essa regra aqui seria criar uma segunda verdade.
 *
 * Devolve null enquanto não houver pares suficientes; nesse caso o prompt segue
 * sem o bloco de calibragem, que é o estado de hoje.
 */
export async function carregarVies(database: Database): Promise<Vies | null> {
  try {
    const res = await database.execute(sql`
      SELECT
        count(*)::int AS n,
        avg(prev_salvamentos_pct - (100.0 * salvamentos / NULLIF(alcance, 0)))       AS salv_pp,
        avg(prev_compartilhamentos_pct - (100.0 * compartilhamentos / NULLIF(alcance, 0))) AS comp_pp
      FROM v_conteudo_placar
      WHERE alcance IS NOT NULL AND alcance > 0
    `);
    const linhas = (res as unknown as { rows?: Record<string, unknown>[] }).rows ?? (res as unknown as Record<string, unknown>[]);
    const r = linhas?.[0];
    if (!r) return null;

    const n = Number(r.n ?? 0);
    if (!Number.isFinite(n) || n < MIN_PARES_VIES) return null;

    return {
      n,
      salvPp: Number(r.salv_pp ?? 0),
      compPp: Number(r.comp_pp ?? 0),
      // O acerto de classe não entra no prompt (a classe é derivada por código,
      // não prevista pelo modelo); quem mostra isso é a tela.
      acertos: 0,
    };
  } catch (err) {
    console.warn(
      '[dossie] não carregou o viés (previsão segue sem calibragem):',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

/** O viés como bloco de prompt: o modelo lê o próprio histórico de erro. */
export function viesParaAvaliador(v: Vies | null): string[] {
  if (!v) return [];
  const linha = (pp: number, metrica: string): string => {
    const abs = Math.abs(pp).toFixed(2).replace('.', ',');
    if (Math.abs(pp) < 0.1) return `- ${metrica}: suas previsões têm batido com o real. Mantenha o critério.`;
    return pp > 0
      ? `- ${metrica}: você tem previsto ${abs} ponto(s) percentuais A MAIS do que o real. Puxe suas estimativas para BAIXO.`
      : `- ${metrica}: você tem previsto ${abs} ponto(s) percentuais A MENOS do que o real. Pode subir suas estimativas.`;
  };
  return [
    `## Sua calibragem (medida em ${v.n} posts que você já previu)`,
    linha(v.salvPp, 'Salvamentos'),
    linha(v.compPp, 'Compartilhamentos'),
    'Isto não é opinião: é o erro médio das suas previsões anteriores contra o resultado real.',
  ];
}

/** Cache de processo: o dossiê muda quando o sync roda, não a cada geração. */
let cache: { em: number; dossie: Dossie } | null = null;

/**
 * Lê o histórico e devolve o dossiê, ou null se não der (banco fora, role sem
 * permissão, tabela vazia). Quem chama segue sem ele.
 */
export async function carregarDossie(database: Database): Promise<Dossie | null> {
  if (cache && Date.now() - cache.em < TTL_MS) return cache.dossie;
  try {
    const linhas = await database
      .select({
        tema: conteudoDesempenho.tema,
        estrutura: conteudoDesempenho.estrutura,
        alcance: conteudoDesempenho.alcance,
        salvamentos: conteudoDesempenho.salvamentos,
        compartilhamentos: conteudoDesempenho.compartilhamentos,
        comentarios: conteudoDesempenho.comentarios,
        seguidores: conteudoDesempenho.seguidores,
      })
      .from(conteudoDesempenho)
      .where(isNotNull(conteudoDesempenho.alcance));

    const dossie = montarDossie(linhas);
    if (!dossie.estruturas.length) return null;
    cache = { em: Date.now(), dossie };
    return dossie;
  } catch (err) {
    console.warn(
      '[dossie] não carregou o histórico (segue com o texto fixo):',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
