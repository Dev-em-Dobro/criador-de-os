/**
 * apps/dobro — Manifesto de EXEMPLO do "Dobro OS".
 *
 * Prova end-to-end do motor de manifesto. A tela "Visão geral" agora usa
 * `kind: 'query'` (dado REAL vindo da Neon via /api/query — Fase 1C); as demais
 * telas seguem em `kind: 'static'` (mock embutido) enquanto suas views não
 * existem. NENHUM código React descreve a navegação: menus, sub-abas, telas e
 * dados são TUDO config aqui.
 *
 * O tema violeta do Dobro vive AQUI (não no core, cujo default é neutro) — é o
 * cliente que pinta o OS com sua marca.
 */

import type { ClientManifest } from '@os/core';

const audienciaRows = [
  {
    inscritos: 48200,
    inscritos_prev: 45100,
    visualizacoes: 312000,
    visualizacoes_prev: 287500,
    engajamento: 7.4,
    engajamento_prev: 6.9,
    novos_seguidores: 2140,
    novos_seguidores_prev: 1980,
  },
];

const lancamentosRows = [
  {
    faturamento: 540000,
    faturamento_prev: 498000,
    ticket_medio: 1980,
    ticket_medio_prev: 1875,
    checkout: 62,
    checkout_prev: 58,
  },
];

export const dobroManifest: ClientManifest = {
  version: 1,

  identity: {
    clientId: 'dobro',
    displayName: 'Dev em Dobro',
    productName: 'Dobro OS',
    logoUrl: '/logo.webp',
    // Tema do cliente: o roxo característico do Dobro (sobrescreve o default
    // neutro do core). Deriva de identity.theme → CSS vars pelo ThemeProvider.
    theme: {
      brand: '#6528d3',
      brandBright: '#8b5cf6',
      brandSoft: '#c9a0ff',
      brandStrong: '#5421b5',
      brandDeep: '#45199a',
      signal: '#22c55e',
    },
  },

  dataApi: {
    // Vazio = mesma origem (/api/*). Sem segredo aqui (a 1C usa isto de verdade).
    baseUrl: '',
    queryPath: '/api/query',
    authPath: '/api/auth',
  },

  navigation: {
    redirectRoot: '/visao-geral',
    menus: [
      // 1) VISÃO GERAL — folha direta com grade de KPIs (dado REAL da Neon).
      //    kind:'query' → o core envia este dataSource a POST /api/query; o
      //    backend valida contra a allowlist (view v_visao_geral) e responde
      //    com SQL parametrizado. O filtro por período vira bind param.
      {
        key: 'visao-geral',
        label: 'Visão geral',
        icon: 'LayoutDashboard',
        route: '/visao-geral',
        view: {
          block: 'kpi-dashboard',
          title: 'Visão geral',
          subtitle: 'Desempenho consolidado — dado real (Neon via /api/query)',
          config: {
            columns: 4,
            kpis: [
              { key: 'receita', label: 'Receita', unit: 'R$', target: 150000, tooltip: 'Receita acumulada no período.' },
              { key: 'conversao', label: 'Conversão', unit: '%', target: 4 },
              { key: 'roas', label: 'ROAS', unit: 'x', target: 3 },
              { key: 'leads', label: 'Leads', unit: 'count', target: 1600 },
            ],
          },
          dataSource: {
            kind: 'query',
            view: 'v_visao_geral',
            select: [
              'receita',
              'receita_prev',
              'conversao',
              'conversao_prev',
              'roas',
              'roas_prev',
              'leads',
              'leads_prev',
            ],
            where: [{ field: 'period', op: '=', value: { ref: 'period' } }],
            limit: 1,
          },
        },
      },

      // 2) MÉTRICAS — grupo com sub-abas: Audiência (KPIs) + Lançamentos (KPIs)
      {
        key: 'metricas',
        label: 'Métricas',
        icon: 'BarChart3',
        route: '/metricas',
        tabs: [
          {
            id: 'audiencia',
            label: 'Audiência',
            icon: 'MonitorPlay',
            view: {
              block: 'kpi-dashboard',
              title: 'Audiência',
              subtitle: 'Alcance e engajamento (static)',
              config: {
                columns: 4,
                kpis: [
                  { key: 'inscritos', label: 'Inscritos', unit: 'count', target: 50000 },
                  { key: 'visualizacoes', label: 'Visualizações', unit: 'count', target: 300000 },
                  { key: 'engajamento', label: 'Engajamento', unit: '%', target: 8 },
                  { key: 'novos_seguidores', label: 'Novos seguidores', unit: 'count', target: 2000 },
                ],
              },
              dataSource: { kind: 'static', data: audienciaRows },
            },
          },
          {
            id: 'lancamentos',
            label: 'Lançamentos',
            icon: 'Rocket',
            view: {
              block: 'kpi-dashboard',
              title: 'Lançamentos',
              subtitle: 'Resultado do último lançamento (static)',
              config: {
                columns: 3,
                kpis: [
                  { key: 'faturamento', label: 'Faturamento', unit: 'R$', target: 500000 },
                  { key: 'ticket_medio', label: 'Ticket médio', unit: 'R$', target: 2000 },
                  { key: 'checkout', label: 'Conversão checkout', unit: '%', target: 60 },
                ],
              },
              dataSource: { kind: 'static', data: lancamentosRows },
            },
          },
        ],
      },

      // 3) GUIA — folha direta com doc-viewer (texto puro de config, sem dados)
      {
        key: 'guia',
        label: 'Guia',
        icon: 'FileText',
        route: '/guia',
        view: {
          block: 'doc-viewer',
          title: 'Sobre este OS',
          subtitle: 'Documento de exemplo renderizado por config',
          config: {
            heading: 'Como este OS é montado',
            body: [
              'Esta tela inteira é descrita por um manifesto (dados), não por código React. Menus, sub-abas, telas e dados vêm todos do arquivo manifest.ts.',
              'O motor (ManifestRouter) gera as rotas, alimenta o shell e, para cada rota, resolve o bloco no registry e injeta config + dados resolvidos pelo DataAdapter.',
              'Nesta fatia (1B), os dados são estáticos (embutidos no manifesto). A fatia 1C liga o DataAdapter à API do app (Neon) para os tipos query e rest.',
            ],
          },
          // Sem dataSource: bloco puramente de config.
        },
      },
    ],
  },

  settings: {
    // Auth OBRIGATÓRIA (Better Auth self-hosted): o AuthGate exige login antes
    // de renderizar o app. Usuário de teste (dev): admin@dobro.local.
    auth: { enabled: true, provider: 'better-auth' },
    period: { enabled: true, default: 'monthly', options: ['weekly', 'monthly', 'quarterly'] },
    footerText: 'Dev em Dobro · Dados via Neon (Fase 1C)',
  },
};
