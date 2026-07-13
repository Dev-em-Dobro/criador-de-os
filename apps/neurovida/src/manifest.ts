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
          subtitle: 'Suba os PDFs — a IA categoriza e soma; marque o que cortar e veja quanto sobra',
          config: {},
          help: {
            description:
              'Suba o PDF da fatura do seu cartão (pode subir várias): a IA lê os lançamentos, categoriza cada um e soma tudo. Marque as assinaturas/ferramentas que quer cortar e veja quanto a conta fica — e quanto economiza no ano.',
            tutorial: {
              title: 'Como analisar suas faturas',
              steps: [
                'Baixe a fatura do cartão em PDF (no app ou site do banco — geralmente em "Faturas" → "Baixar PDF").',
                'Configure a sua chave de API em Configurações (a leitura do PDF por IA usa a sua conta).',
                'Clique em "Subir PDF(s) da fatura" e selecione um ou vários PDFs. A leitura leva alguns segundos por fatura.',
                'Veja o resumo: total somado de todas as faturas, quanto é recorrente, e os custos por categoria.',
                'Nas faturas, expanda para ver os itens. Marque a caixa "cortar" nas assinaturas que não valem a pena — o topo recalcula o total e a economia anual.',
                'Se a categorização de algum item não ficou boa, você pode remover a fatura (✕) e subir de novo, ou ajustar depois.',
              ],
            },
          },
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
          config: {
            // Régua de ICP CONFIG-DRIVEN (do negócio, não chumbada no código). A
            // máquina (parse/dedup/merge/tiers) é genérica; estes pesos definem o
            // cliente ideal da NEUROVIDA (saúde/suplementos). AJUSTE os nomes dos
            // campos para casar as colunas do SEU CSV de pesquisa e os pesos.
            // `field` casa a coluna por "contém" (tolera cabeçalhos longos).
            scoring: {
              rules: [
                {
                  field: 'idade',
                  label: 'Faixa etária',
                  match: [
                    { contains: '35 a 44', points: 12 },
                    { contains: '45 a 54', points: 12 },
                    { contains: '25 a 34', points: 9 },
                    { contains: '55', points: 8 },
                    { contains: '18 a 24', points: 5 },
                  ],
                  default: 3,
                },
                {
                  field: 'suplemento',
                  label: 'Já usa suplementos',
                  match: [
                    { contains: 'uso diar', points: 20 },
                    { contains: 'sim', points: 15 },
                    { contains: 'já usei', points: 8 },
                  ],
                  default: 0,
                },
                {
                  field: 'renda',
                  label: 'Renda mensal',
                  match: [
                    { contains: 'acima', points: 15 },
                    { contains: '5.001', points: 13 },
                    { contains: '2.501', points: 9 },
                    { contains: '1.501', points: 5 },
                  ],
                  default: 2,
                },
                {
                  field: 'objetivo',
                  label: 'Objetivo de saúde',
                  match: [
                    { contains: 'imunidade', points: 10 },
                    { contains: 'energia', points: 10 },
                    { contains: 'sono', points: 9 },
                    { contains: 'memória', points: 9 },
                    { contains: 'estética', points: 6 },
                  ],
                  default: 4,
                },
                {
                  field: 'recomend',
                  label: 'Recomendação médica',
                  match: [{ contains: 'sim', points: 12 }],
                  default: 0,
                },
                {
                  field: 'cartão',
                  label: 'Tem cartão de crédito',
                  match: [{ contains: 'sim', points: 8 }],
                  default: 2,
                },
              ],
              tiers: [
                { tier: 'S', min: 60 },
                { tier: 'A', min: 40 },
                { tier: 'B', min: 20 },
                { tier: 'C', min: 0 },
              ],
              maxScore: 100,
            },
          },
          help: {
            description:
              'Junte seus contatos de várias origens num só lugar: suba o CSV de cada fonte, o sistema deduplica (mesma pessoa por email OU telefone) e pontua o interesse (ICP) para você agir por segmento.',
            tutorial: {
              title: 'Como cadastrar e analisar seus leads',
              steps: [
                'Exporte um CSV de cada fonte que você usa (ActiveCampaign, Clint, Curseduca, ManyChat, Unnichat) e da sua pesquisa de perfil. Não precisa formatar: o sistema detecta as colunas de email/telefone/nome sozinho.',
                'Em "Fontes de dados", clique em "Subir CSV" na fonte correspondente. Reenviar um CSV substitui os dados daquela fonte.',
                'Clique em "1. Consolidar": o sistema une os contatos e mostra quantos leads únicos existem (quantos duplicados foram fundidos).',
                'Clique em "2. Pontuar": aplica a régua de ICP (configurável) usando as respostas da pesquisa e classifica cada lead em tiers S/A/B/C.',
                'Use os cartões de "Segmentos de ação" para filtrar (ex.: ICP Alto = ofereça direto; Sem Perfil = peça para responder a pesquisa).',
                'A pontuação vem da pesquisa: leads sem pesquisa respondida caem em "Sem Perfil". Quanto mais gente responder, mais preciso fica o score.',
              ],
            },
          },
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

      // 6) CONFIGURAÇÕES — chaves/integrações do cliente (modelo BYOK). A chave da
      //    API fica cifrada no Neon e alimenta o Estúdio IA (e futuras ações de IA).
      {
        key: 'configuracoes',
        label: 'Configurações',
        icon: 'Settings',
        route: '/configuracoes',
        view: {
          block: 'custom:settings',
          title: 'Configurações',
          subtitle: 'Suas chaves e integrações — você usa a sua própria conta (BYOK)',
          config: {},
          help: {
            description:
              'Aqui você conecta a sua própria conta (modelo BYOK): cole a chave de API do Claude para liberar as ações de IA (como o Estúdio de conteúdo). A chave fica cifrada e nunca é exibida de volta.',
            tutorial: {
              title: 'Como configurar sua chave de API',
              steps: [
                'Acesse console.anthropic.com e faça login (ou crie uma conta).',
                'No menu, vá em "API Keys" → "Create Key". Dê um nome (ex.: Neurovida OS).',
                'Copie a chave gerada — ela começa com "sk-ant-". Guarde: ela só aparece uma vez.',
                'Volte aqui, cole a chave no campo e clique em Salvar. O Estúdio IA passa a usar a sua conta.',
                'Cada uso consome créditos da SUA conta Anthropic. Você pode trocar ou remover a chave quando quiser.',
              ],
            },
          },
        },
      },
    ],
  },

  settings: {
    // Auth OBRIGATÓRIA (Better Auth): o cliente loga antes de operar o OS. Necessária
    // para proteger as configurações BYOK (a chave de API cifrada é por cliente).
    auth: { enabled: true, provider: 'better-auth' },
    period: { enabled: true, default: 'monthly', options: ['weekly', 'monthly', 'quarterly'] },
    footerText: 'Neurovida · por Dev em Dobro',
  },
};
