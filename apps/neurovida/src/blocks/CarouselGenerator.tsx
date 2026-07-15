/**
 * apps/neurovida — bloco CUSTOM: Estúdio de conteúdo (gerador de carrossel).
 *
 * "Action block": gerencia o próprio estado e dispara uma AÇÃO DE IA no backend
 * (POST /api/agents/carousel → Claude API + web search). O resultado aparece como
 * um PREVIEW de post do Instagram (ver InstagramPreview) — igual à experiência do
 * Dobro OS —, com a legenda copiável e as fontes reais ao lado. Herda o skin.
 */

import { useEffect, useState } from 'react';
import { SectionHeader, EmptyState } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';
import { InstagramPreview } from '../components/InstagramPreview';

/** Frases que giram enquanto a IA pesquisa e escreve (a espera parece viva). */
const FRASES_GERANDO = ['Buscando estudos confiáveis…', 'Lendo as evidências…', 'Escrevendo os slides…', 'Revisando as citações…'];

interface Slide {
  titulo: string;
  corpo: string;
}
interface Fonte {
  titulo: string;
  url: string;
}
interface CarouselResult {
  titulo: string;
  slides: Slide[];
  legenda: string;
  hashtags: string[];
  fontes: Fonte[];
}

const SUGESTOES = [
  'Ômega 3 e memória',
  'Creatina para quem não treina',
  'Vitamina D e imunidade',
  'Magnésio e qualidade do sono',
];

/** Junta legenda + hashtags no texto pronto pra colar no Instagram. */
function legendaCompleta(r: CarouselResult): string {
  const tags = r.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ');
  return [r.legenda, tags].filter(Boolean).join('\n\n');
}

function CarouselGeneratorBlock({ title, subtitle }: BlockProps) {
  const [tema, setTema] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [result, setResult] = useState<CarouselResult | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [fraseIdx, setFraseIdx] = useState(0);

  // Enquanto gera, alterna as frases pra a espera (até ~1 min) parecer viva.
  useEffect(() => {
    if (!loading) {
      setFraseIdx(0);
      return;
    }
    const t = setInterval(() => setFraseIdx((i) => (i + 1) % FRASES_GERANDO.length), 1800);
    return () => clearInterval(t);
  }, [loading]);

  async function gerar(temaAlvo: string): Promise<void> {
    const t = temaAlvo.trim();
    if (t.length < 3) return;
    setLoading(true);
    setErro(null);
    setResult(null);
    try {
      const res = await fetch('/api/agents/carousel', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ tema: t }),
      });
      const data = (await res.json()) as CarouselResult & { error?: string };
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar o carrossel.');
      setResult(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function copiarLegenda(): void {
    if (!result) return;
    void navigator.clipboard.writeText(legendaCompleta(result)).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2200);
    });
  }

  return (
    <div>
      <SectionHeader
        title={title ?? 'Estúdio de conteúdo'}
        subtitle={subtitle ?? 'Gere carrosséis embasados em ciência — com preview de Instagram'}
        icon="🧬"
      />

      {/* Barra de formatos (por ora só Carrossel; extensível a Reels/Stories) */}
      <div role="tablist" aria-label="Formato de conteúdo" className="mb-6 flex items-center gap-1 border-b border-gray-700/60">
        <button
          type="button"
          role="tab"
          aria-selected="true"
          className="border-b-2 border-blue-500 px-4 py-2.5 text-sm font-semibold text-blue-400"
        >
          🎠 Carrossel
        </button>
        <span className="px-3 py-2.5 text-xs text-gray-500">Reels e Stories · em breve</span>
      </div>

      {/* Entrada do tema */}
      <div className="mb-6 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
        <label className="mb-2 block text-sm font-medium text-gray-300" htmlFor="tema">
          Sobre o que é o carrossel?
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="tema"
            type="text"
            value={tema}
            onChange={(e) => setTema(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') gerar(tema);
            }}
            placeholder="ex.: Ômega 3 e saúde do coração"
            disabled={loading}
            className="min-w-[260px] flex-1 rounded-xl border border-gray-600 bg-gray-900/40 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => gerar(tema)}
            disabled={loading || tema.trim().length < 3}
            className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Gerando…' : 'Gerar carrossel'}
          </button>
        </div>

        {/* Sugestões rápidas */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Sugestões:</span>
          {SUGESTOES.map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => {
                setTema(s);
                gerar(s);
              }}
              className="rounded-full border border-gray-600 px-3 py-1 text-xs text-gray-400 transition-colors hover:border-blue-500/40 hover:text-gray-200 disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          A IA pesquisa fontes reais (ex.: PubMed) e monta o carrossel — sem inventar estudos.
          Pode levar até um minuto.
        </p>
      </div>

      {/* Estados */}
      {loading && (
        <div role="status" aria-live="polite" className="rounded-2xl border border-gray-700/50 bg-gray-800/40 p-5">
          <div className="flex items-center gap-3">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-500/15 text-lg" aria-hidden="true">
              <span className="os-agent-halo absolute inset-0 rounded-full bg-blue-500/25" />
              <span className="relative">🧬</span>
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200">Pesquisando e escrevendo…</p>
              <p className="mt-0.5 text-xs text-blue-300/90">{FRASES_GERANDO[fraseIdx]}</p>
            </div>
          </div>
          {/* Skeleton no formato do resultado (preview + legenda) */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]" aria-hidden="true">
            <div className="os-shimmer aspect-square rounded-2xl bg-gray-700/40" />
            <div className="space-y-2.5">
              <div className="os-shimmer h-4 w-2/3 rounded bg-gray-700/50" />
              <div className="os-shimmer h-28 rounded-2xl bg-gray-700/40" />
              <div className="os-shimmer h-16 rounded-2xl bg-gray-700/30" />
            </div>
          </div>
        </div>
      )}

      {erro && !loading && (
        <EmptyState icon="⚠️" message={`Erro ao gerar: ${erro}`} hint="Confira se você adicionou a sua chave em Configurações e tente de novo." />
      )}

      {result && !loading && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
          {/* Preview do post */}
          <InstagramPreview
            titulo={result.titulo}
            slides={result.slides}
            legenda={result.legenda}
            hashtags={result.hashtags}
          />

          {/* Legenda copiável + fontes */}
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-100">{result.titulo}</h3>

            {/* Legenda */}
            <div className="mt-4 rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Legenda do post</h4>
                <button
                  type="button"
                  onClick={copiarLegenda}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    copiado ? 'bg-emerald-500/20 text-emerald-400' : 'border border-gray-600 text-gray-300 hover:border-blue-500/40 hover:text-gray-100'
                  }`}
                >
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-300">{result.legenda}</p>
              {result.hashtags.length > 0 && (
                <p className="mt-3 text-sm font-medium text-blue-400">
                  {result.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
                </p>
              )}
            </div>

            {/* Fontes verificadas */}
            {result.fontes.length > 0 && (
              <div className="mt-4 rounded-2xl border border-gray-700/50 bg-gray-800/40 p-5">
                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                  Fontes verificadas ({result.fontes.length})
                </h4>
                <ul className="space-y-2">
                  {result.fontes.map((f, i) => (
                    <li key={i} className="text-sm leading-relaxed">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 underline decoration-blue-500/40 underline-offset-2 hover:text-blue-300"
                      >
                        {f.titulo}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Definição registrável do bloco custom da Neurovida. */
export const carouselGenerator: BlockDefinition = {
  type: 'custom:carousel-generator',
  component: CarouselGeneratorBlock,
  defaultDataShape: 'raw',
};
