/**
 * apps/dobro — MOTOR DE ANÁLISE de CARROSSÉIS por estrutura narrativa. Módulo
 * PURO (zero React, zero servidor), igual a `social-analise.ts`: testável isolado
 * e importável pela tela Estrategista v2.
 *
 * Foco do dono: GANHAR SEGUIDORES + GERAR COMENTÁRIOS (comentários com palavra
 * gatilho que disparam automação de DM). A pergunta que ele quer responder é
 * "qual ESTRUTURA de carrossel funciona pra nós?".
 *
 * Método: cada carrossel medido já tem `estrutura` classificada (offline, por IA,
 * ver `server/scripts/classificar-estrutura.ts`). Aqui a gente agrega por estrutura
 * e mede as taxas por 1000 de alcance (seguidores/1k, comentários/1k), pra separar
 * "o que a estrutura causa" de "teve muito número porque o algoritmo distribuiu".
 * A tela mapeia as linhas de `v_conteudo_desempenho` (formato carrossel) para
 * `CarrosselMetrics` e passa pra cá; este módulo não conhece `Row` nem fetch.
 */

/** Estruturas narrativas reconhecidas (bate com o classificador). */
export const ESTRUTURA_LABEL: Record<string, string> = {
  ferramenta: 'Ferramenta',
  conceito: 'Conceito',
  noticia: 'Notícia',
  listicle: 'Listicle',
  contrarian: 'Contrarian',
  storytelling: 'Storytelling',
  tutorial: 'Tutorial',
  venda: 'Venda',
  pergunta: 'Pergunta',
};

/** Meta de negócio que ordena o ranking. */
export type Meta = 'seguidores' | 'comentarios';

export const META_LABEL: Record<Meta, string> = {
  seguidores: 'Ganhar seguidores',
  comentarios: 'Gerar comentários',
};

/** Métricas de UM carrossel, já parseadas em números (a tela faz Row → isto). */
export interface CarrosselMetrics {
  id: string;
  estrutura: string | null;
  tema: string | null;
  data?: string | null;
  permalink?: string | null;
  alcance: number | null;
  seguidores: number | null;
  comentarios: number | null;
  salvamentos: number | null;
  compartilhamentos: number | null;
  visitasPerfil: number | null;
}

const num = (v: number | null | undefined): number => (v != null && Number.isFinite(v) ? v : 0);

function mediana(nums: number[]): number {
  const a = nums.filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return 0;
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

/** Taxa por 1000 de alcance (ponderada): total do sinal / total de alcance × 1000. */
function por1k(totalSinal: number, totalAlcance: number): number {
  return totalAlcance > 0 ? (totalSinal / totalAlcance) * 1000 : 0;
}

/** Agregado de UMA estrutura narrativa. */
export interface AggEstrutura {
  estrutura: string;
  label: string;
  n: number;
  alcanceMedio: number;
  /** Taxas por 1k de alcance (a métrica que compara estruturas de forma justa). */
  seguidoresPor1k: number;
  comentariosPor1k: number;
  salvamentosPor1k: number;
  /** Medianas absolutas (robustas a outlier), pra dar contexto. */
  seguidoresMediana: number;
  comentariosMediana: number;
  /** Amostra pequena (n < 5): tratar o resultado com cautela. */
  amostraFraca: boolean;
}

/** Agrega os carrosséis por estrutura. Só entram os que têm estrutura + alcance > 0. */
export function agregarPorEstrutura(posts: CarrosselMetrics[]): AggEstrutura[] {
  const grupos = new Map<string, CarrosselMetrics[]>();
  for (const p of posts) {
    const e = (p.estrutura ?? '').trim();
    if (!e) continue;
    if (p.alcance == null || p.alcance <= 0) continue;
    const arr = grupos.get(e) ?? [];
    arr.push(p);
    grupos.set(e, arr);
  }

  const out: AggEstrutura[] = [];
  for (const [estrutura, ps] of grupos) {
    const totalAlcance = ps.reduce((s, p) => s + num(p.alcance), 0);
    const totalSeg = ps.reduce((s, p) => s + num(p.seguidores), 0);
    const totalCom = ps.reduce((s, p) => s + num(p.comentarios), 0);
    const totalSalv = ps.reduce((s, p) => s + num(p.salvamentos), 0);
    out.push({
      estrutura,
      label: ESTRUTURA_LABEL[estrutura] ?? estrutura,
      n: ps.length,
      alcanceMedio: Math.round(totalAlcance / ps.length),
      seguidoresPor1k: por1k(totalSeg, totalAlcance),
      comentariosPor1k: por1k(totalCom, totalAlcance),
      salvamentosPor1k: por1k(totalSalv, totalAlcance),
      seguidoresMediana: mediana(ps.map((p) => num(p.seguidores))),
      comentariosMediana: mediana(ps.map((p) => num(p.comentarios))),
      amostraFraca: ps.length < 5,
    });
  }
  return out;
}

/** Chave da taxa por 1k correspondente à meta. */
const CHAVE_META: Record<Meta, 'seguidoresPor1k' | 'comentariosPor1k'> = {
  seguidores: 'seguidoresPor1k',
  comentarios: 'comentariosPor1k',
};

/** Ranking das estruturas para uma meta (desc pela taxa por 1k daquela meta). */
export function rankearEstruturas(aggs: AggEstrutura[], meta: Meta): AggEstrutura[] {
  const chave = CHAVE_META[meta];
  return [...aggs].sort((a, b) => b[chave] - a[chave]);
}

/** Um carrossel campeão (linha da lista de campeões). */
export interface Campeao {
  id: string;
  tema: string;
  permalink: string | null;
  estrutura: string;
  estruturaLabel: string;
  alcance: number;
  seguidores: number;
  comentarios: number;
}

/** Top N carrosséis pela métrica absoluta da meta (seguidores ou comentários). */
export function topCampeoes(posts: CarrosselMetrics[], meta: Meta, n = 8): Campeao[] {
  return [...posts]
    .filter((p) => (p.alcance ?? 0) > 0)
    .sort((a, b) => num(b[meta]) - num(a[meta]))
    .slice(0, n)
    .map((p) => {
      const estrutura = (p.estrutura ?? '').trim();
      return {
        id: p.id,
        tema: (p.tema ?? '').replace(/\s+/g, ' ').trim(),
        permalink: p.permalink ?? null,
        estrutura,
        estruturaLabel: ESTRUTURA_LABEL[estrutura] ?? estrutura ?? '—',
        alcance: num(p.alcance),
        seguidores: num(p.seguidores),
        comentarios: num(p.comentarios),
      };
    });
}

export type Confianca = 'baixa' | 'media' | 'boa';

/** Confiança geral pela quantidade de carrosséis com estrutura + alcance válidos. */
export function nivelConfianca(posts: CarrosselMetrics[]): { nivel: Confianca; n: number } {
  const n = posts.filter((p) => (p.estrutura ?? '').trim() && (p.alcance ?? 0) > 0).length;
  const nivel: Confianca = n < 20 ? 'baixa' : n < 60 ? 'media' : 'boa';
  return { nivel, n };
}
