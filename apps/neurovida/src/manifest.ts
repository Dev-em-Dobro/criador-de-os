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
    // TESTE — paleta da cliente (petróleo/teal do design system Liranê Suliano),
    // aplicada globalmente via ThemeProvider (:root). Pinta todo o acento do OS.
    theme: {
      brand: '#003349',        // teal — acento base
      brandBright: '#0f4d63',  // teal vivo — hover/ícones
      brandSoft: '#7fa6b3',    // teal claro dessaturado
      brandStrong: '#0b2432',  // petróleo — CTA sólido (texto branco AA)
      brandDeep: '#071820',    // petróleo profundo
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
        // Copiloto flutuante desta seção (FAB estilo WhatsApp). Config-driven: a
        // persona/prompt vive no backend (@os/server → makeFinanceAssistant, montado
        // com contextKey 'financas'); aqui só o que pode ir ao browser.
        assistant: {
          contextKey: 'financas',
          title: 'Analista financeiro',
          subtitle: 'Lê suas faturas e sugere onde cortar',
          icon: 'Sparkles',
          starters: [
            'O que dá pra cortar sem doer?',
            'Qual categoria pesa mais?',
            'Minha estrutura de custos está saudável?',
          ],
          inputs: [
            {
              key: 'receitaMensal',
              label: 'Seu faturamento mensal',
              placeholder: 'ex.: 15.000',
              source: 'vem do Faturamento (Hotmart) se conectada; senão, informe aqui.',
            },
            { key: 'saldoInicial', label: 'Saldo de caixa hoje', placeholder: 'ex.: 20.000' },
            { key: 'custosForaCartao', label: 'Custos fixos fora do cartão', placeholder: 'ex.: 8.000', hint: '/mês' },
          ],
        },
        // Grupo com abas: a fatura do cartão (despesas) + o painel do dono (resultado).
        tabs: [
          {
            id: 'fatura',
            label: 'Fatura do cartão',
            icon: 'CreditCard',
            view: {
              block: 'invoice-console',
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
          {
            id: 'resultado',
            label: 'Resultado & Caixa',
            icon: 'TrendingUp',
            view: {
              block: 'finance-overview',
              title: 'Resultado & Caixa',
              subtitle: 'Lucro, margem e projeção de caixa — cruzando a sua receita com os custos',
              config: {},
              help: {
                description:
                  'A visão de dono: cruza a sua receita (do Faturamento/Hotmart) com as despesas (fatura do cartão + os custos fixos que você informar) e projeta o seu caixa para 3, 6 e 12 meses.',
                tutorial: {
                  title: 'Como ler o Resultado & Caixa',
                  steps: [
                    'Informe suas premissas: o saldo de caixa que você tem hoje e os custos fixos que NÃO passam no cartão (pró-labore, aluguel, impostos).',
                    'A receita vem automática do Faturamento (Hotmart) se você já conectou; senão, informe a receita mensal à mão.',
                    'Veja o lucro/mês, a margem e o ponto de equilíbrio (a receita mínima pra empatar as contas).',
                    'Na curva de caixa, acompanhe a projeção para 3, 6 e 12 meses — e o alerta de quando o caixa aperta.',
                    'Para uma leitura com contexto e conselhos, chame o Analista Financeiro no balão ou no menu Agentes.',
                  ],
                },
              },
            },
          },
        ],
      },

      // 2) FATURAMENTO — receita da Hotmart (SÓ agregados). Consome o resumo de
      //    vendas via credenciais BYOK do cliente; guarda só números (sem PII).
      {
        key: 'faturamento',
        label: 'Faturamento',
        icon: 'DollarSign',
        route: '/faturamento',
        view: {
          block: 'hotmart-console',
          title: 'Faturamento (Hotmart)',
          subtitle: 'Suas vendas mês a mês — puxadas direto da sua conta Hotmart',
          config: {},
          help: {
            description:
              'Conecte a sua conta Hotmart (em Configurações) e o OS traz o seu faturamento mês a mês. Trazemos apenas os TOTAIS de vendas — nenhum dado dos seus compradores é lido ou guardado. Transparência: como operamos a infraestrutura, a equipe do Dev em Dobro tem capacidade técnica de acessar esses números; comprometemo-nos a não fazê-lo fora de suporte solicitado por você.',
            tutorial: {
              title: 'Como conectar a sua Hotmart',
              steps: [
                'Acesse a sua conta Hotmart e vá em "Ferramentas" → "Credenciais" (área de Desenvolvedores).',
                'Crie/abra uma credencial e copie o "Client ID" e o "Client Secret".',
                'Aqui no OS, vá em Configurações e cole os dois campos da Hotmart (ficam cifrados; nunca aparecem de volta).',
                'Volte a esta tela e clique em "Atualizar da Hotmart": o sistema busca o resumo dos últimos 12 meses.',
                'Veja o faturamento por mês e os totais. Clique em "Atualizar" sempre que quiser trazer os dados mais recentes.',
              ],
            },
          },
        },
      },

      // 3) CLUBE — Membros (comparativo) + Acessos (unificação das 3 plataformas).
      {
        key: 'clube',
        label: 'Clube',
        icon: 'Heart',
        route: '/clube',
        hidden: true, // oculto temporariamente — foco em Financeiro/Leads/Simulador
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
          block: 'lead-console',
          title: 'Análise de Leads quentes',
          subtitle: 'Temperatura da base, segmentos de ação e leads pontuados',
          config: {
            // Régua de ICP CONFIG-DRIVEN (do negócio, não chumbada no código). A
            // máquina (parse/dedup/merge/tiers) é genérica; estes pesos definem o
            // cliente ideal da NEUROVIDA (saúde/suplementos). Os `field` casam a
            // coluna do CSV por "contém" — por isso batem com as PERGUNTAS do
            // `surveyTemplate` abaixo (baixe o modelo → colete → suba de volta).
            scoring: {
              rules: [
                {
                  field: 'etária',
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
                  field: 'suplementos',
                  label: 'Já usa suplementos',
                  match: [
                    { contains: 'diariamente', points: 20 },
                    { contains: 'vez em quando', points: 12 },
                    { contains: 'parei', points: 8 },
                  ],
                  default: 0,
                },
                {
                  field: 'renda',
                  label: 'Renda mensal familiar',
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
                    { contains: 'energia', points: 10 },
                    { contains: 'imunidade', points: 10 },
                    { contains: 'dormir', points: 9 },
                    { contains: 'memória', points: 9 },
                    { contains: 'estética', points: 6 },
                  ],
                  default: 4,
                },
                {
                  field: 'recomendou',
                  label: 'Recomendação profissional',
                  match: [{ contains: 'sim', points: 12 }],
                  default: 0,
                },
                {
                  field: 'internet',
                  label: 'Compra online de saúde',
                  match: [
                    { contains: 'frequência', points: 10 },
                    { contains: 'algumas vezes', points: 6 },
                  ],
                  default: 0,
                },
                {
                  field: 'rapidez',
                  label: 'Urgência de compra',
                  match: [
                    { contains: 'agora', points: 13 },
                    { contains: '30 dias', points: 8 },
                  ],
                  default: 0,
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
            // Modelo da pesquisa de perfil (ICP). O bloco gera um CSV para baixar
            // (identificação + perguntas) e mostra as opções na tela; ao subir o CSV
            // preenchido na fonte "Pesquisa de perfil", fica guardado no Neon e
            // alimenta a Pontuação. As colunas casam com os `field` do scoring acima.
            surveyTemplate: {
              sourceId: 'pesquisa',
              filename: 'pesquisa-perfil-neurovida.csv',
              identity: ['Nome', 'E-mail', 'WhatsApp'],
              questions: [
                {
                  column: 'Faixa etária',
                  options: ['18 a 24 anos', '25 a 34 anos', '35 a 44 anos', '45 a 54 anos', '55 anos ou mais'],
                },
                {
                  column: 'Você já usa suplementos alimentares?',
                  options: ['Uso diariamente', 'Uso de vez em quando', 'Já usei, mas parei', 'Nunca usei'],
                },
                {
                  column: 'Renda mensal familiar',
                  options: ['Até R$ 1.500', 'R$ 1.501 a R$ 2.500', 'R$ 2.501 a R$ 5.000', 'R$ 5.001 a R$ 10.000', 'Acima de R$ 10.000'],
                },
                {
                  column: 'Qual seu principal objetivo com a saúde hoje?',
                  options: ['Mais energia e disposição', 'Fortalecer a imunidade', 'Dormir melhor', 'Memória e foco', 'Estética e bem-estar'],
                },
                {
                  column: 'Algum profissional já recomendou suplementação para você?',
                  options: ['Sim, tenho recomendação', 'Não, seria por conta própria'],
                },
                {
                  column: 'Você já comprou produtos de saúde pela internet?',
                  options: ['Compro com frequência', 'Já comprei algumas vezes', 'Nunca comprei'],
                },
                {
                  column: 'Com que rapidez pretende cuidar disso?',
                  options: ['Quero começar agora', 'Nos próximos 30 dias', 'Só estou pesquisando'],
                },
              ],
              samples: [
                ['Ana Exemplo — apague esta linha', 'ana@exemplo.com', '(11) 98888-0001', '35 a 44 anos', 'Uso diariamente', 'Acima de R$ 10.000', 'Mais energia e disposição', 'Sim, tenho recomendação', 'Compro com frequência', 'Quero começar agora'],
                ['Bruno Exemplo — apague esta linha', 'bruno@exemplo.com', '(11) 98888-0002', '25 a 34 anos', 'Uso de vez em quando', 'R$ 2.501 a R$ 5.000', 'Dormir melhor', 'Não, seria por conta própria', 'Já comprei algumas vezes', 'Nos próximos 30 dias'],
              ],
            },
          },
          help: {
            description:
              'Junte seus contatos de várias origens num só lugar: suba o CSV de cada fonte, o sistema deduplica (mesma pessoa por email OU telefone) e pontua o interesse (ICP) para você agir por segmento.',
            tutorial: {
              title: 'Como cadastrar e analisar seus leads',
              steps: [
                'Exporte um CSV de cada fonte que você usa (ActiveCampaign, Clint, Hotmart, ManyChat) e da sua pesquisa de perfil. Não precisa formatar: o sistema detecta as colunas de email/telefone/nome sozinho.',
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
        hidden: true, // oculto temporariamente — foco em Financeiro/Leads/Simulador
        view: {
          block: 'custom:carousel-generator',
          title: 'Estúdio de conteúdo',
          subtitle: 'Gera um carrossel embasado em evidência real (Claude + busca científica)',
          config: {},
        },
      },

      // 6) AGENTES — hub da equipe de IA. Cada card é um AssistantProvider (mesmo
      //    contextKey do copiloto flutuante); clicar abre o relatório do agente
      //    (a análise resumo/seções/ações + chat). Config-driven pela lista abaixo.
      {
        key: 'agentes',
        label: 'Agentes',
        icon: 'Users',
        route: '/agentes',
        view: {
          block: 'agent-gallery',
          title: 'Agentes',
          subtitle: 'Sua equipe de especialistas de IA — clique num card para ver o relatório dele.',
          config: {
            agents: [
              {
                contextKey: 'financas',
                name: 'Analista Financeiro',
                icon: '📊',
                status: 'ready',
                expertise: 'Lê suas faturas do cartão, aponta onde cortar e lê a saúde da sua estrutura de custos.',
                teaser: 'Fatura do cartão',
                inputs: [
                  { key: 'receitaMensal', label: 'Seu faturamento mensal', placeholder: 'ex.: 15.000', source: 'vem do Faturamento (Hotmart) se conectada; senão, informe aqui.' },
                  { key: 'saldoInicial', label: 'Saldo de caixa hoje', placeholder: 'ex.: 20.000' },
                  { key: 'custosForaCartao', label: 'Custos fixos fora do cartão', placeholder: 'ex.: 8.000', hint: '/mês' },
                ],
              },
              {
                contextKey: 'leads',
                name: 'Analista de Leads',
                icon: '🎯',
                status: 'ready',
                expertise: 'Avalia sua base de leads, classifica por interesse (ICP) e diz em quem focar agora.',
              },
              {
                contextKey: 'conteudo',
                name: 'Estrategista de Conteúdo',
                icon: '✦',
                status: 'ready',
                expertise: 'Sugere temas de post embasados em evidência científica e monta o roteiro pra você.',
              },
              {
                contextKey: 'faturamento',
                name: 'Consultor de Faturamento',
                icon: '📈',
                status: 'soon',
                expertise: 'Acompanha suas vendas na Hotmart mês a mês e aponta tendências e sazonalidade.',
                teaser: 'Conecte a Hotmart',
              },
              {
                contextKey: 'simulador',
                name: 'Analista de Lançamentos',
                icon: '🚀',
                status: 'ready',
                expertise: 'Roda o simulador com as suas premissas e recomenda quanto investir pra crescer.',
                inputs: [
                  { key: 'metaFaturamento', label: 'Meta de faturamento (R$)', placeholder: 'ex.: 100.000' },
                  { key: 'custoFixoMensal', label: 'Custo fixo mensal (R$)', placeholder: 'ex.: 15.000' },
                  { key: 'roas', label: 'ROAS esperado', placeholder: 'ex.: 3', hint: 'retorno por real de anúncio' },
                ],
              },
            ],
          },
          help: {
            description:
              'Cada agente é um especialista de IA numa frente do seu negócio. Clique num card para ver o relatório dele e conversar. Os marcados "em breve" ainda estão sendo preparados.',
          },
        },
      },

      // 7) CONFIGURAÇÕES — chaves/integrações do cliente (modelo BYOK). A chave da
      //    API fica cifrada no Neon e alimenta o Estúdio IA (e futuras ações de IA).
      {
        key: 'configuracoes',
        label: 'Configurações',
        icon: 'Settings',
        route: '/configuracoes',
        view: {
          block: 'settings-panel',
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
      // 7) PRIVACIDADE & TERMOS — aviso interno (reusa doc-viewer; sem bloco novo).
      //    Config-driven: primitivo da fábrica — todo OS de cliente pode ter o seu,
      //    só trocando o texto. Não substitui o contrato/DPA (docs/legal/) nem a
      //    política de privacidade PÚBLICA do cliente (que vive nos canais dele).
      {
        key: 'privacidade',
        label: 'Privacidade',
        icon: 'ShieldCheck',
        route: '/privacidade',
        view: {
          block: 'doc-viewer',
          title: 'Privacidade & Termos',
          subtitle: 'Como seus dados são tratados neste sistema',
          config: {
            heading: 'Privacidade & Termos de Uso — Neurovida OS',
            markdown: [
              '_Última atualização: 14/07/2026._',
              '',
              'Este é um **sistema interno de gestão** feito sob medida para a Neurovida e operado em parceria com a **Dev em Dobro**. Não é um serviço público: o acesso é restrito à sua equipe, mediante login.',
              '',
              '## Onde ficam os seus dados',
              'Os dados deste OS ficam em um **banco de dados dedicado à Neurovida** (isolado de qualquer outro cliente). O tráfego é criptografado (HTTPS) e o acesso à aplicação exige autenticação.',
              '',
              '## O que o sistema trata',
              '- **Financeiro:** as faturas de cartão que você sobe (lidas por IA para categorizar).',
              '- **Faturamento (Hotmart):** apenas os **totais** de vendas por período — **nenhum dado dos seus compradores** (nome, e-mail, CPF) é lido ou guardado.',
              '- **Leads:** os contatos que você importa (nome, e-mail, telefone) e as respostas de pesquisa, para consolidar e pontuar.',
              '- **Suas chaves de integração** (ex.: API do Claude, credenciais Hotmart): ficam **criptografadas** e nunca são exibidas de volta.',
              '',
              '## Transparência sobre acesso',
              'Como a Dev em Dobro opera a infraestrutura do sistema, a equipe técnica **tem capacidade de acessar** esses dados. Comprometemo-nos a **só acessá-los** para operar, corrigir falhas ou atender suporte solicitado por você — nunca para outros fins. Se você preferir garantias adicionais (por exemplo, o banco na sua própria conta, ou cifragem com chave só sua), fale com a gente.',
              '',
              '## Dados de terceiros (seus leads)',
              'Os contatos que você importa são de **outras pessoas**. A responsabilidade por ter permissão para usá-los, e por manter uma **Política de Privacidade pública** informando isso a eles, é da Neurovida (a Dev em Dobro ajuda com o modelo). Este aviso interno não substitui essa política.',
              '',
              '## Contato',
              'Dúvidas sobre privacidade ou sobre este sistema: **contato@devemdobro.com** _(ajuste o e-mail)_.',
            ].join('\n'),
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
