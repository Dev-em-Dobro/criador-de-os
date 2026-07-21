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

      // 3) CONTEÚDO — grupo com 2 sub-abas (rotas próprias, compartilháveis):
      //      · Painel     (/conteudo/painel)     → dashboard: métricas + agenda + lista.
      //      · Cronograma (/conteudo/cronograma) → página de edição da semana.
      //    Ambas leem os posts REAIS de v_conteudo_posts (allowlist). A rota base
      //    /conteudo redireciona para /conteudo/painel (primeira aba).
      {
        key: 'conteudo',
        label: 'Conteúdo',
        icon: 'CalendarDays',
        route: '/conteudo',
        tabs: [
          {
            id: 'painel',
            label: 'Painel',
            icon: 'LayoutDashboard',
            view: {
              block: 'custom:conteudo-dashboard',
              title: 'Conteúdo — Instagram',
              subtitle: 'Seu painel — próximos posts, crescimento e agenda',
              config: {
                titleField: 'titulo',
                dateField: 'data_programada',
                formatField: 'formato',
                statusField: 'estado',
                linkField: 'link_presente_notion',
                linkLabel: 'Presente',
                resumoLabel: 'Resumo',
                newPostLabel: 'Novo post',
                updateScheduleLabel: 'Atualizar cronograma',
                limit: 6,
                statusMap: {
                  rascunho: { label: 'Rascunho', tone: 'progress' },
                  pronto: { label: 'Pronto', tone: 'ready' },
                  publicado: { label: 'Publicado', tone: 'done' },
                },
                // MÉTRICAS do perfil (@devemdobro). Engajamento e melhores posts são
                // dado REAL coletado do Instagram (18/07). Seguidores e crescimento
                // ficam `null` de propósito — só entram quando a conta for conectada
                // (token de Insights): a UI mostra "conectar", nunca número inventado.
                metrics: {
                  updatedAt: '2026-07-18',
                  source: 'seed',
                  followers: { current: null, series: null },
                  growth: { week: null, month: null, q3: null, h6: null, y1: null },
                  engagement: {
                    windowDays: 7,
                    interactions: 4654,
                    avgPerPost: 465,
                    postsCount: 10,
                    best: {
                      title: 'CEO da Microsoft: ainda vale aprender a programar',
                      likes: 1653,
                      comments: 161,
                      permalink: 'https://www.instagram.com/p/Da1JPvuj0e5/',
                    },
                  },
                  topPosts: [
                    { title: 'CEO da Microsoft — "comenta CONCEITO"', type: 'Carrossel', likes: 1653, comments: 161, date: '2026-07-15', permalink: 'https://www.instagram.com/p/Da1JPvuj0e5/' },
                    { title: '"Pular etapas" (meme)', type: 'Imagem', likes: 1180, comments: 40, date: '2026-07-12', permalink: 'https://www.instagram.com/p/DasjinluD4b/' },
                    { title: 'Claude Max — "comenta MAX"', type: 'Carrossel', likes: 351, comments: 67, date: '2026-07-14', permalink: 'https://www.instagram.com/p/Daxih3zDo17/' },
                    { title: 'Segurança no código — "comenta SEGURANÇA"', type: 'Carrossel', likes: 178, comments: 90, date: '2026-07-14', permalink: 'https://www.instagram.com/p/Dayg3t6D4K2/' },
                    { title: 'Loop de autoavaliação — "comenta LOOP"', type: 'Carrossel', likes: 175, comments: 112, date: '2026-07-16', permalink: 'https://www.instagram.com/p/Da3rHqMCW72/' },
                  ],
                },
              },
              dataSource: {
                kind: 'query',
                view: 'v_conteudo_posts',
                select: [
                  'id',
                  'titulo',
                  'capa_url',
                  'data_programada',
                  'cta_final',
                  'link_presente_notion',
                  'estado',
                  'formato',
                ],
                orderBy: [{ field: 'data_programada', dir: 'asc' }],
                limit: 100,
              },
            },
          },
          {
            id: 'cronograma',
            label: 'Cronograma',
            icon: 'ClipboardList',
            view: {
              block: 'custom:conteudo-cronograma',
              title: 'Cronograma',
              subtitle: 'Monte a semana — adicione, edite ou remova postagens',
              config: {
                titleField: 'titulo',
                dateField: 'data_programada',
                formatField: 'formato',
                statusField: 'estado',
              },
              // Mesmo dataSource do painel: o editor precisa dos posts para
              // preencher os dias e detectar edições. Aqui também trazemos os
              // campos de briefing (só usados na tela de edição do cronograma).
              dataSource: {
                kind: 'query',
                view: 'v_conteudo_posts',
                select: [
                  'id',
                  'titulo',
                  'capa_url',
                  'data_programada',
                  'cta_final',
                  'link_presente_notion',
                  'briefing_url',
                  'briefing',
                  'refs_links',
                  'estado',
                  'formato',
                ],
                orderBy: [{ field: 'data_programada', dir: 'asc' }],
                limit: 100,
              },
            },
          },
        ],
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
