/**
 * apps/neurovida — bloco CUSTOM: Fatura do cartão (controle de cortes).
 *
 * Inspirado no Financeiro do Dobro OS, focado no CARTÃO: a fatura de cada mês,
 * com os itens agrupados por CATEGORIA e expansíveis; cada item pode ser
 * marcado "pra cortar", e o topo recalcula quanto a fatura fica DEPOIS dos
 * cortes (+ economia anual dos recorrentes cortados). Dá controle total do cartão.
 *
 * Protótipo: dados mock + cortes persistidos em localStorage. Design system do
 * @os/core (herda o skin creme/dusk).
 */

import { useMemo, useState } from 'react';
import { SectionHeader } from '@os/core';
import type { BlockDefinition, BlockProps } from '@os/core';

interface Item {
  id: string;
  descricao: string;
  estabelecimento: string;
  categoria: string;
  valor: number;
  recorrente: boolean; // assinatura/ferramenta — corte gera economia recorrente
}
interface Fatura {
  mesId: string;
  label: string;
  vencimento: string;
  itens: Item[];
}

/** Ordem e rótulo das categorias (a ordem em que aparecem). */
const CATEGORIAS = ['Ferramentas', 'Tráfego', 'Fornecedores', 'Logística', 'Serviços'] as const;

const CAT_ACCENT: Record<string, string> = {
  Ferramentas: 'text-amber-400',
  Tráfego: 'text-blue-300',
  Fornecedores: 'text-emerald-400',
  Logística: 'text-purple-300',
  Serviços: 'text-gray-300',
};

/** 3 faturas mensais mock. `recorrente` marca ferramentas/assinaturas (candidatas a corte). */
const FATURAS: Fatura[] = [
  {
    mesId: '2026-07',
    label: 'jul/26',
    vencimento: '2026-08-10',
    itens: [
      { id: 'jul-1', descricao: 'GoHighLevel', estabelecimento: 'GHL', categoria: 'Ferramentas', valor: 1650, recorrente: true },
      { id: 'jul-2', descricao: 'Nuvem Shop — plano', estabelecimento: 'Nuvemshop', categoria: 'Ferramentas', valor: 320, recorrente: true },
      { id: 'jul-3', descricao: 'Fidelimax — pontos', estabelecimento: 'Fidelimax', categoria: 'Ferramentas', valor: 590, recorrente: true },
      { id: 'jul-4', descricao: 'ActiveCampaign', estabelecimento: 'ActiveCampaign', categoria: 'Ferramentas', valor: 420, recorrente: true },
      { id: 'jul-5', descricao: 'ManyChat', estabelecimento: 'ManyChat', categoria: 'Ferramentas', valor: 180, recorrente: true },
      { id: 'jul-6', descricao: 'PubMed API / conteúdo', estabelecimento: 'NCBI', categoria: 'Ferramentas', valor: 260, recorrente: true },
      { id: 'jul-7', descricao: 'Meta Ads — Clube', estabelecimento: 'Meta', categoria: 'Tráfego', valor: 8400, recorrente: false },
      { id: 'jul-8', descricao: 'Google Ads — Lançamento', estabelecimento: 'Google', categoria: 'Tráfego', valor: 6200, recorrente: false },
      { id: 'jul-9', descricao: 'Matéria-prima Ômega 3', estabelecimento: 'Fornecedor SP', categoria: 'Fornecedores', valor: 12800, recorrente: false },
      { id: 'jul-10', descricao: 'Embalagens e rótulos', estabelecimento: 'Gráfica', categoria: 'Fornecedores', valor: 3400, recorrente: false },
      { id: 'jul-11', descricao: 'Frete Correios', estabelecimento: 'Correios', categoria: 'Logística', valor: 2180, recorrente: false },
      { id: 'jul-12', descricao: 'Designer freelancer', estabelecimento: 'PJ Design', categoria: 'Serviços', valor: 2500, recorrente: false },
      { id: 'jul-13', descricao: 'Consultoria científica', estabelecimento: 'PJ Ciência', categoria: 'Serviços', valor: 1800, recorrente: false },
    ],
  },
  {
    mesId: '2026-08',
    label: 'ago/26',
    vencimento: '2026-09-10',
    itens: [
      { id: 'ago-1', descricao: 'GoHighLevel', estabelecimento: 'GHL', categoria: 'Ferramentas', valor: 1650, recorrente: true },
      { id: 'ago-2', descricao: 'Nuvem Shop — plano', estabelecimento: 'Nuvemshop', categoria: 'Ferramentas', valor: 320, recorrente: true },
      { id: 'ago-3', descricao: 'Fidelimax — pontos', estabelecimento: 'Fidelimax', categoria: 'Ferramentas', valor: 590, recorrente: true },
      { id: 'ago-4', descricao: 'ActiveCampaign', estabelecimento: 'ActiveCampaign', categoria: 'Ferramentas', valor: 420, recorrente: true },
      { id: 'ago-5', descricao: 'Zapier', estabelecimento: 'Zapier', categoria: 'Ferramentas', valor: 210, recorrente: true },
      { id: 'ago-6', descricao: 'Meta Ads — Clube', estabelecimento: 'Meta', categoria: 'Tráfego', valor: 9100, recorrente: false },
      { id: 'ago-7', descricao: 'TikTok Ads', estabelecimento: 'TikTok', categoria: 'Tráfego', valor: 2100, recorrente: false },
      { id: 'ago-8', descricao: 'Matéria-prima Whey', estabelecimento: 'Fornecedor MG', categoria: 'Fornecedores', valor: 9800, recorrente: false },
      { id: 'ago-9', descricao: 'Potes e tampas', estabelecimento: 'Fornecedor SP', categoria: 'Fornecedores', valor: 2600, recorrente: false },
      { id: 'ago-10', descricao: 'Frete Correios', estabelecimento: 'Correios', categoria: 'Logística', valor: 2480, recorrente: false },
      { id: 'ago-11', descricao: 'Transportadora', estabelecimento: 'Braspress', categoria: 'Logística', valor: 890, recorrente: false },
      { id: 'ago-12', descricao: 'Contador', estabelecimento: 'PJ Contábil', categoria: 'Serviços', valor: 1200, recorrente: true },
    ],
  },
  {
    mesId: '2026-09',
    label: 'set/26',
    vencimento: '2026-10-10',
    itens: [
      { id: 'set-1', descricao: 'GoHighLevel', estabelecimento: 'GHL', categoria: 'Ferramentas', valor: 1650, recorrente: true },
      { id: 'set-2', descricao: 'Nuvem Shop — plano', estabelecimento: 'Nuvemshop', categoria: 'Ferramentas', valor: 320, recorrente: true },
      { id: 'set-3', descricao: 'Fidelimax — pontos', estabelecimento: 'Fidelimax', categoria: 'Ferramentas', valor: 590, recorrente: true },
      { id: 'set-4', descricao: 'Canva Pro', estabelecimento: 'Canva', categoria: 'Ferramentas', valor: 55, recorrente: true },
      { id: 'set-5', descricao: 'Google Workspace', estabelecimento: 'Google', categoria: 'Ferramentas', valor: 90, recorrente: true },
      { id: 'set-6', descricao: 'Meta Ads — Clube', estabelecimento: 'Meta', categoria: 'Tráfego', valor: 7800, recorrente: false },
      { id: 'set-7', descricao: 'Google Ads', estabelecimento: 'Google', categoria: 'Tráfego', valor: 5400, recorrente: false },
      { id: 'set-8', descricao: 'Matéria-prima Multivit.', estabelecimento: 'Fornecedor PR', categoria: 'Fornecedores', valor: 8200, recorrente: false },
      { id: 'set-9', descricao: 'Frete Correios', estabelecimento: 'Correios', categoria: 'Logística', valor: 2050, recorrente: false },
      { id: 'set-10', descricao: 'Designer freelancer', estabelecimento: 'PJ Design', categoria: 'Serviços', valor: 2500, recorrente: false },
      { id: 'set-11', descricao: 'Advogado — contratos', estabelecimento: 'PJ Jurídico', categoria: 'Serviços', valor: 800, recorrente: false },
    ],
  },
];

const STORAGE_KEY = 'neurovida-fatura-cortes';

const fmtBRL = (n: number): string => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

function loadCortes(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* vazio */
  }
  return new Set();
}

function FaturaCartaoBlock({ title, subtitle }: BlockProps) {
  const [mesId, setMesId] = useState(FATURAS[0].mesId);
  const [cortes, setCortes] = useState<Set<string>>(() => loadCortes());
  const [abertas, setAbertas] = useState<Set<string>>(() => new Set(['Ferramentas']));

  const fatura = FATURAS.find((f) => f.mesId === mesId) ?? FATURAS[0];

  function toggleCorte(id: string): void {
    setCortes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        /* sem persistência */
      }
      return next;
    });
  }

  function toggleCategoria(cat: string): void {
    setAbertas((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  const resumo = useMemo(() => {
    const total = fatura.itens.reduce((s, i) => s + i.valor, 0);
    const cortados = fatura.itens.filter((i) => cortes.has(i.id));
    const totalCortes = cortados.reduce((s, i) => s + i.valor, 0);
    const economiaAno = cortados.filter((i) => i.recorrente).reduce((s, i) => s + i.valor, 0) * 12;
    return { total, totalCortes, aposCortes: total - totalCortes, economiaAno };
  }, [fatura, cortes]);

  const porCategoria = useMemo(() => {
    return CATEGORIAS.map((cat) => {
      const itens = fatura.itens.filter((i) => i.categoria === cat);
      const total = itens.reduce((s, i) => s + i.valor, 0);
      return { cat, itens, total };
    }).filter((g) => g.itens.length > 0);
  }, [fatura]);

  return (
    <div>
      <SectionHeader title={title ?? 'Fatura do cartão'} subtitle={subtitle} icon="💳" />

      {/* Seletor de mês */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FATURAS.map((f) => (
          <button
            key={f.mesId}
            type="button"
            onClick={() => setMesId(f.mesId)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              f.mesId === mesId
                ? 'border-blue-500 bg-blue-500/15 text-blue-300'
                : 'border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-2 text-xs text-gray-500">Vence em {new Date(fatura.vencimento).toLocaleDateString('pt-BR')}</span>
      </div>

      {/* Resumo (recalcula com os cortes) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
          <div className="text-xs text-gray-400">Total da fatura</div>
          <div className="mt-1 text-2xl font-bold text-gray-100">{fmtBRL(resumo.total)}</div>
        </div>
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="text-xs text-gray-400">Marcado pra cortar</div>
          <div className="mt-1 text-2xl font-bold text-amber-400">{fmtBRL(resumo.totalCortes)}</div>
        </div>
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-5">
          <div className="text-xs text-gray-400">Fatura após cortes</div>
          <div className="mt-1 text-2xl font-bold text-emerald-400">{fmtBRL(resumo.aposCortes)}</div>
        </div>
        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5">
          <div className="text-xs text-gray-400">Economia no ano</div>
          <div className="mt-1 text-2xl font-bold text-gray-100">{fmtBRL(resumo.economiaAno)}</div>
          <div className="mt-1 text-[11px] text-gray-500">cortando as ferramentas recorrentes</div>
        </div>
      </div>

      {/* Itens por categoria (expansíveis) */}
      <div className="space-y-3">
        {porCategoria.map((g) => {
          const aberta = abertas.has(g.cat);
          const cortadoNaCat = g.itens.filter((i) => cortes.has(i.id)).reduce((s, i) => s + i.valor, 0);
          return (
            <div key={g.cat} className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 backdrop-blur-sm">
              {/* Cabeçalho da categoria */}
              <button
                type="button"
                onClick={() => toggleCategoria(g.cat)}
                className="flex w-full items-center justify-between px-5 py-3.5 text-left transition-colors hover:bg-gray-700/20"
              >
                <span className="flex items-center gap-2">
                  <span className="text-gray-500">{aberta ? '▾' : '▸'}</span>
                  <span className={`text-sm font-semibold ${CAT_ACCENT[g.cat] ?? 'text-gray-300'}`}>{g.cat}</span>
                  <span className="text-xs text-gray-500">· {g.itens.length} {g.itens.length === 1 ? 'item' : 'itens'}</span>
                  {cortadoNaCat > 0 && (
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[11px] text-amber-400">
                      −{fmtBRL(cortadoNaCat)}
                    </span>
                  )}
                </span>
                <span className="font-mono tnum text-sm font-semibold text-gray-100">{fmtBRL(g.total)}</span>
              </button>

              {/* Itens */}
              {aberta && (
                <div className="border-t border-gray-700/50">
                  {g.itens.map((item) => {
                    const cortado = cortes.has(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex cursor-pointer items-center gap-3 border-b border-gray-800/60 px-5 py-3 last:border-0 transition-colors hover:bg-gray-700/10 ${
                          cortado ? 'opacity-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={cortado}
                          onChange={() => toggleCorte(item.id)}
                          className="h-4 w-4 shrink-0 accent-red-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium text-gray-100 ${cortado ? 'line-through' : ''}`}>
                            {item.descricao}
                            {item.recorrente && (
                              <span className="ml-2 inline-flex items-center rounded-full border border-gray-600/50 bg-gray-700/40 px-1.5 py-0.5 text-[10px] font-normal text-gray-400">
                                recorrente
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">{item.estabelecimento}</div>
                        </div>
                        <span className={`font-mono tnum text-sm font-semibold ${cortado ? 'text-gray-500 line-through' : 'text-gray-100'}`}>
                          {fmtBRL(item.valor)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Definição registrável do bloco custom "Fatura do cartão". */
export const faturaCartao: BlockDefinition = {
  type: 'custom:fatura-cartao',
  component: FaturaCartaoBlock,
  defaultDataShape: 'raw',
};
