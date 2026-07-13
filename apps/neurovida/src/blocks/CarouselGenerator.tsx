/**
 * apps/neurovida — bloco CUSTOM: gerador de carrossel científico (item 5).
 *
 * É um "action block": diferente dos blocos do catálogo (que só leem ctx.data),
 * este gerencia o próprio estado e dispara uma AÇÃO DE IA no backend
 * (POST /api/agents/carousel → Claude API + web search). Renderiza com o design
 * system do @os/core, então herda o skin (creme/dusk) automaticamente.
 */

import { useState } from 'react';
import { SectionHeader, EmptyState } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';

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
  fontes: Fonte[];
}

const SUGESTOES = [
  'Ômega 3 e memória',
  'Creatina para quem não treina',
  'Vitamina D e imunidade',
  'Magnésio e qualidade do sono',
];

function CarouselGeneratorBlock({ title, subtitle }: BlockProps) {
  const [tema, setTema] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [result, setResult] = useState<CarouselResult | null>(null);

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

  return (
    <div>
      <SectionHeader
        title={title ?? 'Estúdio de conteúdo'}
        subtitle={subtitle}
        icon="🧬"
      />

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
        <div role="status" aria-live="polite" className="rounded-2xl border border-gray-700/50 bg-gray-800/40 p-10 text-center">
          <div className="mb-3 text-3xl">🔎</div>
          <p className="text-sm font-medium text-gray-300">Pesquisando evidências e escrevendo…</p>
          <p className="mt-1 text-xs text-gray-500">Buscando fontes confiáveis e revisando as citações.</p>
        </div>
      )}

      {erro && !loading && (
        <EmptyState icon="⚠️" message={`Erro ao gerar: ${erro}`} hint="Confira se você adicionou a sua chave em Configurações e tente de novo." />
      )}

      {result && !loading && (
        <div>
          <h3 className="mb-4 text-lg font-bold text-gray-100">{result.titulo}</h3>

          {/* Slides */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.slides.map((slide, i) => (
              <article
                key={i}
                className="flex flex-col rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm"
              >
                <span className="mb-2 inline-flex w-fit items-center rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-300">
                  Slide {i + 1}
                </span>
                <h4 className="mb-2 text-base font-bold leading-snug text-gray-100">{slide.titulo}</h4>
                <p className="text-sm leading-relaxed text-gray-300">{slide.corpo}</p>
              </article>
            ))}
          </div>

          {/* Fontes */}
          {result.fontes.length > 0 && (
            <div className="mt-6 rounded-2xl border border-gray-700/50 bg-gray-800/40 p-5">
              <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Fontes verificadas
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
