/**
 * apps/dobro — bloco CUSTOM: "Placar da IA".
 *
 * Fecha o ciclo que as duas metades do módulo de Conteúdo abriram: a IA registra
 * o que ESPERA de cada post antes de publicar (`conteudo_previsoes`), o sync traz
 * o que ele REALMENTE fez (`conteudo_desempenho`), e esta tela põe os dois lado a
 * lado para responder se a previsão vale alguma coisa.
 *
 * 100% client, sem IA em runtime: lê `v_conteudo_placar` (a view já escolhe a
 * previsão certa por post) e usa o motor puro `placar-analise.ts`.
 *
 * O que ela mostra, nesta ordem:
 *   1) O PLACAR — acertos de classe e, mais importante, o VIÉS: a IA erra pra
 *      cima ou pra baixo? É esse número que calibra as próximas previsões.
 *   2) JULGADOS — cada post com previsto x real, o erro em pontos percentuais e
 *      a aposta que a IA tinha feito.
 *   3) NA FILA — previsões esperando o post ir ao ar.
 *
 * O estado vazio é parte do produto, não um acidente: enquanto nenhum post
 * previsto tiver sido publicado, a tela explica o que falta em vez de mostrar
 * uma caixa vazia.
 */

import { useMemo } from 'react';
import { SectionHeader, EmptyState, SkeletonCards } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';
import { CLASSE_TONE, DEFAULT_BENCH, type Classe, type FormatBenchmarks } from './regua-desempenho';
import {
  mapearPares,
  resumirPlacar,
  ordenarParaTela,
  lerVies,
  MIN_AMOSTRA,
  type ParPlacar,
  type ResumoPlacar,
} from './placar-analise';

type Row = Record<string, unknown>;

interface ConteudoPlacarConfig {
  /** Mesmos benchmarks da aba Desempenho (o real precisa da mesma régua). */
  benchmarks?: Record<string, FormatBenchmarks>;
}

const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

const MESES_ABBR = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function asRows(data: unknown): Row[] {
  if (Array.isArray(data)) return data.filter((r): r is Row => r != null && typeof r === 'object');
  if (data != null && typeof data === 'object') return [data as Row];
  return [];
}

/** ISO → "08 ago 26". */
function fmtData(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${MESES_ABBR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

/** 1.234 → "1,2%" (as taxas do placar já vêm em porcentagem). */
function fmtPct(n: number | null): string {
  if (n == null) return '—';
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

/** Erro com sinal: "+0,8 pp" / "−1,2 pp". */
function fmtPp(n: number | null): string {
  if (n == null) return '—';
  const sinal = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sinal}${Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} pp`;
}

function fmtInt(n: number | null): string {
  return n == null ? '—' : Math.round(n).toLocaleString('pt-BR');
}

/** Pílula de classe (mesmas cores da aba Desempenho). */
function ClassePill({ classe, titulo }: { classe: Classe; titulo?: string }) {
  const t = CLASSE_TONE[classe];
  return (
    <span
      title={titulo}
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${t.pill}`}
    >
      {t.label}
    </span>
  );
}

/** Um cartão do topo: número grande + leitura em uma frase. */
function CartaoResumo({
  rotulo,
  valor,
  detalhe,
  tom = 'neutro',
}: {
  rotulo: string;
  valor: string;
  detalhe: string;
  tom?: 'neutro' | 'bom' | 'atencao';
}) {
  const cor =
    tom === 'bom' ? 'text-emerald-300' : tom === 'atencao' ? 'text-amber-300' : 'text-gray-100';
  return (
    <div className="rounded-2xl border border-gray-700/60 bg-gray-800/40 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{rotulo}</div>
      <div className={`mt-1 text-2xl font-bold ${cor}`} style={DISPLAY}>
        {valor}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{detalhe}</p>
    </div>
  );
}

/** O topo: acertos + os dois vieses (o que realmente ensina). */
function Resumo({ r }: { r: ResumoPlacar }) {
  const taxa = r.taxaAcerto == null ? '—' : `${Math.round(r.taxaAcerto * 100)}%`;
  const viesSalv = lerVies(r.viesSalvPp, 'salvamentos');
  const viesComp = lerVies(r.viesCompPp, 'compartilhamentos');

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <CartaoResumo
        rotulo="Acerto de classe"
        valor={`${r.acertos}/${r.comResultado}`}
        detalhe={
          r.comResultado === 0
            ? 'Nenhum post previsto foi medido ainda.'
            : `${taxa} das previsões acertaram Forte/Saudável/Abaixo.` +
              (r.confiavel ? '' : ` Amostra ainda pequena (menos de ${MIN_AMOSTRA}).`)
        }
        tom={r.taxaAcerto != null && r.taxaAcerto >= 0.6 ? 'bom' : 'neutro'}
      />
      <CartaoResumo
        rotulo="Viés · salvamentos"
        valor={fmtPp(r.viesSalvPp)}
        detalhe={viesSalv ?? 'Sem resultado medido para comparar.'}
        tom={r.viesSalvPp != null && Math.abs(r.viesSalvPp) > 0.5 ? 'atencao' : 'neutro'}
      />
      <CartaoResumo
        rotulo="Viés · compartilhamentos"
        valor={fmtPp(r.viesCompPp)}
        detalhe={viesComp ?? 'Sem resultado medido para comparar.'}
        tom={r.viesCompPp != null && Math.abs(r.viesCompPp) > 0.3 ? 'atencao' : 'neutro'}
      />
    </div>
  );
}

/** Previsto → real de UMA métrica, com o erro. */
function LinhaMetrica({
  rotulo,
  previsto,
  real,
  erroPp,
}: {
  rotulo: string;
  previsto: number | null;
  real: number | null;
  erroPp: number | null;
}) {
  const grave = erroPp != null && Math.abs(erroPp) >= 1;
  return (
    <div className="flex items-baseline justify-between gap-2 text-[12px]">
      <span className="text-gray-500">{rotulo}</span>
      <span className="flex items-baseline gap-1.5">
        <span className="text-gray-400">{fmtPct(previsto)}</span>
        <span className="text-gray-600">→</span>
        <span className="font-semibold text-gray-100">{fmtPct(real)}</span>
        <span className={`text-[11px] ${grave ? 'text-amber-300/90' : 'text-gray-600'}`}>
          {fmtPp(erroPp)}
        </span>
      </span>
    </div>
  );
}

/** Um post já julgado: o que a IA achou x o que aconteceu. */
function CardJulgado({ par }: { par: ParPlacar }) {
  const real = par.real!;
  const acertou = par.acertou;
  const borda =
    acertou === true
      ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
      : acertou === false
        ? 'border-amber-500/40 bg-amber-500/[0.06]'
        : 'border-gray-700/60 bg-gray-800/40';

  return (
    <li className={`rounded-2xl border p-3 sm:p-4 ${borda}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[15px]" aria-hidden="true">
          {acertou === true ? '✅' : acertou === false ? '⚠️' : '•'}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-100">{par.titulo}</span>
        <span className="shrink-0 text-[11px] text-gray-500">{fmtData(real.publicadoEm)}</span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
        <span>previu</span>
        <ClassePill classe={par.previsto.classe} titulo="Classe prevista antes de publicar" />
        <span>deu</span>
        <ClassePill classe={real.classe} titulo="Classe do resultado real" />
        {par.previsto.furaTotal != null && (
          <span className="rounded-full border border-gray-600/70 px-1.5 py-0.5 text-[10px] text-gray-400">
            Fura a Bolha {par.previsto.furaTotal}/25
          </span>
        )}
        {real.permalink && (
          <a
            href={real.permalink}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
          >
            ver post ↗
          </a>
        )}
      </div>

      <div className="mt-2.5 space-y-1 border-t border-gray-700/50 pt-2.5">
        <LinhaMetrica
          rotulo="Salvamentos / alcance"
          previsto={par.previsto.salvPct}
          real={real.salvPct}
          erroPp={par.erroSalvPp}
        />
        <LinhaMetrica
          rotulo="Compartilhamentos / alcance"
          previsto={par.previsto.compPct}
          real={real.compPct}
          erroPp={par.erroCompPp}
        />
        <div className="flex items-baseline justify-between gap-2 text-[12px]">
          <span className="text-gray-500">Alcance</span>
          <span className="text-gray-300">
            {fmtInt(real.alcance)}
            <span className="ml-2 text-[11px] text-gray-600">
              {fmtInt(real.salvamentos)} salv · {fmtInt(real.comentarios)} coment.
            </span>
          </span>
        </div>
      </div>

      {par.previsto.aposta && (
        <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
          <span className="text-gray-400">Apostou em:</span> {par.previsto.aposta}
        </p>
      )}
    </li>
  );
}

/** Uma previsão que ainda não tem resultado. */
function CardNaFila({ par }: { par: ParPlacar }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-gray-700/60 bg-gray-800/30 p-3">
      <ClassePill classe={par.previsto.classe} titulo="Classe prevista" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] text-gray-200">{par.titulo}</span>
        <span className="block text-[11px] text-gray-500">
          previsto em {fmtData(par.previsto.registradaEm)} · {par.estado}
          {par.previsto.salvPct != null && ` · espera ${fmtPct(par.previsto.salvPct)} de salvamentos`}
        </span>
      </span>
    </li>
  );
}

function ConteudoPlacarBlock({ config, ctx }: BlockProps<ConteudoPlacarConfig>) {
  const { data, loading, error } = ctx;
  const bench = config.benchmarks ?? DEFAULT_BENCH;

  const pares = useMemo(() => ordenarParaTela(mapearPares(asRows(data), bench)), [data, bench]);
  const resumo = useMemo(() => resumirPlacar(pares), [pares]);

  if (loading) {
    return (
      <div>
        <SectionHeader title="Placar da IA" subtitle="Carregando previsões e resultados…" icon="🔮" />
        <SkeletonCards count={3} columns={3} />
      </div>
    );
  }
  if (error) {
    return (
      <div>
        <SectionHeader title="Placar da IA" icon="🔮" />
        <EmptyState icon="⚠️" message={`Erro ao carregar: ${error}`} />
      </div>
    );
  }

  const julgados = pares.filter((p) => p.real != null);
  const naFila = pares.filter((p) => p.real == null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionHeader
          title="Placar da IA"
          subtitle="O que a IA previu antes de publicar, contra o que o post fez de verdade."
          icon="🔮"
        />
        <span className="rounded-full border border-gray-700 px-3 py-1 text-[11px] text-gray-400">
          {resumo.comResultado} julgado(s) · {resumo.aguardando} na fila
        </span>
      </div>

      {pares.length === 0 ? (
        <EmptyState
          icon="🔮"
          message="Nenhuma previsão registrada ainda. Todo rascunho gerado pela IA já nasce com uma, então o placar começa a se encher no próximo carrossel gerado."
        />
      ) : (
        <>
          <Resumo r={resumo} />

          {julgados.length > 0 ? (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Julgados · previsto x real
              </h3>
              <ul className="space-y-2">
                {julgados.map((p) => (
                  <CardJulgado key={p.id} par={p} />
                ))}
              </ul>
            </div>
          ) : (
            // Estado normal no começo: há previsões, mas nenhuma virou post medido.
            // Dizer POR QUE vale mais do que uma caixa vazia.
            <div className="rounded-2xl border border-gray-700/60 bg-gray-800/30 p-4">
              <h3 className="text-sm font-semibold text-gray-100">Ainda não há nada para julgar</h3>
              <p className="mt-1.5 text-[12px] leading-relaxed text-gray-400">
                Existem <span className="text-gray-200">{resumo.aguardando} previsões</span> guardadas, mas
                nenhuma delas é de um post que já foi publicado e medido. O primeiro julgamento aparece
                sozinho quando um destes cards for ao ar e o desempenho sincronizar.
              </p>
              <p className="mt-2 text-[11px] leading-relaxed text-gray-500">
                Os posts publicados antes desta tela existir não entram: eles não têm previsão registrada, e
                inventar uma agora seria trapacear no próprio placar.
              </p>
            </div>
          )}

          {resumo.matriz.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Onde ela erra</h3>
              <ul className="flex flex-wrap gap-2">
                {resumo.matriz.map((c) => (
                  <li
                    key={`${c.prevista}-${c.real}`}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${
                      c.prevista === c.real
                        ? 'border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-200'
                        : 'border-amber-500/30 bg-amber-500/[0.07] text-amber-200'
                    }`}
                  >
                    <span>
                      previu {CLASSE_TONE[c.prevista].label}, deu {CLASSE_TONE[c.real].label}
                    </span>
                    <span className="font-bold">{c.n}×</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {naFila.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Na fila · esperando o resultado
              </h3>
              <ul className="space-y-1.5">
                {naFila.map((p) => (
                  <CardNaFila key={p.id} par={p} />
                ))}
              </ul>
            </div>
          )}

          <p className="rounded-xl border border-gray-800 bg-gray-900/30 px-4 py-3 text-[11px] leading-relaxed text-gray-500">
            Previsto e real passam pela <span className="text-gray-400">mesma régua</span> da aba Desempenho,
            senão a comparação não valeria nada. O número que mais ensina não é o placar de acertos, é o{' '}
            <span className="text-gray-400">viés</span>: erro sempre para cima quer dizer que a IA está
            otimista e a calibragem dela precisa apertar. Com menos de {MIN_AMOSTRA} posts julgados, leia
            tudo como indício, não como veredito.
          </p>
        </>
      )}
    </div>
  );
}

/** Definição registrável do bloco custom "Placar da IA". */
export const conteudoPlacar: BlockDefinition = {
  type: 'custom:conteudo-placar',
  component: ConteudoPlacarBlock,
  defaultDataShape: 'collection',
};
