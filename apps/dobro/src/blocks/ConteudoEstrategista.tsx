/**
 * apps/dobro — bloco CUSTOM: "Estrategista" (Story 2 do epic Social Media Estrategista).
 *
 * Menu de 5 MODOS de IA (um por prompt do dono): diagnóstico do perfil, reparador
 * de conteúdo, engenheiro de alcance, conversor em vendas e plano de 30 dias. A
 * tela roda o motor de Lead Score no client (briefing de desempenho) + guarda o
 * "Perfil do negócio" no navegador (localStorage) e manda os dois pra
 * `POST /api/conteudo/estrategista`, que preenche o prompt do modo e chama a Claude.
 * v1: só exibe a análise (não grava rascunhos).
 */

import { useMemo, useState } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';
import {
  construirContexto,
  rankear,
  agregarPorFormato,
  agregarPorDiaSemana,
  nivelConfianca,
  OBJETIVO_LABEL,
  SINAL_LABEL,
  type Objetivo,
  type PostMetrics,
  type Rotulo,
  type ScoredPost,
} from './social-analise';

type Row = Record<string, unknown>;
type ModoId = 'diagnostico' | 'conteudo' | 'alcance' | 'vendas' | 'plano30';
interface Perfil {
  direcao: string;
  bio: string;
  destaques: string;
  produto: string;
  ticket: string;
  comoVende: string;
  objecao: string;
  tempoDia: string;
  publico: string;
}
interface Secao {
  titulo: string;
  conteudo: string;
}
interface Analise {
  resumo: string;
  secoes: Secao[];
  entregavel: { titulo: string; texto: string } | null;
}
interface ConteudoEstrategistaConfig {
  objetivo?: Objetivo;
}

/** Pivô/foco atual do perfil — pré-preenche o campo "Direção". Editável na tela. */
const DIRECAO_DEFAULT =
  'Estamos pivotando: de ensino de programação para leigos para ensinar IA e automações para quem já ' +
  'tem conhecimento mínimo de tecnologia (conteúdo para leigos não converte mais). No último mês os ' +
  'carrosséis performaram muito melhor que os Reels, então estamos priorizando CARROSSEL agora.';

const PERFIL_VAZIO: Perfil = {
  direcao: DIRECAO_DEFAULT, bio: '', destaques: '', produto: '', ticket: '', comoVende: '', objecao: '', tempoDia: '', publico: '',
};
const PERFIL_KEY = 'dobro:perfil-negocio';

/** Campos do perfil que cada modo usa (para avisar o que preencher). */
const MODOS_UI: { id: ModoId; icone: string; titulo: string; funcao: string; campos: (keyof Perfil)[] }[] = [
  { id: 'diagnostico', icone: '🔎', titulo: 'Diagnóstico do perfil', funcao: 'Auditoria: erros, bio, destaques e feed', campos: ['bio', 'destaques', 'publico'] },
  { id: 'conteudo', icone: '🛠️', titulo: 'Reparador de conteúdo', funcao: '4 pilares, 10 ideias e o melhor post pronto', campos: ['publico'] },
  { id: 'alcance', icone: '📡', titulo: 'Engenheiro de alcance', funcao: 'Retenção, conteúdo que viraliza e 3 ganchos', campos: ['publico'] },
  { id: 'vendas', icone: '💰', titulo: 'Conversor em vendas', funcao: 'Sistema de conversão, DM e post de venda', campos: ['produto', 'ticket', 'comoVende', 'objecao', 'publico'] },
  { id: 'plano30', icone: '🗓️', titulo: 'Plano de 30 dias', funcao: '4 semanas: base, alcance, engajamento, conversão', campos: ['tempoDia', 'publico'] },
];
const CAMPO_LABEL: Record<keyof Perfil, string> = {
  direcao: 'Direção estratégica atual (pivô/foco)', bio: 'Bio atual', destaques: 'Destaques (nomes)',
  produto: 'Produto/serviço', ticket: 'Ticket/preço', comoVende: 'Como vende hoje', objecao: 'Objeção principal',
  tempoDia: 'Tempo por dia', publico: 'Público ideal / maior dor',
};
const CAMPOS_LONGOS: (keyof Perfil)[] = ['direcao', 'bio', 'comoVende', 'objecao', 'publico'];

const FLABEL: Record<string, string> = { reel: 'Reels', carrossel: 'Carrossel', post: 'Post', story: 'Story' };
const fl = (f: string) => FLABEL[f.toLowerCase()] ?? f;
const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;
const ROTULO_TONE: Record<Rotulo, string> = {
  Campeão: 'text-emerald-300', Bom: 'text-sky-300', Médio: 'text-amber-300', Fraco: 'text-red-300',
};

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
function toPostMetrics(r: Row, i: number): PostMetrics {
  return {
    id: str(r.id) || str(r.post_id) || `row-${i}`,
    formato: (str(r.formato) || 'post').toLowerCase(),
    data: str(r.data) || null,
    tema: str(r.tema) || null,
    alcance: num(r.alcance),
    comentarios: num(r.comentarios),
    visitasPerfil: num(r.visitas_perfil),
    salvamentos: num(r.salvamentos),
    compartilhamentos: num(r.compartilhamentos),
    seguidores: num(r.seguidores),
    curtidas: num(r.curtidas),
  };
}
const tituloDe = (p: PostMetrics) => (p.tema?.trim() || fl(p.formato)).slice(0, 160);

function loadPerfil(): Perfil {
  try {
    const raw = localStorage.getItem(PERFIL_KEY);
    if (raw) return { ...PERFIL_VAZIO, ...(JSON.parse(raw) as Partial<Perfil>) };
  } catch {
    /* localStorage indisponível ou JSON inválido → vazio */
  }
  return PERFIL_VAZIO;
}
function savePerfil(p: Perfil): void {
  try {
    localStorage.setItem(PERFIL_KEY, JSON.stringify(p));
  } catch {
    /* ignora quota/indisponível */
  }
}

/** Monta o briefing de desempenho (mesma forma esperada pelo servidor) + ranking. */
function buildBriefing(posts: PostMetrics[], objetivo: Objetivo) {
  const ctx = construirContexto(posts, objetivo);
  const { ranked } = rankear(posts, ctx);
  const conf = nivelConfianca(posts);
  const post = (sp: (typeof ranked)[number]) => ({
    score: sp.score, rotulo: sp.rotulo, formato: fl(sp.post.formato),
    taxaTop: sp.taxaTop ? SINAL_LABEL[sp.taxaTop] : null, tema: tituloDe(sp.post),
  });
  return {
    briefing: {
      objetivoLabel: OBJETIVO_LABEL[objetivo],
      confianca: conf.nivel,
      totalPosts: conf.n,
      porFormato: agregarPorFormato(posts, ctx).map((a) => ({ chave: fl(a.formato), scoreMedio: a.scoreMedio, n: a.n })),
      porDia: agregarPorDiaSemana(posts, ctx).map((a) => ({ chave: a.label, scoreMedio: a.scoreMedio, n: a.n })),
      campeoes: ranked.slice(0, 10).map(post),
      piores: ranked.slice(-5).reverse().map(post),
    },
    temDados: ranked.length > 0,
    ranked,
  };
}

async function pedirAnalise(modo: ModoId, briefing: unknown, perfil: Perfil): Promise<Analise> {
  const res = await fetch('/api/conteudo/estrategista', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ modo, briefing, perfil }),
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new Error(msg);
  }
  const j = (await res.json()) as { analise?: Analise };
  if (!j?.analise) throw new Error('Resposta sem análise.');
  return j.analise;
}

/** Converte \n/\t escritos como texto literal em quebras/espaços reais. */
function normalizarQuebras(s: string): string {
  return s.replace(/\\r\\n|\\r|\\n/g, '\n').replace(/\\t/g, ' ');
}

/** Renderiza o conteúdo de uma seção: linhas "- " viram lista; resto, parágrafo. */
function ConteudoTexto({ texto }: { texto: string }) {
  const linhas = normalizarQuebras(texto).split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <div className="space-y-1.5 text-[14px] leading-relaxed text-gray-200">
      {linhas.map((l, i) =>
        /^[-•]\s+/.test(l) ? (
          <div key={i} className="flex gap-2">
            <span className="mt-0.5 shrink-0 text-blue-400" aria-hidden="true">•</span>
            <span>{l.replace(/^[-•]\s+/, '')}</span>
          </div>
        ) : (
          <p key={i} className="whitespace-pre-line">{l}</p>
        ),
      )}
    </div>
  );
}

function PerfilForm({ perfil, onChange }: { perfil: Perfil; onChange: (p: Perfil) => void }) {
  const [aberto, setAberto] = useState(false);
  const chaves = Object.keys(PERFIL_VAZIO) as (keyof Perfil)[];
  const preenchidos = chaves.filter((k) => perfil[k].trim()).length;
  const set = (k: keyof Perfil, v: string) => onChange({ ...perfil, [k]: v });
  const inputCls =
    'w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500/70 focus:outline-none focus:ring-1 focus:ring-blue-500/40';

  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-900/30">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Perfil do negócio <span className="text-gray-600">({preenchidos}/{chaves.length} preenchidos)</span>
        </span>
        <span className={`text-gray-500 transition-transform ${aberto ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
      </button>
      {aberto && (
        <div className="grid grid-cols-1 gap-3 border-t border-gray-800 p-4 sm:grid-cols-2">
          {(Object.keys(PERFIL_VAZIO) as (keyof Perfil)[]).map((k) => (
            <label key={k} className={`block ${CAMPOS_LONGOS.includes(k) ? 'sm:col-span-2' : ''}`}>
              <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-gray-500">{CAMPO_LABEL[k]}</span>
              {CAMPOS_LONGOS.includes(k) ? (
                <textarea rows={2} value={perfil[k]} onChange={(e) => set(k, e.target.value)} className={`${inputCls} resize-y`} />
              ) : (
                <input value={perfil[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
              )}
            </label>
          ))}
          <p className="text-[11px] text-gray-600 sm:col-span-2">
            Salvo neste navegador. Usado pelos modos que precisam de contexto (Diagnóstico, Vendas, Plano de 30 dias).
          </p>
        </div>
      )}
    </div>
  );
}

function ConteudoEstrategistaBlock({ config, ctx }: BlockProps<ConteudoEstrategistaConfig>) {
  const { data, loading, error } = ctx;
  const [objetivo, setObjetivo] = useState<Objetivo>(config.objetivo ?? 'lead');
  const [modo, setModo] = useState<ModoId>('conteudo');
  const [perfil, setPerfil] = useState<Perfil>(() => loadPerfil());
  const [gerando, setGerando] = useState(false);
  const [analise, setAnalise] = useState<Analise | null>(null);
  const [erroGerar, setErroGerar] = useState<string | null>(null);
  const [mostrarRanking, setMostrarRanking] = useState(false);

  const posts = useMemo(() => asRows(data).map(toPostMetrics), [data]);
  const { briefing, temDados, ranked } = useMemo(() => buildBriefing(posts, objetivo), [posts, objetivo]);

  const modoAtual = MODOS_UI.find((m) => m.id === modo)!;

  function atualizarPerfil(p: Perfil) {
    setPerfil(p);
    savePerfil(p);
  }

  async function gerar() {
    setGerando(true);
    setErroGerar(null);
    setAnalise(null);
    try {
      setAnalise(await pedirAnalise(modo, briefing, perfil));
    } catch (e) {
      setErroGerar(e instanceof Error ? e.message : String(e));
    } finally {
      setGerando(false);
    }
  }

  if (loading) {
    return (
      <div>
        <SectionHeader title="Estrategista" subtitle="Carregando o desempenho…" icon="🧠" />
        <SkeletonCards count={2} columns={2} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <SectionHeader title="Estrategista" icon="🧠" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Estrategista"
          subtitle="Escolha um modo — a IA analisa seu desempenho e entrega o plano."
          icon="🧠"
        />
        <span className="rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-400">
          base: {briefing.totalPosts} posts · confiança {briefing.confianca}
        </span>
      </div>

      {!temDados ? (
        <EmptyState
          icon="📈"
          message="Sem posts com alcance para analisar ainda. Sincronize o desempenho na aba Desempenho primeiro."
        />
      ) : (
        <>
          {/* Menu dos 5 modos */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {MODOS_UI.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => { setModo(m.id); setAnalise(null); setErroGerar(null); }}
                aria-pressed={modo === m.id}
                className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                  modo === m.id
                    ? 'border-blue-500/60 bg-blue-500/10 ring-1 ring-blue-500/20'
                    : 'border-gray-700/60 bg-gray-800/40 hover:border-gray-600'
                }`}
              >
                <span className="text-xl" aria-hidden="true">{m.icone}</span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-100">{m.titulo}</span>
                  <span className="block text-[11px] text-gray-500">{m.funcao}</span>
                </span>
              </button>
            ))}
          </div>

          <PerfilForm perfil={perfil} onChange={atualizarPerfil} />

          {/* Objetivo do ranking + gerar */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Foco</span>
            {(['lead', 'autoridade', 'alcance', 'equilibrado'] as Objetivo[]).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setObjetivo(o)}
                aria-pressed={objetivo === o}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  objetivo === o ? 'border-blue-500/60 bg-blue-500/15 text-blue-200' : 'border-gray-700 text-gray-300 hover:bg-gray-700/40'
                }`}
              >
                {OBJETIVO_LABEL[o]}
              </button>
            ))}
            <button
              type="button"
              onClick={gerar}
              disabled={gerando}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span aria-hidden="true" className={gerando ? 'inline-block animate-spin' : ''}>✦</span>
              {gerando ? 'Analisando…' : `Rodar: ${modoAtual.titulo}`}
            </button>
          </div>

          {gerando && (
            <p className="rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-sm text-blue-200/80">
              A IA está lendo seus {briefing.totalPosts} posts e montando a análise… costuma levar de 30 a 60 segundos.
            </p>
          )}
          {erroGerar && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              Não consegui gerar: {erroGerar}
            </p>
          )}

          {analise && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.06] p-5">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-300/80">
                  {modoAtual.icone} {modoAtual.titulo}
                </div>
                <p className="text-[15px] leading-relaxed text-gray-100">{analise.resumo}</p>
              </div>

              {analise.secoes.map((sec, i) => (
                <div key={i} className="rounded-2xl border border-gray-700/60 bg-gray-800/50 p-4 sm:p-5">
                  <h4 className="mb-2 text-sm font-semibold text-gray-100" style={DISPLAY}>{sec.titulo}</h4>
                  <ConteudoTexto texto={sec.conteudo} />
                </div>
              ))}

              {analise.entregavel && (
                <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 sm:p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-emerald-200" style={DISPLAY}>
                      ✅ Pronto pra usar: {analise.entregavel.titulo}
                    </h4>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(analise.entregavel!.texto)}
                      className="rounded-lg border border-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-200 transition-colors hover:bg-emerald-500/10"
                    >
                      Copiar
                    </button>
                  </div>
                  <div className="whitespace-pre-line text-[14px] leading-relaxed text-gray-100">
                    {normalizarQuebras(analise.entregavel.texto)}
                  </div>
                </div>
              )}
            </div>
          )}

          {!analise && !gerando && (
            <p className="rounded-xl border border-dashed border-gray-700/60 px-4 py-8 text-center text-sm text-gray-500">
              Modo selecionado: <span className="text-gray-300">{modoAtual.titulo}</span>. Clique em
              <span className="text-gray-300"> "Rodar"</span> — a IA vai analisar seus {briefing.totalPosts} posts.
              {modoAtual.campos.some((c) => !perfil[c].trim()) && (
                <span className="mt-1 block text-[11px] text-amber-300/70">
                  Dica: preencha o "Perfil do negócio" acima para este modo ficar mais preciso.
                </span>
              )}
            </p>
          )}

          {/* Ranking por Lead Score — colapsado por padrão. */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900/30">
            <button
              type="button"
              onClick={() => setMostrarRanking((v) => !v)}
              aria-expanded={mostrarRanking}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Ranking por Lead Score ({ranked.length})
              </span>
              <span className={`text-gray-500 transition-transform ${mostrarRanking ? 'rotate-180' : ''}`} aria-hidden="true">⌄</span>
            </button>
            {mostrarRanking && (
              <ol className="max-h-[28rem] divide-y divide-gray-800 overflow-auto border-t border-gray-800">
                {ranked.map((sp: ScoredPost, i: number) => (
                  <li key={sp.id} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="w-7 shrink-0 text-right text-[11px] font-semibold text-gray-500">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-gray-100">{tituloDe(sp.post)}</span>
                      <span className="text-[11px] text-gray-500">
                        {fl(sp.post.formato)}
                        {sp.taxaTop && <span className="text-gray-600"> · {SINAL_LABEL[sp.taxaTop]}</span>}
                      </span>
                    </span>
                    <span className={`shrink-0 text-sm font-semibold ${ROTULO_TONE[sp.rotulo]}`} style={DISPLAY}>
                      {sp.score}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Definição registrável do bloco custom "Estrategista". */
export const conteudoEstrategista: BlockDefinition = {
  type: 'custom:conteudo-estrategista',
  component: ConteudoEstrategistaBlock,
  defaultDataShape: 'collection',
};
