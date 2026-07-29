/**
 * apps/dobro — painel "Guia: como ler as métricas" (dentro do dashboard de desempenho).
 *
 * Renderiza o `desempenho-guia.ts` (a fonte única) num bloco COLAPSÁVEL, pra
 * criadora entender o que cada número quer dizer sem sair da tela: as fórmulas,
 * a leitura em conjunto, as faixas Fraco/Saudável/Forte por formato (Instagram +
 * YouTube), retenção, classificação e a nota metodológica.
 *
 * É só apresentação: nenhuma regra de cálculo mora aqui — os números vêm do guia.
 * Fica recolhido por padrão (não empurra os dados do dashboard pra baixo).
 */

import type { ReactNode } from 'react';
import {
  GUIA_ATUALIZADO,
  ETAPAS,
  REGRA_PRINCIPAL,
  FORMULAS,
  LEIA_EM_CONJUNTO,
  IG_PRIORIDADES,
  IG_FAIXAS,
  REELS_RETENCAO,
  IG_STORIES,
  STORIES_CONCLUSAO,
  YT_FUNIL,
  YT_LONGOS,
  YT_LONGOS_NOTA,
  YT_CURVA_RETENCAO,
  SHORTS_ESCOLHERAM,
  SHORTS_PCT_VISUALIZADO,
  SHORTS_INTERACOES,
  SHORTS_NOTA,
  PAINEL_SEMANAL,
  CLASSIFICACAO,
  NOTA_METODOLOGICA,
  FONTES,
  faixaPct,
} from './desempenho-guia';
import type { MetricaFaixa } from './desempenho-guia';

const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

// ── Peças reutilizáveis ─────────────────────────────────────────────────────

/** Tabela enxuta e rolável no mobile. Primeira coluna é o rótulo (mais forte). */
function DataTable({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[28rem] text-left text-xs">
        <thead>
          <tr>
            {head.map((h, i) => (
              <th
                key={i}
                className="py-1.5 pr-4 text-[10px] font-semibold uppercase tracking-wide text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td
                  key={ci}
                  className={`border-t border-gray-700/40 py-2 pr-4 align-top ${
                    ci === 0 ? 'font-medium text-gray-200' : 'text-gray-300'
                  }`}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Célula colorida das três faixas (vermelho/azul/verde = Fraco/Saudável/Forte). */
function faixaRow(m: MetricaFaixa): ReactNode[] {
  const [s, f] = m.faixa;
  return [
    m.label,
    m.semFraco ? (
      <span className="text-gray-600">—</span>
    ) : (
      <span className="whitespace-nowrap text-red-300">&lt; {faixaPct(s)}</span>
    ),
    <span className="whitespace-nowrap text-sky-300">
      {faixaPct(s)}–{faixaPct(f)}
    </span>,
    <span className="whitespace-nowrap text-emerald-300">&gt; {faixaPct(f)}</span>,
  ];
}

function Bloco({
  titulo,
  hint,
  children,
}: {
  titulo: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{titulo}</h4>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function SubTitulo({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2 text-xs font-semibold text-gray-200" style={DISPLAY}>
      {children}
      {aside && <span className="font-normal text-gray-500"> · {aside}</span>}
    </div>
  );
}

// ── Painel ──────────────────────────────────────────────────────────────────

export function GuiaMetricas() {
  return (
    <details className="group overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/40 shadow-sm [&_summary::-webkit-details-marker]:hidden">
      {/*
        display:flex NO <summary> quebra o toggle nativo em Chromium/Safari
        (crbug 590014). Por isso o summary fica com display padrão (list-item,
        togglável) e o layout flex vive num <div> interno.
      */}
      <summary className="cursor-pointer list-none select-none px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true">📘</span>
            <span className="text-sm font-semibold text-gray-100" style={DISPLAY}>
              Guia: como ler as métricas
            </span>
          </span>
          <span className="flex items-center gap-3">
            <span className="hidden text-[11px] text-gray-500 sm:inline">
              Instagram + YouTube · atualizado em {GUIA_ATUALIZADO}
            </span>
            <svg
              className="h-4 w-4 shrink-0 text-gray-500 transition-transform group-open:rotate-180"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        </div>
      </summary>

      <div className="space-y-8 border-t border-gray-700/50 px-5 pb-6 pt-5 text-sm text-gray-300">
        {/* A lógica — as quatro etapas */}
        <Bloco titulo="A lógica" hint="Avalie todo conteúdo em quatro etapas, nesta ordem.">
          <ol className="flex flex-wrap items-center gap-2">
            {ETAPAS.map((e, i) => (
              <li key={e} className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-700 bg-gray-800/60 px-3 py-1 text-xs">
                  <span className="text-gray-500">{i + 1}</span>
                  <span className="text-gray-200">{e}</span>
                </span>
                {i < ETAPAS.length - 1 && (
                  <span className="text-gray-600" aria-hidden="true">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
          <p className="mt-3 rounded-lg border border-gray-700/50 bg-gray-800/40 px-3 py-2 text-xs text-gray-400">
            {REGRA_PRINCIPAL}
          </p>
        </Bloco>

        {/* Fórmulas */}
        <Bloco titulo="Fórmulas essenciais">
          <div className="grid gap-2 sm:grid-cols-2">
            {FORMULAS.map((f) => (
              <div
                key={f.metrica}
                className="rounded-lg border border-gray-700/50 bg-gray-800/40 px-3 py-2"
              >
                <div className="text-xs font-semibold text-gray-200">{f.metrica}</div>
                <div className="mt-0.5 text-xs text-gray-400">{f.formula}</div>
              </div>
            ))}
          </div>
        </Bloco>

        {/* Leia em conjunto */}
        <Bloco titulo="Leia as métricas em conjunto">
          <ul className="space-y-1.5">
            {LEIA_EM_CONJUNTO.map((s) => (
              <li key={s} className="flex gap-2 text-xs text-gray-300">
                <span className="text-gray-600" aria-hidden="true">
                  •
                </span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Bloco>

        {/* Instagram — prioridades */}
        <Bloco titulo="Instagram — prioridades por formato">
          <DataTable
            head={['Formato', 'Prioridade 1', 'Prioridade 2', 'Prioridade 3', 'Apoio']}
            rows={IG_PRIORIDADES.map((p) => [p.formato, p.p1, p.p2, p.p3, p.apoio])}
          />
        </Bloco>

        {/* Instagram — faixas por alcance */}
        <Bloco
          titulo="Instagram — faixas por alcance"
          hint="Taxas = métrica ÷ contas alcançadas. Compare sempre com a mediana dos seus últimos posts do mesmo formato."
        >
          <div className="space-y-5">
            {IG_FAIXAS.map((g) => (
              <div key={g.chave}>
                <SubTitulo aside={g.base}>{g.label}</SubTitulo>
                <DataTable
                  head={['Métrica', 'Fraco', 'Saudável', 'Forte']}
                  rows={g.metricas.map(faixaRow)}
                />
              </div>
            ))}
          </div>
        </Bloco>

        {/* Reels — retenção por duração */}
        <Bloco titulo="Reels — retenção saudável por duração">
          <DataTable
            head={['Duração', 'Referência saudável']}
            rows={REELS_RETENCAO.map((r) => [r.duracao, r.referencia])}
          />
        </Bloco>

        {/* Stories */}
        <Bloco titulo="Stories — observe a sequência" hint={STORIES_CONCLUSAO}>
          <DataTable
            head={['Métrica', 'O que ela responde']}
            rows={IG_STORIES.map((s) => [s.metrica, s.responde])}
          />
        </Bloco>

        {/* YouTube — vídeos longos */}
        <Bloco titulo="YouTube — vídeos longos" hint={`Funil de diagnóstico: ${YT_FUNIL}`}>
          <DataTable
            head={['Métrica', 'Fraco', 'Saudável', 'Forte', 'O que ajustar']}
            rows={YT_LONGOS.map((m) => [
              ...faixaRow(m),
              <span className="text-gray-400">{m.ajustar}</span>,
            ])}
          />
          <p className="mt-3 text-xs text-gray-500">{YT_LONGOS_NOTA}</p>
        </Bloco>

        {/* YouTube — curva de retenção */}
        <Bloco titulo="YouTube — como ler a curva de retenção">
          <DataTable
            head={['Sinal', 'Leitura provável', 'Ação']}
            rows={YT_CURVA_RETENCAO.map((c) => [c.sinal, c.leitura, c.acao])}
          />
        </Bloco>

        {/* YouTube — Shorts */}
        <Bloco titulo="YouTube — Shorts" hint={SHORTS_NOTA}>
          <div className="space-y-5">
            <div>
              <SubTitulo>Escolheram assistir (em vez de deslizar)</SubTitulo>
              <DataTable
                head={['Resultado', 'Leitura']}
                rows={SHORTS_ESCOLHERAM.map((s) => [s.faixa, s.leitura])}
              />
            </div>
            <div>
              <SubTitulo>Percentual médio visualizado</SubTitulo>
              <DataTable
                head={['Duração', 'Saudável', 'Forte']}
                rows={SHORTS_PCT_VISUALIZADO.map((s) => [
                  s.duracao,
                  <span className="text-sky-300">{s.saudavel}</span>,
                  <span className="text-emerald-300">{s.forte}</span>,
                ])}
              />
            </div>
            <div>
              <SubTitulo>Interações por visualizações engajadas</SubTitulo>
              <DataTable
                head={['Métrica', 'Fraco', 'Saudável', 'Forte']}
                rows={SHORTS_INTERACOES.map(faixaRow)}
              />
            </div>
          </div>
        </Bloco>

        {/* Painel semanal */}
        <Bloco
          titulo="Painel semanal recomendado"
          hint="Compare só peças do mesmo formato e use a mediana — ela sofre menos com um viral isolado."
        >
          <DataTable
            head={['Canal/formato', '3 métricas principais', 'Pergunta de decisão']}
            rows={PAINEL_SEMANAL.map((p) => [p.canal, p.metricas, p.pergunta])}
          />
        </Bloco>

        {/* Classificação */}
        <Bloco titulo="Classificação simples do conteúdo">
          <DataTable
            head={['Status', 'Critério', 'Decisão']}
            rows={CLASSIFICACAO.map((c) => [c.status, c.criterio, c.decisao])}
          />
        </Bloco>

        {/* Nota metodológica + fontes */}
        <Bloco titulo="Nota metodológica">
          <ul className="space-y-1.5">
            {NOTA_METODOLOGICA.map((n) => (
              <li key={n} className="flex gap-2 text-xs text-gray-400">
                <span className="text-gray-600" aria-hidden="true">
                  •
                </span>
                <span>{n}</span>
              </li>
            ))}
          </ul>
          <details className="mt-3 [&_summary::-webkit-details-marker]:hidden">
            <summary className="cursor-pointer list-none text-xs text-gray-500 transition-colors hover:text-gray-300">
              Fontes consultadas ▾
            </summary>
            <ul className="mt-2 space-y-1">
              {FONTES.map((f) => (
                <li key={f} className="text-[11px] text-gray-500">
                  — {f}
                </li>
              ))}
            </ul>
          </details>
        </Bloco>
      </div>
    </details>
  );
}
