/**
 * apps/dobro — bloco CUSTOM: "Relatório da semana" (a pauta da reunião de
 * marketing e lançamento, dentro do OS).
 *
 * Espelha o documento "Reunião estratégica — Marketing e Lançamento" (Raphael
 * facilita, Jaque leva os dados), seção por seção e na MESMA ordem, pra a reunião
 * ser conduzida pela tela em vez da planilha:
 *   1) Contexto da semana        → indicadores + comparação com a semana anterior
 *   2) Posts da semana           → a tabela de preparação, com as taxas prontas
 *   3) Campeões por categoria    → comentários, curtidas, compartilhamentos, seguidores
 *   4) DNA do melhor post        → o que dá pra ler dos dados + as perguntas do doc
 *   5) Pior post                 → com o diagnóstico da ETAPA que falhou
 *   6) Melhor × pior             → lado a lado
 *   7) Decisões                  → o roteiro de fechamento (registro fica no doc)
 *
 * HONESTIDADE DE DADO (o motivo de várias notas na tela): o doc pede cliques,
 * leads, inscrições e vendas por post. Nada disso existe no OS — o que a API do
 * Instagram devolve para no engajamento, e esses números vivem na LP e no
 * checkout. Em vez de esconder, a tela DIZ que não tem. O mesmo vale pra retenção,
 * que só existe em Reel (tempo médio ÷ duração).
 *
 * A semana é de segunda a domingo, navegável, e a comparação é sempre com a
 * semana imediatamente anterior — é o recorte da reunião.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';
import { CLASSE_TONE, DEFAULT_BENCH, derive, type Classe, type Derived, type FormatBenchmarks } from './regua-desempenho';

type Row = Record<string, unknown>;

interface RelatorioConfig {
  benchmarks?: Record<string, FormatBenchmarks>;
}

const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const OBJETIVO_LABEL: Record<string, string> = {
  atracao: 'Atração',
  aquecimento: 'Aquecimento',
  conversao: 'Conversão',
};

/** Fase do negócio na semana (2ª pergunta da pauta). Bate com FASES no servidor. */
const FASE_OPTS: ReadonlyArray<[string, string]> = [
  ['', 'Não definida'],
  ['atracao', 'Atração'],
  ['aquecimento', 'Aquecimento'],
  ['lancamento', 'Lançamento'],
  ['vendas', 'Vendas'],
  ['retencao', 'Retenção'],
];

// ============================================================
// Helpers
// ============================================================

function asRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data.filter((r): r is Row => r != null && typeof r === 'object');
  if (data != null && typeof data === 'object') return [data as Row];
  return [];
}
function str(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}
function num(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}
function fmtInt(n: number | null): string {
  return n == null ? '—' : new Intl.NumberFormat('pt-BR').format(Math.round(n));
}
function fmtRate(v: number | null): string {
  return v == null ? '—' : `${(v * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}
function fmtPct(v: number | null): string {
  if (v == null) return '—';
  const s = v >= 0 ? '+' : '';
  return `${s}${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%`;
}

/** Segunda-feira 00:00 (local) da semana que contém `d`. */
function inicioSemana(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
function addDias(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
/**
 * Dia da linha, normalizado pra 00:00 LOCAL (a semana da reunião é por dia de
 * calendário); null quando não dá pra ler.
 *
 * Cuidado com o fuso: o `/api/query` devolve os `timestamp` SEM indicação de
 * fuso ("2026-08-17 00:13:55") e o valor gravado é UTC. Ler só o prefixo da
 * string joga o post no dia UTC — e aí tudo que foi publicado depois das 21h
 * (00h–03h em UTC) aparece no dia seguinte, podendo até cair na semana seguinte
 * e sumir do relatório. Por isso a hora é convertida antes de virar dia.
 */
function dataDe(r: Row, campo = 'data'): Date | null {
  const s = str(r[campo]).trim();
  if (!s) return null;
  // Data pura ('YYYY-MM-DD'): já é o dia, não há hora pra converter.
  const puro = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (puro) return new Date(Number(puro[1]), Number(puro[2]) - 1, Number(puro[3]));
  const semFuso = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(s);
  const t = new Date(semFuso ? `${s.replace(' ', 'T')}Z` : s);
  if (Number.isNaN(t.getTime())) return null;
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}
function dentro(d: Date | null, ini: Date, fim: Date): boolean {
  return d != null && d >= ini && d < fim;
}
/** 'YYYY-MM-DD' de uma data LOCAL (chave da semana no fechamento). */
function chaveDia(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** 'YYYY-MM-DD' de um valor vindo do banco (lê o prefixo da string ISO). */
function chaveDiaDe(v: unknown): string {
  const s = str(v);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function rotuloSemana(ini: Date): string {
  const fim = addDias(ini, 6);
  const mesmoMes = ini.getMonth() === fim.getMonth();
  const a = `${ini.getDate()}${mesmoMes ? '' : ` de ${MESES[ini.getMonth()]}`}`;
  return `${a} a ${fim.getDate()} de ${MESES[fim.getMonth()]}`;
}
/** Soma protegida de uma coluna. */
function soma(rows: Row[], campo: string): number {
  return rows.reduce((a, r) => a + (num(r[campo]) ?? 0), 0);
}
function interacoesDe(r: Row): number {
  return (num(r.curtidas) ?? 0) + (num(r.comentarios) ?? 0) + (num(r.compartilhamentos) ?? 0) + (num(r.salvamentos) ?? 0);
}
/** Mediana de uma lista (ignora nulos). */
function mediana(vals: Array<number | null>): number | null {
  const xs = vals.filter((v): v is number => v != null).sort((a, b) => a - b);
  if (!xs.length) return null;
  const m = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2;
}

/** Post medido + o que derivamos dele. */
interface PostSemana {
  row: Row;
  d: Derived;
  /** Título do card quando a medição foi casada com um; senão ''. */
  titulo: string;
  /** Começo da legenda publicada (é o que a medição guarda em `tema`). */
  descricao: string;
  formato: string;
  objetivo: string;
  interacoes: number;
  permalink: string;
  data: Date | null;
}

/**
 * Chave de casamento medição ↔ card pelo texto publicado. A medição guarda o
 * começo da legenda em `tema`; o card guarda a legenda inteira. Normalizamos
 * (minúsculas, sem pontuação/emoji, espaço único) e comparamos os primeiros 40
 * caracteres. Só vale quando a chave aponta pra UM card: prefixo repetido entre
 * dois posts seria um título errado na tela, que é pior que título nenhum.
 */
function chaveTexto(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N} ]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

// ============================================================
// Peças de UI
// ============================================================

/**
 * ESCALA DE TEXTO (contraste). O cinza que estava em quase tudo (gray-500,
 * #6b7280) dá ~4.3:1 sobre o fundo escuro e some em 11px, que é o tamanho da
 * maioria dos rótulos aqui. A escala abaixo sobe um degrau em cada nível: o
 * `gray-500` fica só para separador e ícone decorativo, nunca para texto que
 * alguém precisa ler numa reunião, na TV da sala.
 */
const T = {
  /** Apoio: descrição secundária, unidade, hint. Era gray-500 em tudo. */
  apoio: 'text-gray-400',
  /** Rótulo pequeno em caixa alta. */
  rotulo: 'text-[11px] uppercase tracking-wide text-gray-400',
} as const;

/** Números alinhados em coluna (tabular) — é tabela de reunião, não texto. */
const NUM = { fontVariantNumeric: 'tabular-nums' } as const;

const CARD = 'rounded-2xl border border-gray-700/60 bg-gray-900/60 p-4';

/**
 * Acentos por tipo de dado. Cor aqui é FUNCIONAL (diz de que categoria é o
 * número), não decorativa: é o que faz os cards pararem de parecer todos a
 * mesma coisa quando batem o olho no telão. Saturação baixa de propósito, pra
 * conviver com o roxo da marca sem competir.
 */
// `hoverBorda` já vem com o prefixo `hover:` escrito por inteiro: o Tailwind
// varre o CÓDIGO em busca de nomes de classe, então `hover:${a.borda}` montado em
// runtime nunca geraria o CSS — a classe existiria no HTML e não faria nada.
const ACENTO = {
  alcance: { risco: 'bg-sky-400/70', ico: 'bg-sky-500/15 text-sky-300', hoverBorda: 'hover:border-sky-500/50' },
  views: { risco: 'bg-indigo-400/70', ico: 'bg-indigo-500/15 text-indigo-300', hoverBorda: 'hover:border-indigo-500/50' },
  interacoes: { risco: 'bg-rose-400/70', ico: 'bg-rose-500/15 text-rose-300', hoverBorda: 'hover:border-rose-500/50' },
  seguidores: { risco: 'bg-violet-400/70', ico: 'bg-violet-500/15 text-violet-300', hoverBorda: 'hover:border-violet-500/50' },
  posts: { risco: 'bg-emerald-400/70', ico: 'bg-emerald-500/15 text-emerald-300', hoverBorda: 'hover:border-emerald-500/50' },
} as const;
type AcentoKey = keyof typeof ACENTO;

function Secao({ n, titulo, hint, children }: { n: number; titulo: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-9">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="text-[17px] font-semibold text-gray-50" style={DISPLAY}>
          <span className="mr-2 text-gray-500">{n}.</span>
          {titulo}
        </h3>
        {hint && <span className={`text-[12px] ${T.apoio}`}>{hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** Aviso de dado que o OS não tem — some do caminho, mas nunca mente por omissão. */
function SemDado({ children }: { children: ReactNode }) {
  return (
    <div className="mt-3 rounded-xl border-l-2 border-amber-500/50 bg-amber-500/[0.07] px-4 py-3 text-[12px] leading-relaxed text-amber-100/90">
      {children}
    </div>
  );
}

/**
 * Card de indicador. O tamanho conta a hierarquia: `destaque` faz o card ocupar
 * duas colunas com o número maior, porque alcance e interações são o que abre a
 * conversa da reunião — cinco cards idênticos em fila não dizem por onde começar.
 * A faixa de cor no topo identifica a métrica antes da leitura do rótulo.
 */
function Indicador({
  label,
  valor,
  delta,
  hint,
  acento,
  destaque = false,
}: {
  label: string;
  valor: string;
  delta: number | null;
  hint?: string;
  acento: AcentoKey;
  destaque?: boolean;
}) {
  const a = ACENTO[acento];
  const pill =
    delta == null
      ? 'border-gray-600/50 text-gray-400'
      : delta >= 0
        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
        : 'border-rose-500/40 bg-rose-500/10 text-rose-300';
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-gray-700/60 bg-gray-900/60 p-4 ${
        destaque ? 'sm:col-span-2' : ''
      }`}
    >
      <div className={`absolute inset-x-0 top-0 h-0.5 ${a.risco}`} aria-hidden="true" />
      <div className={T.rotulo}>{label}</div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-2">
        <span className={`font-semibold text-gray-50 ${destaque ? 'text-[34px]' : 'text-[26px]'}`} style={{ ...DISPLAY, ...NUM }}>
          {valor}
        </span>
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${pill}`} style={NUM}>
          {delta == null ? 'sem base' : fmtPct(delta)}
        </span>
      </div>
      <div className={`mt-1 text-[11px] ${T.apoio}`}>
        {hint ?? (delta == null ? 'primeira semana com dado' : 'contra a semana anterior')}
      </div>
    </div>
  );
}

function Pill({ classe }: { classe: Classe }) {
  const t = CLASSE_TONE[classe];
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] ${t.pill}`}>{t.label}</span>;
}

/** Dia/mês curto ('09/08'). */
function fmtDiaMes(d: Date | null): string {
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Card do campeão de uma categoria. O card INTEIRO abre o post no Instagram
 * quando a medição tem permalink: sem isso, identificar qual post é dependia de
 * reconhecer o começo da legenda, que é justamente o que ninguém lembra.
 * Mostra o título do card do board quando a medição foi casada com um, e a
 * primeira linha da legenda logo abaixo.
 */
function Campeao({
  titulo,
  icone,
  post,
  metrica,
  unidade,
  acento,
}: {
  titulo: string;
  icone: string;
  post: PostSemana | null;
  metrica: (p: PostSemana) => number;
  unidade: string;
  acento: AcentoKey;
}) {
  const a = ACENTO[acento];
  const cabeca = (
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className={`grid h-8 w-8 place-items-center rounded-xl text-[15px] ${a.ico}`} aria-hidden="true">
          {icone}
        </span>
        <span className={T.rotulo}>{titulo}</span>
      </div>
      {post?.permalink && <span className="text-[11px] text-blue-300">abrir ↗</span>}
    </div>
  );

  if (!post) {
    return (
      <div className={CARD}>
        {cabeca}
        <div className={`mt-3 text-[12px] ${T.apoio}`}>Nenhum post nesta semana.</div>
      </div>
    );
  }

  const corpo = (
    <>
      {cabeca}
      {/* O NÚMERO vem antes do texto: numa lida rápida é ele que responde
          "quem ganhou", e o título explica em seguida. */}
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-[28px] font-semibold leading-none text-gray-50" style={{ ...DISPLAY, ...NUM }}>
          {fmtInt(metrica(post))}
        </span>
        <span className={`text-[12px] ${T.apoio}`}>{unidade}</span>
      </div>
      {post.titulo ? (
        <>
          <div className="mt-2.5 line-clamp-2 text-[13px] font-semibold leading-snug text-gray-100">{post.titulo}</div>
          <div className={`mt-0.5 line-clamp-2 text-[11px] leading-snug ${T.apoio}`}>{post.descricao}</div>
        </>
      ) : (
        <div className="mt-2.5 line-clamp-3 text-[12px] leading-snug text-gray-300">
          {post.descricao || 'Sem descrição'}
        </div>
      )}
      <div className={`mt-2 border-t border-gray-700/50 pt-2 text-[11px] ${T.apoio}`} style={NUM}>
        {fmtDiaMes(post.data)} · {post.formato} · {fmtInt(num(post.row.alcance))} de alcance
      </div>
    </>
  );

  return post.permalink ? (
    <a
      href={post.permalink}
      target="_blank"
      rel="noreferrer"
      className={`block rounded-2xl border border-gray-700/60 bg-gray-900/60 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-800/70 ${a.hoverBorda}`}
      title="Abrir o post no Instagram"
    >
      {corpo}
    </a>
  ) : (
    <div className={CARD}>{corpo}</div>
  );
}

/** Linha "pergunta → o que os dados dizem" do DNA e do diagnóstico. */
function Linha({ termo, children }: { termo: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-t border-gray-700/50 py-2 first:border-t-0 sm:flex-row sm:gap-4">
      <div className="w-full shrink-0 text-[12px] text-gray-400 sm:w-52">{termo}</div>
      <div className="text-[13px] text-gray-200">{children}</div>
    </div>
  );
}

/**
 * Os DEZ elementos da desmontagem, na ordem e com as PERGUNTAS do doc (seção 5
 * da pauta). Dois deles a tela responde sozinha, com dado: Formato e Resultado.
 * Os outros oito saem da leitura de quem escreveu o post.
 *
 * A tabela existe em vez de um resumo em prosa porque o valor dela não é a lista
 * de nomes, é a PERGUNTA de cada linha: é ela que conduz os 10 minutos. Sem as
 * perguntas na tela, cada reunião improvisa a própria desmontagem e a resposta
 * sai diferente toda semana, o que impede comparar uma semana com a outra.
 */
const DNA_ELEMENTOS: ReadonlyArray<{
  elemento: string;
  pergunta: string;
  /** Chave em `relatorio_semanal.dna` (ausente nos dois que saem de dado). */
  campo?: string;
}> = [
  { elemento: 'Público', pergunta: 'Para quem o post parecia ter sido criado?', campo: 'publico' },
  { elemento: 'Dor ou desejo', pergunta: 'Qual problema ou objetivo ele abordou?', campo: 'dorDesejo' },
  { elemento: 'Gancho', pergunta: 'O que fez a pessoa parar?', campo: 'gancho' },
  { elemento: 'Promessa', pergunta: 'O que a pessoa esperava descobrir?', campo: 'promessa' },
  { elemento: 'Formato', pergunta: 'Reels, carrossel, imagem, história ou outro?' },
  { elemento: 'Linguagem', pergunta: 'Técnica, simples, provocativa ou emocional?', campo: 'linguagem' },
  {
    elemento: 'Desenvolvimento',
    pergunta: 'Lista, comparação, história ou passo a passo?',
    campo: 'desenvolvimento',
  },
  { elemento: 'Visual', pergunta: 'O que chamou atenção na capa ou edição?', campo: 'visual' },
  { elemento: 'CTA', pergunta: 'Qual ação foi solicitada?', campo: 'cta' },
  { elemento: 'Resultado', pergunta: 'Gerou alcance, interação, leads ou vendas?' },
];

/**
 * A tabela "Elemento · Pergunta de análise · Registro da equipe" do doc.
 *
 * As duas linhas que a tela responde (Formato e Resultado) vêm preenchidas com
 * dado; as outras oito são campos de texto, digitados na reunião e gravados no
 * fechamento da semana (`relatorio_semanal.dna`) junto com o resto do registro.
 * Um botão só para salvar tudo: a desmontagem é parte da mesma conversa, não
 * merece um fluxo de gravação próprio.
 */
function TabelaDna({
  formato,
  resultado,
  dna,
  onChange,
  medicaoId,
  temCard,
  onPrePreencher,
}: {
  formato: string;
  resultado: ReactNode;
  dna: Record<string, string>;
  onChange: (campo: string, valor: string) => void;
  medicaoId: string;
  temCard: boolean;
  onPrePreencher: (respostas: Record<string, string>) => number;
}) {
  const [analisando, setAnalisando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  /**
   * Pede o rascunho à IA. Preenche só os campos VAZIOS: o que a equipe já
   * escreveu vale mais que a leitura da máquina, e ninguém quer perder o que
   * digitou por clicar num botão.
   */
  async function analisar() {
    setAnalisando(true);
    setErro(null);
    setAviso(null);
    try {
      const res = await fetch('/api/relatorio/desmontar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicaoId }),
      });
      const corpo = (await res.json().catch(() => ({}))) as {
        dna?: Record<string, string>;
        aviso?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(corpo.error ?? `Erro ${res.status}`);
      const preenchidos = onPrePreencher(corpo.dna ?? {});
      setAviso(
        preenchidos === 0
          ? 'Nada a preencher: os campos já estavam respondidos.'
          : `${preenchidos} campo(s) preenchido(s) pela IA. ${corpo.aviso ?? ''}`,
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'falhou');
    } finally {
      setAnalisando(false);
    }
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-gray-700/60">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-700/60 bg-gray-800/40 px-3 py-2">
        <span className="text-[11px] text-gray-400">
          A IA lê o post e sugere as respostas; a revisão na reunião é o que vale.
          {!temCard && (
            <span className="text-amber-300/90">
              {' '}
              Este post não tem card no board, então ela só enxerga o começo da legenda.
            </span>
          )}
        </span>
        <button
          type="button"
          onClick={analisar}
          disabled={analisando}
          className="shrink-0 rounded-lg border border-blue-500/40 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-200 transition-colors hover:bg-blue-500/20 disabled:opacity-50"
        >
          {analisando ? 'analisando…' : '✨ Pré-preencher com IA'}
        </button>
      </div>
      {(aviso || erro) && (
        <div
          className={`border-b border-gray-700/60 px-3 py-1.5 text-[11px] ${erro ? 'text-red-300' : 'text-blue-300/90'}`}
        >
          {erro ?? aviso}
        </div>
      )}
      <div className="hidden grid-cols-[8.5rem_1fr_14rem] gap-3 bg-gray-800/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 sm:grid">
        <div>Elemento</div>
        <div>Pergunta de análise</div>
        <div>Registro da equipe</div>
      </div>
      {DNA_ELEMENTOS.map((e) => (
        <div
          key={e.elemento}
          className="grid grid-cols-1 gap-x-3 gap-y-1 border-t border-gray-700/40 px-3 py-2 first:border-t-0 sm:grid-cols-[8.5rem_1fr_14rem] sm:items-center"
        >
          <div className="text-[12px] font-medium text-gray-300">{e.elemento}</div>
          <div className="text-[12px] italic text-gray-500">{e.pergunta}</div>
          <div className="text-[12px] text-gray-200">
            {e.campo ? (
              <input
                type="text"
                value={dna[e.campo] ?? ''}
                onChange={(ev) => onChange(e.campo!, ev.target.value)}
                placeholder="responder na reunião"
                aria-label={`${e.elemento}: ${e.pergunta}`}
                className="w-full rounded-lg border border-gray-700/70 bg-gray-900/60 px-2 py-1 text-[12px] text-gray-100 placeholder:text-gray-600 focus:border-blue-500/60 focus:outline-none"
              />
            ) : (
              // Linha respondida por dado: sem campo, para não abrir a porta de
              // alguém digitar um número diferente do que a tela mediu.
              <span className="block text-[12px] text-gray-300">
                {e.elemento === 'Formato' ? formato : resultado}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Bloco
// ============================================================

function ConteudoRelatorioBlock({ config, ctx }: BlockProps<RelatorioConfig>) {
  const { data, loading, error } = ctx;
  const bench = config.benchmarks ?? DEFAULT_BENCH;

  // Semana exibida (segunda a domingo). Começa na semana corrente.
  const [semanaIni, setSemanaIni] = useState<Date>(() => inicioSemana(new Date()));

  // ...mas a reunião acontece na segunda, quando a semana corrente ainda não tem
  // post nenhum — e a pauta é sobre a semana que FECHOU. Se a semana de hoje
  // está vazia e a anterior tem posts medidos, abre na anterior. Só na primeira
  // carga dos dados: depois disso quem manda é a navegação de quem está lendo.
  const jaEscolheuSemana = useRef(false);
  useEffect(() => {
    if (jaEscolheuSemana.current) return;
    const todas = asRows(data);
    if (!todas.length) return;
    jaEscolheuSemana.current = true;
    if (todas.some((r) => dentro(dataDe(r), semanaIni, addDias(semanaIni, 7)))) return;
    const anterior = addDias(semanaIni, -7);
    if (todas.some((r) => dentro(dataDe(r), anterior, semanaIni))) setSemanaIni(anterior);
  }, [data, semanaIni]);

  // Semanas já FECHADAS (snapshot + registro da reunião). Ficam em estado local
  // e são recarregadas depois de cada fechamento.
  const [fechadas, setFechadas] = useState<Row[]>([]);
  const [recarga, setRecarga] = useState(0);
  useEffect(() => {
    let vivo = true;
    fetch('/api/query', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        view: 'v_relatorio_semanal',
        select: [
          'id', 'semana_inicio', 'alcance', 'visualizacoes', 'interacoes', 'seguidores',
          'posts_publicados', 'posts_planejados', 'fase', 'evento_externo', 'campanha',
          'aprendizado', 'estrutura_vencedora', 'erro_evitar', 'hipoteses', 'responsaveis',
          'prazos', 'metrica_esperada', 'fechado_em',
        ],
        orderBy: [{ field: 'semana_inicio', dir: 'desc' }],
        limit: 52,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (vivo) setFechadas(asRows((j as { data?: unknown } | null)?.data));
      })
      .catch(() => {
        /* silencioso: sem histórico a tela segue calculando ao vivo */
      });
    return () => {
      vivo = false;
    };
  }, [recarga]);

  // Os CARDS do cronograma entram por fora do dataSource: a tela precisa deles
  // pra dizer quantos posts foram planejados contra quantos saíram, e pra ler o
  // objetivo de funil (que vive no card, não na medição).
  const [cards, setCards] = useState<Row[]>([]);
  useEffect(() => {
    let vivo = true;
    fetch('/api/query', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        view: 'v_conteudo_posts',
        // `legenda` entra pra casar a medição com o card pelo texto publicado
        // (ver chaveTexto): só uma parte das medições tem post_id.
        select: ['id', 'titulo', 'data_programada', 'formato', 'estado', 'objetivo', 'legenda'],
        orderBy: [{ field: 'data_programada', dir: 'asc' }],
        limit: 200,
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (vivo) setCards(asRows((j as { data?: unknown } | null)?.data));
      })
      .catch(() => {
        /* silencioso: a seção de planejamento mostra "—" */
      });
    return () => {
      vivo = false;
    };
  }, []);

  const rel = useMemo(() => {
    const todas = asRows(data);
    const fimSemana = addDias(semanaIni, 7);
    const iniAnterior = addDias(semanaIni, -7);

    const daSemana = todas.filter((r) => dentro(dataDe(r), semanaIni, fimSemana));
    const daAnterior = todas.filter((r) => dentro(dataDe(r), iniAnterior, semanaIni));

    // Casamento medição ↔ card, em duas passadas: primeiro `post_id` (certeza),
    // depois o começo da legenda (heurística). Sem isso, quase toda medição
    // apareceria só com o trecho da legenda, e "Comenta CLAUDE aqui embaixo…"
    // não diz que post é.
    const porId = new Map(cards.map((c) => [str(c.id), c]));
    const porTexto = new Map<string, Row[]>();
    for (const c of cards) {
      const k = chaveTexto(str(c.legenda));
      if (k.length < 30) continue;
      porTexto.set(k, [...(porTexto.get(k) ?? []), c]);
    }
    const cardDe = (r: Row): Row | undefined => {
      const porPid = porId.get(str(r.post_id));
      if (porPid) return porPid;
      const k = chaveTexto(str(r.tema));
      if (k.length < 30) return undefined;
      const achados = porTexto.get(k);
      return achados?.length === 1 ? achados[0] : undefined;
    };

    const toPost = (r: Row): PostSemana => {
      const card = cardDe(r);
      return {
        row: r,
        d: derive(r, bench),
        titulo: card ? str(card.titulo) : '',
        descricao: str(r.tema).slice(0, 120),
        formato: str(r.formato) || '—',
        objetivo: card ? str(card.objetivo) : '',
        interacoes: interacoesDe(r),
        permalink: str(r.permalink),
        data: dataDe(r),
      };
    };

    const posts = daSemana.map(toPost).sort((a, b) => b.interacoes - a.interacoes);

    const agg = (rows: Row[]) => ({
      alcance: soma(rows, 'alcance'),
      views: soma(rows, 'visualizacoes'),
      interacoes: rows.reduce((a, r) => a + interacoesDe(r), 0),
      seguidores: soma(rows, 'seguidores'),
      posts: rows.length,
    });
    const cur = agg(daSemana);
    const prev = agg(daAnterior);
    const delta = (c: number, p: number) => (p === 0 ? null : ((c - p) / p) * 100);

    // Planejados = cards do cronograma com data na semana.
    const planejados = cards.filter((c) => dentro(dataDe(c, 'data_programada'), semanaIni, fimSemana));
    const porObjetivo = planejados.reduce<Record<string, number>>((acc, c) => {
      const k = str(c.objetivo) || 'indefinido';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});
    // Objetivo predominante = resposta da 1ª pergunta da pauta. "indefinido" não
    // conta: dizer que o objetivo da semana foi "não definido" não ajuda ninguém.
    const objetivoPredominante = Object.entries(porObjetivo)
      .filter(([k]) => k !== 'indefinido')
      .sort((a, b) => b[1] - a[1])
      .map(([chave, n]) => ({ chave, n }))[0] ?? null;

    const topPor = (f: (p: PostSemana) => number): PostSemana | null => {
      const ord = [...posts].filter((p) => f(p) > 0).sort((a, b) => f(b) - f(a));
      return ord[0] ?? null;
    };

    // MELHOR: mais interações no total. PIOR: menos interações por alcance —
    // usar o número cru puniria o post que simplesmente foi menos distribuído,
    // que é exatamente a distinção que o doc pede (falha de distribuição não é
    // falha de conteúdo).
    const melhor = posts[0] ?? null;
    const comTaxa = posts
      .map((p) => ({ p, taxa: (num(p.row.alcance) ?? 0) > 0 ? p.interacoes / (num(p.row.alcance) as number) : null }))
      .filter((x) => x.taxa != null) as Array<{ p: PostSemana; taxa: number }>;
    const pior = comTaxa.length > 1 ? comTaxa.sort((a, b) => a.taxa - b.taxa)[0].p : null;
    const alcanceMediano = mediana(posts.map((p) => num(p.row.alcance)));

    // A semana fechou há menos de 7 dias? Então os posts dela ainda estão
    // "verdes" perto dos da semana anterior (ver o aviso de maturação na tela).
    const semanaRecemFechada = Date.now() - fimSemana.getTime() < 7 * 24 * 3600 * 1000;

    return {
      posts,
      cur,
      semanaRecemFechada,
      delta: {
        alcance: delta(cur.alcance, prev.alcance),
        views: delta(cur.views, prev.views),
        interacoes: delta(cur.interacoes, prev.interacoes),
        seguidores: delta(cur.seguidores, prev.seguidores),
        posts: delta(cur.posts, prev.posts),
      },
      planejados: planejados.length,
      porObjetivo,
      objetivoPredominante,
      campeoes: {
        comentarios: topPor((p) => num(p.row.comentarios) ?? 0),
        curtidas: topPor((p) => num(p.row.curtidas) ?? 0),
        compart: topPor((p) => num(p.row.compartilhamentos) ?? 0),
        seguidores: topPor((p) => num(p.row.seguidores) ?? 0),
      },
      melhor,
      pior,
      alcanceMediano,
    };
  }, [data, cards, semanaIni, bench]);

  // Fechamento da semana exibida (se já existe) + o formulário de registro.
  const fechadaAtual = useMemo(
    () => fechadas.find((f) => chaveDiaDe(f.semana_inicio) === chaveDia(semanaIni)) ?? null,
    [fechadas, semanaIni],
  );
  const [form, setForm] = useState<Record<string, string>>({});
  /**
   * As oito respostas da desmontagem. Fica FORA do `form` porque o `form` é
   * espalhado direto no corpo do POST (`...form`), e o dna precisa viajar como
   * objeto aninhado — dentro do form ele viraria oito campos soltos que a rota
   * não conhece.
   */
  const [dna, setDna] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  // Troca de semana (ou chegada do histórico) recarrega o formulário com o que
  // foi registrado naquela semana — sem isso o texto de uma semana vazaria pra outra.
  useEffect(() => {
    setForm({
      fase: str(fechadaAtual?.fase),
      eventoExterno: str(fechadaAtual?.evento_externo),
      campanha: str(fechadaAtual?.campanha),
      aprendizado: str(fechadaAtual?.aprendizado),
      estruturaVencedora: str(fechadaAtual?.estrutura_vencedora),
      erroEvitar: str(fechadaAtual?.erro_evitar),
      hipoteses: str(fechadaAtual?.hipoteses),
      responsaveis: str(fechadaAtual?.responsaveis),
      prazos: str(fechadaAtual?.prazos),
      metricaEsperada: str(fechadaAtual?.metrica_esperada),
    });
    // O `dna` vem como JSON da view; só as chaves de texto entram, para uma
    // linha antiga com formato diferente não derrubar a tela.
    const bruto = fechadaAtual?.dna;
    const limpo: Record<string, string> = {};
    if (bruto != null && typeof bruto === 'object' && !Array.isArray(bruto)) {
      for (const [k, v] of Object.entries(bruto as Record<string, unknown>)) {
        if (typeof v === 'string') limpo[k] = v;
      }
    }
    setDna(limpo);
    setErroSalvar(null);
  }, [fechadaAtual, semanaIni]);

  async function fecharSemana() {
    setSalvando(true);
    setErroSalvar(null);
    try {
      const resumo = (p: PostSemana | null) =>
        p ? { titulo: p.titulo || p.descricao, permalink: p.permalink, interacoes: p.interacoes } : null;
      const res = await fetch('/api/relatorio', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semanaInicio: chaveDia(semanaIni),
          alcance: rel.cur.alcance,
          visualizacoes: rel.cur.views,
          interacoes: rel.cur.interacoes,
          seguidores: rel.cur.seguidores,
          postsPublicados: rel.cur.posts,
          postsPlanejados: rel.planejados,
          destaques: {
            comentarios: resumo(rel.campeoes.comentarios),
            curtidas: resumo(rel.campeoes.curtidas),
            compartilhamentos: resumo(rel.campeoes.compart),
            seguidores: resumo(rel.campeoes.seguidores),
            melhor: resumo(rel.melhor),
            pior: resumo(rel.pior),
          },
          dna,
          ...form,
        }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(j?.error ?? `falha ao gravar (${res.status})`);
      }
      setRecarga((n) => n + 1);
    } catch (e) {
      setErroSalvar(e instanceof Error ? e.message : 'falha ao gravar');
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <div>
        <SectionHeader title="Relatório da semana" subtitle="Carregando…" icon="🗓️" />
        <SkeletonCards count={4} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <SectionHeader title="Relatório da semana" icon="🗓️" />
        <EmptyState icon="⚠️" message={`Não deu pra carregar as medições: ${error}`} />
      </div>
    );
  }

  const navBtn =
    'grid h-8 w-8 place-items-center rounded-lg border border-gray-700 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-gray-100';

  return (
    <div>
      <SectionHeader
        title="Reunião estratégica — Marketing e Lançamento"
        subtitle="O que funcionou, o que não funcionou e o que vira decisão para a próxima semana."
        icon="🗓️"
      />

      {/* Navegação de semana */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-700/60 bg-gray-900/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <button type="button" className={navBtn} aria-label="Semana anterior" onClick={() => setSemanaIni((s) => addDias(s, -7))}>
            ‹
          </button>
          <div className="text-[15px] font-semibold text-gray-100" style={DISPLAY}>
            {rotuloSemana(semanaIni)}
          </div>
          <button type="button" className={navBtn} aria-label="Próxima semana" onClick={() => setSemanaIni((s) => addDias(s, 7))}>
            ›
          </button>
        </div>
        <button
          type="button"
          className="rounded-lg border border-gray-700 px-3 py-1.5 text-[12px] text-gray-300 transition-colors hover:bg-gray-700/50"
          onClick={() => setSemanaIni(inicioSemana(new Date()))}
        >
          Semana atual
        </button>
      </div>

      {/* ===== 1. Contexto da semana ===== */}
      <Secao n={1} titulo="Contexto da semana" hint="comparação sempre com a semana anterior">
        {/* Grade assimétrica: alcance e interações ocupam duas colunas cada, os
            outros três ficam menores. É a hierarquia da conversa, não decoração. */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicador
            label="Alcance total"
            valor={fmtInt(rel.cur.alcance)}
            delta={rel.delta.alcance}
            hint="somando os posts da semana"
            acento="alcance"
            destaque
          />
          <Indicador
            label="Interações"
            valor={fmtInt(rel.cur.interacoes)}
            delta={rel.delta.interacoes}
            hint="curtidas + comentários + compart. + salvos"
            acento="interacoes"
            destaque
          />
          <Indicador label="Visualizações" valor={fmtInt(rel.cur.views)} delta={rel.delta.views} acento="views" />
          <Indicador
            label="Novos seguidores"
            valor={fmtInt(rel.cur.seguidores)}
            delta={rel.delta.seguidores}
            hint="atribuídos aos posts"
            acento="seguidores"
          />
          <Indicador
            label="Posts publicados"
            valor={`${fmtInt(rel.cur.posts)}${rel.planejados ? ` de ${rel.planejados}` : ''}`}
            delta={rel.delta.posts}
            hint={rel.planejados ? 'publicados de planejados' : 'sem cronograma nesta semana'}
            acento="posts"
          />
        </div>

        {/* Aviso de MATURAÇÃO: um post continua somando alcance por dias depois de
            publicado. Quando a semana exibida acabou de fechar, os posts dela têm
            menos tempo de vida que os da semana anterior, e a comparação puxa pra
            baixo sozinha. Sem essa linha, a reunião lê queda de desempenho onde
            pode haver só post novo. Some quando a semana já amadureceu. */}
        {rel.semanaRecemFechada && rel.cur.posts > 0 && (
          <p className="mt-2 text-[11px] leading-relaxed text-amber-200/80">
            Os posts desta semana tiveram menos tempo para acumular números que os da semana anterior — um
            post segue ganhando alcance por vários dias. Parte da variação acima é maturação, não desempenho.
          </p>
        )}

        {/* As 5 perguntas de abertura da pauta, com a resposta de cada uma. As duas
            que saem dos dados vêm calculadas; as três que dependem de contexto do
            negócio são campos, gravados junto no "Fechar semana". */}
        <div className={`${CARD} mt-3`}>
          <div className="mb-2 text-[11px] uppercase tracking-wide text-gray-400">As cinco perguntas de abertura</div>

          <Linha termo="1. Objetivo principal dos conteúdos">
            {rel.objetivoPredominante ? (
              <>
                <strong className="text-gray-100">{OBJETIVO_LABEL[rel.objetivoPredominante.chave]}</strong>{' '}
                <span className="text-gray-400">
                  ({rel.objetivoPredominante.n} de {rel.planejados} posts planejados)
                </span>
              </>
            ) : (
              <span className="text-gray-400">
                nenhum post da semana tem objetivo marcado. Defina no editor do post, em Conteúdo → Cronograma.
              </span>
            )}
          </Linha>

          <Linha termo="2. Em que fase estávamos">
            <select
              value={form.fase ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, fase: e.target.value }))}
              aria-label="Fase da semana"
              className="rounded-lg border border-gray-600 bg-gray-900 px-2.5 py-1.5 text-[13px] text-gray-100 focus:border-blue-500/70 focus:outline-none"
            >
              {FASE_OPTS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <span className="ml-2 text-[11px] text-gray-400">
              muda a régua: conteúdo de atração não se julga pelos números de um de conversão
            </span>
          </Linha>

          <Linha termo="3. Evento externo que influenciou">
            <input
              type="text"
              value={form.eventoExterno ?? ''}
              placeholder="Ex.: feriado, queda do Instagram, notícia grande no nicho. Vazio = nada relevante."
              onChange={(e) => setForm((f) => ({ ...f, eventoExterno: e.target.value }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-1.5 text-[13px] text-gray-100 placeholder-gray-500 focus:border-blue-500/70 focus:outline-none"
            />
          </Linha>

          <Linha termo="4. Planejados e publicados">
            <strong className="text-gray-100">{fmtInt(rel.cur.posts)} publicados</strong>{' '}
            <span className="text-gray-400">
              {rel.planejados ? `de ${rel.planejados} planejados no cronograma` : '(nenhum post planejado no cronograma desta semana)'}
            </span>
            {rel.planejados > 0 && rel.cur.posts < rel.planejados && (
              <span className="ml-2 text-amber-300">· {rel.planejados - rel.cur.posts} não saíram</span>
            )}
          </Linha>

          <Linha termo="5. Campanha, evento ou oferta">
            <input
              type="text"
              value={form.campanha ?? ''}
              placeholder="Ex.: Semana do Zero ao Programador Contratado (10 a 16/08)."
              onChange={(e) => setForm((f) => ({ ...f, campanha: e.target.value }))}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-1.5 text-[13px] text-gray-100 placeholder-gray-500 focus:border-blue-500/70 focus:outline-none"
            />
          </Linha>

          {Object.keys(rel.porObjetivo).length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-700/50 pt-3 text-[12px] text-gray-400">
              <span className="text-gray-400">Objetivo dos posts planejados:</span>
              {Object.entries(rel.porObjetivo).map(([k, n]) => (
                <span key={k} className="rounded-full border border-gray-700 px-2.5 py-0.5">
                  {OBJETIVO_LABEL[k] ?? 'Não definido'} · {n}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 text-[11px] text-gray-400">
            O que você escrever aqui é gravado no “Fechar semana”, na seção 8.
          </div>
        </div>

        <SemDado>
          <strong>Cliques, leads, inscrições no evento e vendas não entram aqui.</strong> Esses números vivem na landing
          page e no checkout; o que a API do Instagram devolve para no engajamento. Enquanto não forem trazidos para o
          OS, as linhas de conversão da pauta continuam sendo preenchidas à mão.
        </SemDado>
      </Secao>

      {/* ===== 2. Posts da semana ===== */}
      <Secao n={2} titulo="Posts da semana" hint="números crus e as taxas sobre alcance">
        {rel.posts.length === 0 ? (
          <EmptyState icon="📭" message="Nenhum post medido nesta semana. Use “Sincronizar” na aba Desempenho." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700/60">
            <table className="w-full min-w-[860px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-900/80 text-left text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2.5 font-medium">Post</th>
                  <th className="px-3 py-2.5 font-medium">Formato</th>
                  <th className="px-3 py-2.5 text-right font-medium">Alcance</th>
                  <th className="px-3 py-2.5 text-right font-medium">Curtidas</th>
                  <th className="px-3 py-2.5 text-right font-medium">Coment.</th>
                  <th className="px-3 py-2.5 text-right font-medium">Compart.</th>
                  <th className="px-3 py-2.5 text-right font-medium">Salvos</th>
                  <th className="px-3 py-2.5 font-medium">Classe</th>
                </tr>
              </thead>
              <tbody>
                {rel.posts.map((p, i) => (
                  <tr key={i} className="border-t border-gray-700/40 align-top transition-colors hover:bg-gray-800/40">
                    <td className="max-w-[320px] px-3 py-2.5">
                      {p.titulo ? (
                        <>
                          <div className="line-clamp-2 font-medium text-gray-100">{p.titulo}</div>
                          <div className="mt-0.5 line-clamp-1 text-[11px] text-gray-400">{p.descricao}</div>
                        </>
                      ) : (
                        <div className="line-clamp-2 text-gray-300">{p.descricao || 'Sem título'}</div>
                      )}
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px]">
                        {OBJETIVO_LABEL[p.objetivo] && (
                          <span className="text-violet-300/80">🎯 {OBJETIVO_LABEL[p.objetivo]}</span>
                        )}
                        {p.permalink && (
                          <a href={p.permalink} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">
                            abrir ↗
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-400">{p.formato}</td>
                    <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>{fmtInt(num(p.row.alcance))}</td>
                    <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>
                      {fmtInt(num(p.row.curtidas))}
                      <div className="text-[11px] text-gray-400">{fmtRate(p.d.taxaCurtidas)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>
                      {fmtInt(num(p.row.comentarios))}
                      <div className="text-[11px] text-gray-400">{fmtRate(p.d.taxaComentarios)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>
                      {fmtInt(num(p.row.compartilhamentos))}
                      <div className="text-[11px] text-gray-400">{fmtRate(p.d.taxaCompart)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>
                      {fmtInt(num(p.row.salvamentos))}
                      <div className="text-[11px] text-gray-400">{fmtRate(p.d.taxaSalv)}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Pill classe={p.d.geral} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>

      {/* ===== 3. Campeões ===== */}
      <Secao n={3} titulo="Melhores posts da semana" hint="um campeão por comportamento da audiência">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Campeao titulo="Comentários" icone="💬" acento="alcance" post={rel.campeoes.comentarios} metrica={(p) => num(p.row.comentarios) ?? 0} unidade="comentários" />
          <Campeao titulo="Curtidas" icone="❤️" acento="interacoes" post={rel.campeoes.curtidas} metrica={(p) => num(p.row.curtidas) ?? 0} unidade="curtidas" />
          <Campeao titulo="Compartilhamentos" icone="🔁" acento="posts" post={rel.campeoes.compart} metrica={(p) => num(p.row.compartilhamentos) ?? 0} unidade="compart." />
          <Campeao titulo="Seguidores" icone="📈" acento="seguidores" post={rel.campeoes.seguidores} metrica={(p) => num(p.row.seguidores) ?? 0} unidade="novos seguidores" />
        </div>
        <SemDado>
          O doc pede um quinto campeão, o de <strong>resultado para o negócio</strong> (cliques, leads, inscrições ou
          vendas). Ele não pode ser calculado hoje. “Seguidores” é o mais perto que os dados chegam de resultado, e não
          substitui inscrição no evento.
        </SemDado>
      </Secao>

      {/* ===== 4. DNA do melhor post ===== */}
      <Secao n={4} titulo="Desmontando o melhor post" hint="o post com mais interações na semana">
        {!rel.melhor ? (
          <EmptyState icon="📭" message="Sem post medido nesta semana." />
        ) : (
          /* Card do VENCEDOR: fundo esverdeado e barra lateral. Ao lado do card
             do pior (âmbar), a diferença é lida antes do texto. */
          <div className="rounded-2xl border border-emerald-500/25 border-l-[3px] border-l-emerald-400/70 bg-emerald-500/[0.04] p-4">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
              🏆 Melhor da semana
            </div>
            <div className="text-[16px] font-semibold text-gray-50" style={DISPLAY}>
              {rel.melhor.titulo || rel.melhor.descricao || 'Sem título'}
            </div>
            {rel.melhor.titulo && <div className="mt-0.5 text-[12px] text-gray-400">{rel.melhor.descricao}</div>}
            <div className="mt-3">
              <Linha termo="Formato">{rel.melhor.formato}</Linha>
              <Linha termo="Objetivo no funil">{OBJETIVO_LABEL[rel.melhor.objetivo] ?? 'não definido no card'}</Linha>
              <Linha termo="Alcance">{fmtInt(num(rel.melhor.row.alcance))}</Linha>
              <Linha termo="Interações">
                {fmtInt(rel.melhor.interacoes)} · curtidas {fmtRate(rel.melhor.d.taxaCurtidas)} · comentários{' '}
                {fmtRate(rel.melhor.d.taxaComentarios)}
              </Linha>
              <Linha termo="Compartilhamento / salvamento">
                {fmtRate(rel.melhor.d.taxaCompart)} e {fmtRate(rel.melhor.d.taxaSalv)} <Pill classe={rel.melhor.d.geral} />
              </Linha>
              <Linha termo="Seguidores gerados">{fmtInt(num(rel.melhor.row.seguidores))}</Linha>
            </div>

            {/* A tabela da seção 5 do doc, na íntegra: as perguntas são o roteiro
                dos 10 minutos, e sem elas a desmontagem vira conversa solta. */}
            <TabelaDna
              dna={dna}
              onChange={(campo, valor) => setDna((d) => ({ ...d, [campo]: valor }))}
              medicaoId={str(rel.melhor.row.id)}
              temCard={!!str(rel.melhor.row.post_id)}
              onPrePreencher={(respostas) => {
                let n = 0;
                setDna((atual) => {
                  const novo = { ...atual };
                  for (const [campo, texto] of Object.entries(respostas)) {
                    if (!novo[campo]?.trim() && texto?.trim()) {
                      novo[campo] = texto;
                      n++;
                    }
                  }
                  return novo;
                });
                return n;
              }}
              formato={rel.melhor.formato}
              resultado={
                <>
                  {fmtInt(num(rel.melhor.row.alcance))} de alcance · {fmtInt(rel.melhor.interacoes)} interações ·{' '}
                  {fmtInt(num(rel.melhor.row.seguidores))} seguidores
                  <span className="mt-0.5 block text-[11px] text-gray-500">leads e vendas: fora do OS</span>
                </>
              }
            />

            <p className="mt-3 rounded-xl border border-gray-700/50 bg-gray-900/40 px-3 py-2 text-[12px] leading-relaxed text-gray-400">
              <span className="text-gray-300">Exemplo de estrutura vencedora:</span> crença comum → quebra de
              expectativa → exemplo visual → explicação simples → CTA direto.
            </p>
            {rel.melhor.permalink && (
              <a
                href={rel.melhor.permalink}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-[12px] text-blue-300 hover:underline"
              >
                abrir no Instagram ↗
              </a>
            )}
          </div>
        )}
      </Secao>

      {/* ===== 5. Pior post ===== */}
      <Secao n={5} titulo="Pior post da semana" hint="pela menor interação por alcance, não pelo menor número">
        {!rel.pior ? (
          <EmptyState icon="📭" message="Precisa de pelo menos dois posts medidos na semana para comparar." />
        ) : (
          (() => {
            const alc = num(rel.pior.row.alcance);
            const poucoAlcance = alc != null && rel.alcanceMediano != null && alc < rel.alcanceMediano * 0.6;
            return (
              <div className="rounded-2xl border border-amber-500/25 border-l-[3px] border-l-amber-400/70 bg-amber-500/[0.04] p-4">
                <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
                  🔎 Precisa de diagnóstico
                </div>
                <div className="text-[16px] font-semibold text-gray-50" style={DISPLAY}>
                  {rel.pior.titulo || rel.pior.descricao || 'Sem título'}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-gray-400">
                  {rel.pior.titulo && <span className="line-clamp-1">{rel.pior.descricao}</span>}
                  {rel.pior.permalink && (
                    <a href={rel.pior.permalink} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">
                      abrir ↗
                    </a>
                  )}
                </div>
                <div className="mt-3">
                  <Linha termo="Etapa que falhou">
                    {poucoAlcance ? (
                      <>
                        <strong className="text-amber-200">Distribuição.</strong> O alcance ({fmtInt(alc)}) ficou bem
                        abaixo da mediana da semana ({fmtInt(rel.alcanceMediano)}). Investigar gancho, tema e horário
                        antes de culpar o conteúdo.
                      </>
                    ) : (
                      <>
                        <strong className="text-amber-200">Interação.</strong> Foi entregue tanto quanto os outros
                        ({fmtInt(alc)} de alcance), mas quase não gerou ação. Olhar clareza da promessa, utilidade e CTA.
                      </>
                    )}
                  </Linha>
                  <Linha termo="Interações">
                    {fmtInt(rel.pior.interacoes)} · curtidas {fmtRate(rel.pior.d.taxaCurtidas)} · comentários{' '}
                    {fmtRate(rel.pior.d.taxaComentarios)}
                  </Linha>
                  <Linha termo="Compartilhamento / salvamento">
                    {fmtRate(rel.pior.d.taxaCompart)} e {fmtRate(rel.pior.d.taxaSalv)} <Pill classe={rel.pior.d.geral} />
                  </Linha>
                  <Linha termo="Retenção">
                    {rel.pior.formato.toLowerCase() === 'reel'
                      ? fmtRate(rel.pior.d.retencao)
                      : 'só existe em Reel. Carrossel não reporta retenção por slide.'}
                  </Linha>
                </div>
              </div>
            );
          })()
        )}
      </Secao>

      {/* ===== 6. Melhor × pior ===== */}
      {rel.melhor && rel.pior && (
        <Secao n={6} titulo="Melhor × pior" hint="a diferença que vira aprendizado">
          <div className="overflow-x-auto rounded-2xl border border-gray-700/60">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-900/80 text-left text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2.5 font-medium">Comparação</th>
                  <th className="px-3 py-2.5 font-medium">Melhor</th>
                  <th className="px-3 py-2.5 font-medium">Pior</th>
                </tr>
              </thead>
              <tbody className="text-gray-200">
                {[
                  ['Alcance', fmtInt(num(rel.melhor.row.alcance)), fmtInt(num(rel.pior.row.alcance))],
                  ['Interações', fmtInt(rel.melhor.interacoes), fmtInt(rel.pior.interacoes)],
                  ['Taxa de comentários', fmtRate(rel.melhor.d.taxaComentarios), fmtRate(rel.pior.d.taxaComentarios)],
                  ['Taxa de compartilhamento', fmtRate(rel.melhor.d.taxaCompart), fmtRate(rel.pior.d.taxaCompart)],
                  ['Taxa de salvamento', fmtRate(rel.melhor.d.taxaSalv), fmtRate(rel.pior.d.taxaSalv)],
                  ['Formato', rel.melhor.formato, rel.pior.formato],
                ].map(([k, a, b]) => (
                  <tr key={k} className="border-t border-gray-700/40">
                    <td className="px-3 py-2.5 text-gray-400">{k}</td>
                    <td className="px-3 py-2.5">{a}</td>
                    <td className="px-3 py-2.5">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Secao>
      )}

      {/* ===== 7. Decisões ===== */}
      <Secao n={7} titulo="Decisões para os próximos posts" hint="a reunião só termina com isto definido">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[
            { t: 'Repetir', i: '✅', xs: ['Ganchos que seguraram e geraram compartilhamento', 'Temas que ligaram dor real a exemplo prático', 'Formatos e CTAs que trouxeram gente pra DM'] },
            { t: 'Evitar', i: '🚫', xs: ['Capa genérica, sem promessa clara', 'Introdução longa ou técnica demais', 'CTA que não combina com o conteúdo'] },
            { t: 'Testar', i: '🧪', xs: ['Dois ganchos para temas parecidos', 'Transformar o melhor carrossel em Reel', 'Aplicar a estrutura vencedora em outro assunto'] },
          ].map((c) => (
            <div key={c.t} className={CARD}>
              <div className="text-[13px] font-semibold text-gray-100">
                {c.i} {c.t}
              </div>
              <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-gray-400">
                {c.xs.map((x) => (
                  <li key={x}>· {x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-2 text-[12px] text-gray-400">
          No máximo três hipóteses por semana: mexer em muita variável ao mesmo tempo impede saber o que causou a
          mudança.
        </div>
      </Secao>

      {/* ===== 8. Registro da reunião ===== */}
      <Secao
        n={8}
        titulo="Registro da reunião"
        hint={fechadaAtual ? `fechada em ${fmtDiaMes(dataDe(fechadaAtual, 'fechado_em'))}` : 'ainda não fechada'}
      >
        <div className={CARD}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {[
              ['aprendizado', 'Aprendizado principal', 'Ex.: post com comparação rendeu mais compartilhamento.'],
              ['estruturaVencedora', 'Estrutura vencedora', 'Ex.: crença comum → quebra → exemplo → CTA.'],
              ['erroEvitar', 'Erro a evitar', 'Ex.: capa abstrata, sem promessa.'],
              ['hipoteses', 'Hipóteses da semana', 'No máximo três.'],
              ['responsaveis', 'Responsáveis', 'Quem faz roteiro, design e publicação.'],
              ['prazos', 'Prazos', 'Produção, revisão e publicação.'],
              ['metricaEsperada', 'Métrica esperada', 'Ex.: +15% de compartilhamento por alcance.'],
            ].map(([campo, rotulo, dica]) => (
              <label key={campo} className="block">
                <span className="text-[11px] uppercase tracking-wide text-gray-400">{rotulo}</span>
                <textarea
                  rows={2}
                  value={form[campo] ?? ''}
                  placeholder={dica}
                  onChange={(e) => setForm((f) => ({ ...f, [campo]: e.target.value }))}
                  className="mt-1 w-full resize-y rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-[13px] text-gray-100 placeholder-gray-500 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fecharSemana}
              disabled={salvando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-60"
            >
              {salvando ? 'Gravando…' : fechadaAtual ? 'Atualizar fechamento' : 'Fechar semana'}
            </button>
            <span className="text-[12px] text-gray-400">
              Congela os números desta semana e guarda a decisão. Refechar atualiza a mesma linha.
            </span>
            {erroSalvar && <span className="text-[12px] text-red-300">{erroSalvar}</span>}
          </div>
        </div>
      </Secao>

      {/* ===== 9. Histórico ===== */}
      <Secao n={9} titulo="Semana a semana" hint="os números como foram fechados, sem recalcular">
        {fechadas.length === 0 ? (
          <EmptyState icon="🗄️" message="Nenhuma semana fechada ainda. Feche esta para começar a série." />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-700/60">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-gray-900/80 text-left text-[11px] uppercase tracking-wide text-gray-400">
                  <th className="px-3 py-2.5 font-medium">Semana</th>
                  <th className="px-3 py-2.5 text-right font-medium">Alcance</th>
                  <th className="px-3 py-2.5 text-right font-medium">Interações</th>
                  <th className="px-3 py-2.5 text-right font-medium">Seguidores</th>
                  <th className="px-3 py-2.5 text-right font-medium">Posts</th>
                  <th className="px-3 py-2.5 font-medium">Aprendizado</th>
                </tr>
              </thead>
              <tbody>
                {fechadas.map((f) => {
                  const ini = dataDe(f, 'semana_inicio');
                  const atual = chaveDiaDe(f.semana_inicio) === chaveDia(semanaIni);
                  return (
                    <tr
                      key={str(f.id)}
                      className={`border-t border-gray-700/40 ${atual ? 'bg-blue-500/[0.07]' : ''}`}
                    >
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          className="text-left text-gray-100 hover:underline"
                          onClick={() => ini && setSemanaIni(inicioSemana(ini))}
                        >
                          {ini ? rotuloSemana(inicioSemana(ini)) : '—'}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>{fmtInt(num(f.alcance))}</td>
                      <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>{fmtInt(num(f.interacoes))}</td>
                      <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>{fmtInt(num(f.seguidores))}</td>
                      <td className="px-3 py-2.5 text-right text-gray-100" style={NUM}>
                        {fmtInt(num(f.posts_publicados))}
                        {num(f.posts_planejados) ? (
                          <span className="text-gray-500">/{fmtInt(num(f.posts_planejados))}</span>
                        ) : null}
                      </td>
                      <td className="max-w-[280px] px-3 py-2.5">
                        <div className="line-clamp-2 text-gray-300">{str(f.aprendizado) || '—'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Secao>
    </div>
  );
}

/** Definição registrável do bloco custom "Relatório da semana". */
export const conteudoRelatorio: BlockDefinition = {
  type: 'custom:conteudo-relatorio',
  component: ConteudoRelatorioBlock,
  defaultDataShape: 'collection',
};
