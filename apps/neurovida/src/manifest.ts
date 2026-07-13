/**
 * apps/neurovida — Manifesto do "Neurovida OS" (PROTÓTIPO ESTÁTICO).
 *
 * Baseado no relatório Dev em Dobro × Neurovida. Menus definidos com o dono:
 *  Financeiro (faturas do cartão), Clube, Análise de Leads quentes,
 *  Simulador (Premissas & Custos + Escada de Crescimento) e Estúdio IA.
 *
 * Dados `kind: 'static'` (mockados) nos blocos genéricos; os blocos custom
 * (lead-score, carousel-generator) gerenciam o próprio estado. Tema verde-esmeralda.
 */

import type { ClientManifest } from '@os/core';

// ============================================================
// Dados mockados (uma "fonte" por tela — kind: 'static')
// ============================================================

const clubeMembros = [
  { assinantes: 4820, assinantes_prev: 4510, aulas: 12840, aulas_prev: 11200, pontos: 1960, pontos_prev: 1740, churn: 3.2, churn_prev: 4.1 },
];

const clubeAcessos = [
  { id: 1, membro: 'Ana Beatriz Rocha', plano: 'Anual', hotmart: 'Ativo', loja: 'Ativo', pontos: 'Ativo', ultimo_acesso: '2026-07-11' },
  { id: 2, membro: 'Carlos Mendes', plano: 'Mensal', hotmart: 'Ativo', loja: 'Sem acesso', pontos: 'Ativo', ultimo_acesso: '2026-07-10' },
  { id: 3, membro: 'Débora Nunes', plano: 'Trimestral', hotmart: 'Ativo', loja: 'Ativo', pontos: 'Sem acesso', ultimo_acesso: '2026-07-09' },
  { id: 4, membro: 'Eduardo Lima', plano: 'Anual', hotmart: 'Pendente', loja: 'Ativo', pontos: 'Ativo', ultimo_acesso: '2026-07-06' },
  { id: 5, membro: 'Fernanda Alves', plano: 'Mensal', hotmart: 'Ativo', loja: 'Ativo', pontos: 'Ativo', ultimo_acesso: '2026-07-11' },
  { id: 6, membro: 'Gustavo Prado', plano: 'Anual', hotmart: 'Ativo', loja: 'Sem acesso', pontos: 'Sem acesso', ultimo_acesso: '2026-06-29' },
  { id: 7, membro: 'Helena Castro', plano: 'Trimestral', hotmart: 'Pendente', loja: 'Pendente', pontos: 'Ativo', ultimo_acesso: '2026-07-02' },
  { id: 8, membro: 'Igor Ramos', plano: 'Mensal', hotmart: 'Ativo', loja: 'Ativo', pontos: 'Ativo', ultimo_acesso: '2026-07-10' },
  { id: 9, membro: 'Juliana Dias', plano: 'Anual', hotmart: 'Ativo', loja: 'Ativo', pontos: 'Pendente', ultimo_acesso: '2026-07-08' },
  { id: 10, membro: 'Marcos Vieira', plano: 'Mensal', hotmart: 'Ativo', loja: 'Sem acesso', pontos: 'Ativo', ultimo_acesso: '2026-07-07' },
];

// ============================================================
// Manifesto
// ============================================================

export const neurovidaManifest: ClientManifest = {
  version: 1,

  identity: {
    clientId: 'neurovida',
    displayName: 'Neurovida',
    productName: 'Neurovida OS',
    logoUrl: '/logo.svg',
    // Verde-esmeralda: saúde, natural, ciência. Pinta todo o acento do design system.
    theme: {
      brand: '#059669',
      brandBright: '#10b981',
      brandSoft: '#6ee7b7',
      brandStrong: '#047857',
      brandDeep: '#065f46',
      signal: '#22c55e',
    },
  },

  dataApi: { baseUrl: '' },

  navigation: {
    // Abre no menu principal: Financeiro (faturas do cartão).
    redirectRoot: '/financeiro',
    menus: [
      // 1) FINANCEIRO — Fatura do cartão com controle de cortes (bloco custom).
      {
        key: 'financeiro',
        label: 'Financeiro',
        icon: 'Wallet',
        route: '/financeiro',
        view: {
          block: 'custom:fatura-cartao',
          title: 'Fatura do cartão',
          subtitle: 'Por mês, por categoria — marque o que cortar e veja quanto sobra',
          config: {},
        },
      },

      // 2) CLUBE — Membros (comparativo) + Acessos (unificação das 3 plataformas).
      {
        key: 'clube',
        label: 'Clube',
        icon: 'Heart',
        route: '/clube',
        tabs: [
          {
            id: 'membros',
            label: 'Membros',
            icon: 'UserCheck',
            view: {
              block: 'metric-comparison',
              title: 'Clube — Membros',
              subtitle: 'Este mês vs. o anterior',
              config: {
                metrics: [
                  { key: 'assinantes', label: 'Assinantes ativos', unit: 'count' },
                  { key: 'aulas', label: 'Aulas assistidas', unit: 'count' },
                  { key: 'pontos', label: 'Resgates de pontos', unit: 'count' },
                  { key: 'churn', label: 'Churn', unit: '%', lowerIsBetter: true },
                ],
              },
              dataSource: { kind: 'static', data: clubeMembros },
            },
          },
          {
            id: 'acessos',
            label: 'Acessos',
            icon: 'ShieldCheck',
            view: {
              block: 'data-table',
              title: 'Acessos do Clube',
              subtitle: 'Hoje o membro entra em 3 lugares (Hotmart, Nuvem Shop, Fidelimax) — a meta é unificar',
              config: {
                columns: [
                  { key: 'membro', label: 'Membro' },
                  { key: 'plano', label: 'Plano', format: 'badge' },
                  { key: 'hotmart', label: 'Aulas (Hotmart)', format: 'badge' },
                  { key: 'loja', label: 'Loja (Nuvem Shop)', format: 'badge' },
                  { key: 'pontos', label: 'Pontos (Fidelimax)', format: 'badge' },
                  { key: 'ultimo_acesso', label: 'Último acesso', format: 'date' },
                ],
                defaultSort: { field: 'membro', dir: 'asc' },
                pageSize: 8,
              },
              dataSource: { kind: 'static', data: clubeAcessos },
            },
          },
        ],
      },

      // 3) ANÁLISE DE LEADS QUENTES — porte do "Lead Score" do Dobro OS (bloco custom).
      {
        key: 'leads',
        label: 'Leads quentes',
        icon: 'Target',
        route: '/leads',
        view: {
          block: 'custom:lead-score',
          title: 'Análise de Leads quentes',
          subtitle: 'Temperatura da base, segmentos de ação e leads pontuados',
          config: {},
        },
      },

      // 4) SIMULADOR — porte do Simulador do Dobro OS (Premissas & Custos + Escada).
      {
        key: 'simulador',
        label: 'Simulador',
        icon: 'TrendingUp',
        route: '/simulador',
        view: {
          block: 'custom:simulador',
          title: 'Simulador de Lançamentos',
          subtitle: 'Premissas & custos + escada de crescimento (calculadora invertida)',
          config: {},
        },
      },

      // 5) ESTÚDIO IA — gerador REAL de carrossel científico (Claude API, item 5).
      {
        key: 'conteudo',
        label: 'Estúdio IA',
        icon: 'Dna',
        route: '/conteudo',
        view: {
          block: 'custom:carousel-generator',
          title: 'Estúdio de conteúdo',
          subtitle: 'Gera um carrossel embasado em evidência real (Claude + busca científica)',
          config: {},
        },
      },
    ],
  },

  settings: {
    // Protótipo: sem login (auth desligada). Em produção, Better Auth entra aqui.
    auth: { enabled: false, provider: 'better-auth' },
    period: { enabled: true, default: 'monthly', options: ['weekly', 'monthly', 'quarterly'] },
    footerText: 'Neurovida · protótipo (dados de exemplo) · por Dev em Dobro',
  },
};
