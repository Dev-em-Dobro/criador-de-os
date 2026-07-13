/**
 * apps/neurovida — bloco CUSTOM: Análise de Leads quentes.
 *
 * Porte do "Lead Score" do Dobro OS, adaptado ao contexto Neurovida (suplementos)
 * e ao design system do @os/core (herda o skin creme/dusk). Mostra:
 *  - um "termômetro" de temperatura da base (Quente / Morno / Frio);
 *  - os segmentos de ação (ICP Alto/Médio/Baixo, Sem perfil, Cliente upsell...);
 *  - a tabela de leads pontuados, filtrável por segmento.
 *
 * Protótipo estático: dados mockados (sem upload/merge — a parte operacional do
 * Dobro fica de fora; aqui o foco é a ANÁLISE de quem está quente).
 */

import { useMemo, useState } from 'react';
import { SectionHeader, EmptyState } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';

type Temperatura = 'quente' | 'morno' | 'frio';
type Tier = 'S' | 'A' | 'B' | 'C';

interface Lead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  interesse: string;
  score: number;
  segmento: string;
  fontes: string[];
  canais: string[];
}

interface SegmentoMeta {
  id: string;
  label: string;
  desc: string;
  accent: string;
}

const SEGMENTOS: SegmentoMeta[] = [
  { id: 'icp-alto', label: 'ICP Alto', desc: 'Não-cliente — oferta direta', accent: 'text-emerald-400' },
  { id: 'icp-medio', label: 'ICP Médio', desc: 'Não-cliente — aquecimento', accent: 'text-blue-300' },
  { id: 'icp-baixo', label: 'ICP Baixo', desc: 'Não-cliente — nutrição', accent: 'text-gray-300' },
  { id: 'sem-perfil', label: 'Sem Perfil', desc: 'Sem pesquisa respondida', accent: 'text-yellow-300' },
  { id: 'cliente-upsell', label: 'Cliente · Upsell', desc: 'Cliente com perfil — cross-sell', accent: 'text-purple-300' },
  { id: 'cliente-sem-perfil', label: 'Cliente · Sem Perfil', desc: 'Cliente sem pesquisa', accent: 'text-gray-400' },
];

const LEADS: Lead[] = [
  { id: '1', nome: 'Ana Beatriz Rocha', email: 'ana.rocha@email.com', telefone: '(11) 99812-4471', interesse: 'Ômega 3', score: 88, segmento: 'icp-alto', fontes: ['pesquisa', 'instagram'], canais: ['email', 'whatsapp'] },
  { id: '2', nome: 'Carlos Mendes', email: 'carlos.m@email.com', telefone: '(21) 99741-2203', interesse: 'Whey', score: 74, segmento: 'icp-alto', fontes: ['ac', 'pesquisa'], canais: ['email', 'whatsapp', 'instagram'] },
  { id: '3', nome: 'Débora Nunes', email: 'debora.n@email.com', telefone: '(31) 99655-8890', interesse: 'Multivitamínico', score: 66, segmento: 'icp-medio', fontes: ['clint'], canais: ['whatsapp'] },
  { id: '4', nome: 'Eduardo Lima', email: 'edu.lima@email.com', telefone: '(41) 99530-1177', interesse: 'Creatina', score: 61, segmento: 'icp-medio', fontes: ['pesquisa'], canais: ['email'] },
  { id: '5', nome: 'Fernanda Alves', email: 'fe.alves@email.com', telefone: '(51) 99420-6634', interesse: 'Ômega 3', score: 58, segmento: 'icp-medio', fontes: ['instagram', 'manychat'], canais: ['instagram', 'whatsapp'] },
  { id: '6', nome: 'Gustavo Prado', email: 'g.prado@email.com', telefone: '(11) 99318-9902', interesse: 'Colágeno', score: 44, segmento: 'icp-baixo', fontes: ['ac'], canais: ['email'] },
  { id: '7', nome: 'Helena Castro', email: 'helena.c@email.com', telefone: '(19) 99205-4418', interesse: 'Magnésio', score: 39, segmento: 'icp-baixo', fontes: ['clint', 'pesquisa'], canais: ['whatsapp'] },
  { id: '8', nome: 'Igor Ramos', email: 'igor.r@email.com', telefone: '(85) 99187-3325', interesse: 'Whey', score: 34, segmento: 'icp-baixo', fontes: ['unnichat'], canais: ['whatsapp'] },
  { id: '9', nome: 'Juliana Dias', email: 'ju.dias@email.com', telefone: '(62) 99072-7781', interesse: 'Multivitamínico', score: 24, segmento: 'sem-perfil', fontes: ['instagram'], canais: ['instagram'] },
  { id: '10', nome: 'Marcos Vieira', email: 'm.vieira@email.com', telefone: '(71) 99916-2258', interesse: '—', score: 18, segmento: 'sem-perfil', fontes: ['manychat'], canais: ['whatsapp'] },
  { id: '11', nome: 'Patrícia Gomes', email: 'pati.g@email.com', telefone: '(11) 99843-5567', interesse: 'Ômega 3', score: 71, segmento: 'cliente-upsell', fontes: ['curseduca', 'pesquisa'], canais: ['email', 'whatsapp'] },
  { id: '12', nome: 'Rafael Souza', email: 'rafa.souza@email.com', telefone: '(27) 99730-8814', interesse: 'Creatina', score: 63, segmento: 'cliente-upsell', fontes: ['curseduca'], canais: ['email'] },
  { id: '13', nome: 'Sônia Martins', email: 'sonia.m@email.com', telefone: '(48) 99621-3390', interesse: 'Colágeno', score: 55, segmento: 'cliente-upsell', fontes: ['curseduca', 'ac'], canais: ['email', 'whatsapp'] },
  { id: '14', nome: 'Thiago Barros', email: 't.barros@email.com', telefone: '(11) 99512-7746', interesse: '—', score: 21, segmento: 'cliente-sem-perfil', fontes: ['curseduca'], canais: ['email'] },
  { id: '15', nome: 'Vanessa Lopes', email: 'v.lopes@email.com', telefone: '(11) 99408-1129', interesse: '—', score: 15, segmento: 'cliente-sem-perfil', fontes: ['curseduca', 'manychat'], canais: ['whatsapp'] },
  { id: '16', nome: 'William Costa', email: 'w.costa@email.com', telefone: '(11) 99301-6653', interesse: 'Magnésio', score: 82, segmento: 'icp-alto', fontes: ['pesquisa', 'ac', 'instagram'], canais: ['email', 'whatsapp', 'instagram'] },
];

/** Temperatura e tier derivados do score (mesma lógica do Lead Score do Dobro). */
function tierDoScore(score: number): Tier {
  if (score >= 60) return 'S';
  if (score >= 40) return 'A';
  if (score >= 20) return 'B';
  return 'C';
}
function temperaturaDoTier(tier: Tier): Temperatura {
  if (tier === 'S' || tier === 'A') return 'quente';
  if (tier === 'B') return 'morno';
  return 'frio';
}

const TIER_BADGE: Record<Tier, string> = {
  S: 'bg-red-500/20 text-red-400 border-red-500/30',
  A: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  B: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  C: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

const TEMP_META: Record<Temperatura, { label: string; barra: string; texto: string }> = {
  quente: { label: 'Quente', barra: 'bg-red-500', texto: 'text-red-400' },
  morno: { label: 'Morno', barra: 'bg-amber-500', texto: 'text-amber-400' },
  frio: { label: 'Frio', barra: 'bg-blue-500', texto: 'text-blue-400' },
};

function LeadScoreBlock({ title, subtitle }: BlockProps) {
  const [segmento, setSegmento] = useState<string | null>(null);

  const porTemperatura = useMemo(() => {
    const acc: Record<Temperatura, number> = { quente: 0, morno: 0, frio: 0 };
    for (const l of LEADS) acc[temperaturaDoTier(tierDoScore(l.score))] += 1;
    return acc;
  }, []);

  const porSegmento = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const l of LEADS) acc[l.segmento] = (acc[l.segmento] ?? 0) + 1;
    return acc;
  }, []);

  const visiveis = useMemo(
    () =>
      (segmento ? LEADS.filter((l) => l.segmento === segmento) : LEADS)
        .slice()
        .sort((a, b) => b.score - a.score),
    [segmento],
  );

  const total = LEADS.length;

  return (
    <div>
      <SectionHeader title={title ?? 'Análise de Leads quentes'} subtitle={subtitle} icon="🔥" />

      {/* Termômetro da base */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(['quente', 'morno', 'frio'] as Temperatura[]).map((t) => {
          const n = porTemperatura[t];
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          const m = TEMP_META[t];
          return (
            <div key={t} className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
              <div className="flex items-baseline justify-between">
                <span className={`text-sm font-semibold ${m.texto}`}>{m.label}</span>
                <span className="text-xs text-gray-500">{pct}%</span>
              </div>
              <div className="mt-1 text-2xl font-bold text-gray-100">{n}</div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-700/50">
                <div className={`h-full rounded-full ${m.barra}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Segmentos de ação */}
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Segmentos de ação</h3>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SEGMENTOS.map((s) => {
          const ativo = segmento === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSegmento(ativo ? null : s.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                ativo
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-gray-700/50 bg-gray-800/60 hover:border-blue-500/25'
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className={`text-sm font-semibold ${s.accent}`}>{s.label}</span>
                <span className="text-lg font-bold text-gray-100">{porSegmento[s.id] ?? 0}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{s.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Tabela de leads */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
          {segmento ? `Leads · ${SEGMENTOS.find((s) => s.id === segmento)?.label}` : 'Todos os leads'}
        </h3>
        {segmento && (
          <button
            type="button"
            onClick={() => setSegmento(null)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Limpar filtro
          </button>
        )}
      </div>

      {visiveis.length === 0 ? (
        <EmptyState message="Nenhum lead neste segmento." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Interesse</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Canais</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((l) => {
                  const tier = tierDoScore(l.score);
                  return (
                    <tr
                      key={l.id}
                      className="border-b border-gray-800/60 last:border-0 hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-100">{l.nome}</div>
                        <div className="text-xs text-gray-500">{l.email} · {l.telefone}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{l.interesse}</td>
                      <td className="px-4 py-3 text-right font-mono tnum font-semibold text-gray-100">{l.score}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${TIER_BADGE[tier]}`}
                        >
                          Tier {tier}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {l.canais.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center rounded-full border border-gray-600/50 bg-gray-700/40 px-2 py-0.5 text-[11px] text-gray-400"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/** Definição registrável do bloco custom "Análise de Leads quentes". */
export const leadScore: BlockDefinition = {
  type: 'custom:lead-score',
  component: LeadScoreBlock,
  defaultDataShape: 'raw',
};
