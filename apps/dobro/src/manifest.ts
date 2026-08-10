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

      // 3) RELATÓRIO — a pauta da reunião semanal de marketing e lançamento
      //    (documento do Raphael) virada tela. Menu PRÓPRIO, e não sub-aba de
      //    Conteúdo, porque o público é outro: Conteúdo é de quem produz, o
      //    Relatório é de quem apresenta na reunião. Lê as mesmas medições da aba
      //    Desempenho e busca os cards do cronograma por dentro (planejado vs
      //    publicado e objetivo de funil).
      {
        key: 'relatorio',
        label: 'Relatório',
        icon: 'FileText',
        route: '/relatorio',
        view: {
          block: 'custom:conteudo-relatorio',
          title: 'Relatório da semana',
          subtitle: 'A pauta da reunião estratégica, com os números da semana',
          config: {
            // MESMOS benchmarks das abas Desempenho e Placar: a régua Forte /
            // Saudável / Abaixo precisa ser uma só em todo o OS.
            benchmarks: {
              reel: {
                compartilhamentos: [0.005, 0.015],
                salvamentos: [0.003, 0.01],
                retencao: [0.5, 0.7],
              },
              carrossel: {
                compartilhamentos: [0.003, 0.01],
                salvamentos: [0.005, 0.02],
              },
              post: {
                compartilhamentos: [0.002, 0.007],
                salvamentos: [0.002, 0.007],
              },
            },
          },
          dataSource: {
            kind: 'query',
            view: 'v_conteudo_desempenho',
            select: [
              'id',
              'post_id',
              'data',
              'formato',
              'tema',
              'alcance',
              'visualizacoes',
              'curtidas',
              'comentarios',
              'compartilhamentos',
              'salvamentos',
              'visitas_perfil',
              'seguidores',
              'duracao_s',
              'tempo_medio_s',
              'permalink',
            ],
            orderBy: [{ field: 'data', dir: 'desc' }],
            limit: 300,
          },
        },
      },

      // 4) CONTEÚDO — grupo com sub-abas (rotas próprias, compartilháveis):
      //      · Painel       (/conteudo/painel)       → dashboard: métricas + agenda + lista.
      //      · Cronograma   (/conteudo/cronograma)   → página de edição da semana.
      //      · Desempenho   (/conteudo/desempenho)   → números de cada post publicado.
      //      · Estrategista (/conteudo/estrategista) → qual estrutura de carrossel rende.
      //      · Referências  (/conteudo/referencias)  → os perfis que nos inspiram.
      //    Painel e Cronograma leem os posts REAIS de v_conteudo_posts (allowlist).
      //    A rota base /conteudo redireciona para /conteudo/painel (primeira aba).
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
                generateLabel: 'Gerar com IA',
                updateScheduleLabel: 'Atualizar cronograma',
                limit: 6,
                statusMap: {
                  rascunho: { label: 'Rascunho', tone: 'progress' },
                  pronto: { label: 'Pronto', tone: 'ready' },
                  publicado: { label: 'Publicado', tone: 'done' },
                },
                // METAS SEMANAIS do "Relatório da rede". Cada card mostra a meta ao
                // lado do número (barra + "faltam N"). Escalam com o período (7/30/90d).
                // Alvos com { min, media, alta } têm 3 níveis; número = nível único.
                // Calibradas 03/08/2026 pela distribuição real das últimas 8 semanas
                // (mín ≈ bate quase sempre · média ≈ mediana · alta ≈ pico histórico).
                metasSemana: {
                  // Novos seguidores é LÍQUIDO (ganhos − perdidos) na visão Conta.
                  novosSeguidores: { min: 300, media: 600, alta: 1000 },
                  visualizacoes: { min: 300000, media: 550000, alta: 1000000 },
                  alcance: { min: 150000, media: 250000, alta: 400000 },
                  interacoes: { min: 8000, media: 14000, alta: 20000 },
                  posts: { min: 10, media: 14, alta: 18 },
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
                  'gancho',
                  'legenda',
                  'hashtags',
                  'roteiro',
                  'objetivo',
                ],
                orderBy: [
                  { field: 'data_programada', dir: 'asc' },
                  { field: 'id', dir: 'asc' }, // desempate estável: sem isto a ordem embaralha a cada refresh
                ],
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
                  'gancho',
                  'legenda',
                  'hashtags',
                  'roteiro',
                  'objetivo',
                ],
                orderBy: [
                  { field: 'data_programada', dir: 'asc' },
                  { field: 'id', dir: 'asc' }, // desempate estável: sem isto a ordem embaralha a cada refresh
                ],
                limit: 100,
              },
            },
          },
          {
            id: 'desempenho',
            label: 'Desempenho',
            icon: 'BarChart3',
            view: {
              block: 'custom:conteudo-desempenho',
              title: 'Resumo de desempenho',
              subtitle: 'Como cada conteúdo se saiu — taxas e classificação automáticas',
              config: {
                // Benchmarks por formato (a aba "Referências" da planilha): [limite
                // saudável, limite forte] em decimal (0,5% = 0,005). Edite aqui se o
                // time criar benchmarks próprios — a classificação recalcula sozinha.
                benchmarks: {
                  reel: {
                    compartilhamentos: [0.005, 0.015],
                    salvamentos: [0.003, 0.01],
                    retencao: [0.5, 0.7],
                  },
                  carrossel: {
                    compartilhamentos: [0.003, 0.01],
                    salvamentos: [0.005, 0.02],
                  },
                  post: {
                    compartilhamentos: [0.002, 0.007],
                    salvamentos: [0.002, 0.007],
                  },
                },
              },
              dataSource: {
                kind: 'query',
                view: 'v_conteudo_desempenho',
                select: [
                  'id',
                  'post_id',
                  'data',
                  'formato',
                  'tema',
                  'alcance',
                  'visualizacoes',
                  'curtidas',
                  'comentarios',
                  'compartilhamentos',
                  'salvamentos',
                  'visitas_perfil',
                  'seguidores',
                  'duracao_s',
                  'tempo_medio_s',
                  'permalink',
                ],
                orderBy: [{ field: 'data', dir: 'desc' }],
                limit: 200,
              },
            },
          },
          // PLACAR DA IA — a prestação de contas do gerador: o que ele previu
          // ANTES de publicar contra o que o post fez. Lê v_conteudo_placar, que
          // já casa previsão e medição por card e escolhe a previsão válida (a
          // última feita antes da publicação). Os benchmarks são os MESMOS da aba
          // Desempenho de propósito: previsto e real precisam da mesma régua.
          {
            id: 'placar',
            label: 'Placar da IA',
            icon: 'Target',
            view: {
              block: 'custom:conteudo-placar',
              title: 'Placar da IA',
              subtitle: 'A previsão de cada post contra o resultado real',
              config: {
                benchmarks: {
                  reel: {
                    compartilhamentos: [0.005, 0.015],
                    salvamentos: [0.003, 0.01],
                    retencao: [0.5, 0.7],
                  },
                  carrossel: {
                    compartilhamentos: [0.003, 0.01],
                    salvamentos: [0.005, 0.02],
                  },
                  post: {
                    compartilhamentos: [0.002, 0.007],
                    salvamentos: [0.002, 0.007],
                  },
                },
              },
              dataSource: {
                kind: 'query',
                view: 'v_conteudo_placar',
                select: [
                  'post_id',
                  'titulo',
                  'estado',
                  'formato',
                  'classe_prevista',
                  'confianca',
                  'prev_salvamentos_pct',
                  'prev_compartilhamentos_pct',
                  'prev_retencao_pct',
                  'fura_total',
                  'aposta_principal',
                  'resumo',
                  'modelo',
                  'registrada_em',
                  'publicado_em',
                  'alcance',
                  'curtidas',
                  'comentarios',
                  'compartilhamentos',
                  'salvamentos',
                  'visitas_perfil',
                  'seguidores',
                  'duracao_s',
                  'tempo_medio_s',
                  'permalink',
                ],
                orderBy: [
                  { field: 'publicado_em', dir: 'desc' },
                  { field: 'registrada_em', dir: 'desc' },
                ],
                limit: 200,
              },
            },
          },
          {
            id: 'estrategista',
            label: 'Estrategista',
            icon: 'Sparkles',
            view: {
              block: 'custom:conteudo-estrategista',
              title: 'Estrategista',
              subtitle: 'Qual estrutura de carrossel mais rende, pelos números reais',
              config: { meta: 'seguidores' },
              // Mesma view do Desempenho: precisa das métricas + a estrutura classificada.
              dataSource: {
                kind: 'query',
                view: 'v_conteudo_desempenho',
                select: [
                  'id',
                  'post_id',
                  'data',
                  'formato',
                  'tema',
                  'alcance',
                  'visualizacoes',
                  'curtidas',
                  'comentarios',
                  'compartilhamentos',
                  'salvamentos',
                  'visitas_perfil',
                  'seguidores',
                  'duracao_s',
                  'tempo_medio_s',
                  'permalink',
                  'estrutura',
                ],
                orderBy: [{ field: 'data', dir: 'desc' }],
                limit: 200,
              },
            },
          },
          // REFERÊNCIAS — os perfis do Instagram que inspiram o conteúdo. Vive
          // aqui dentro (e não como menu próprio) porque é insumo de conteúdo:
          // é de onde saem os rascunhos do Cronograma. Lê v_referencias_perfis
          // (allowlist), que une o autor de cada captura do Telegram com a
          // curadoria manual (`pnpm perfis:add`) — então um @ novo aparece
          // sozinho assim que mandar a primeira referência.
          {
            id: 'referencias',
            label: 'Referências',
            icon: 'Users',
            view: {
              block: 'custom:referencias-perfis',
              title: 'Referências',
              subtitle: 'Os perfis que inspiram o nosso conteúdo',
              config: { ordemInicial: 'refs' },
              dataSource: {
                kind: 'query',
                view: 'v_referencias_perfis',
                select: [
                  'handle',
                  'perfil_url',
                  'nome',
                  'nota',
                  'refs',
                  'carrosseis',
                  'reels',
                  'media_curtidas',
                  'media_comentarios',
                  'ultima_ref',
                  'ultima_url',
                ],
                orderBy: [
                  { field: 'refs', dir: 'desc' },
                  { field: 'handle', dir: 'asc' }, // desempate estável (mesma ordem a cada refresh)
                ],
                limit: 200,
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
