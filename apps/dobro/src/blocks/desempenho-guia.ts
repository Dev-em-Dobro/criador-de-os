/**
 * apps/dobro — GUIA de métricas de conteúdo (fonte única, sem dependências).
 *
 * Traduz o "Guia Prático — Métricas de conteúdo (Instagram + YouTube)" do time
 * numa estrutura de dados: fórmulas, faixas Fraco/Saudável/Forte por formato,
 * retenção por duração, classificação e nota metodológica. É REFERÊNCIA, não
 * config de cálculo — a classificação automática do dashboard segue vivendo em
 * `DEFAULT_BENCH` de `ConteudoDesempenho.tsx` (que usa exatamente estas faixas de
 * Instagram; por isso os números batem por construção).
 *
 * Dois consumidores:
 *   1) PESSOAS — o painel `ConteudoGuiaMetricas.tsx` renderiza tudo isto dentro
 *      do dashboard, pra criadora entender COMO ler cada número.
 *   2) IA (depois) — `guiaComoTextoParaIA()` achata o guia num bloco de texto
 *      pronto pra injetar no prompt da futura análise automática de desempenho.
 *      Este módulo é PURO (zero React / zero import de servidor) de propósito:
 *      pode ser importado tanto pela tela quanto por uma rota de IA no servidor.
 *
 * As faixas são heurísticas de mercado — não metas oficiais das plataformas.
 * O benchmark mais confiável é o histórico do próprio perfil (ver NOTA_METODOLOGICA).
 */

/** Faixa de uma taxa, em decimal: [saudavelMin, forteMin]. */
export type Faixa = readonly [saudavelMin: number, forteMin: number];

export interface MetricaFaixa {
  readonly chave: string;
  readonly label: string;
  /** [saudavelMin, forteMin]: abaixo de saudavelMin = Fraco; >= forteMin = Forte. */
  readonly faixa: Faixa;
  /** Guia lista só Saudável/Forte para esta métrica (sem faixa "Fraco" explícita). */
  readonly semFraco?: boolean;
  /** Só nos vídeos longos do YouTube: o que ajustar quando fica fraco. */
  readonly ajustar?: string;
}

export interface GrupoFaixas {
  readonly chave: string;
  readonly label: string;
  /** Base de cálculo das taxas do grupo (ex.: 'por alcance'). */
  readonly base: string;
  readonly metricas: readonly MetricaFaixa[];
}

export const GUIA_ATUALIZADO = 'julho de 2026';

// ── A lógica (as quatro etapas) ─────────────────────────────────────────────

/** Avalie todo conteúdo em quatro etapas, nesta ordem. */
export const ETAPAS: readonly string[] = [
  'chamou atenção',
  'reteve',
  'gerou valor e ação',
  'ajudou a audiência ou o negócio a avançar',
];

export const REGRA_PRINCIPAL =
  'No Instagram, calcule as taxas por contas alcançadas. No YouTube, use impressões para o CTR e visualizações — ou visualizações engajadas nos Shorts — para as demais taxas.';

// ── Fórmulas essenciais ─────────────────────────────────────────────────────

export const FORMULAS: readonly { readonly metrica: string; readonly formula: string }[] = [
  { metrica: 'Taxa de compartilhamento', formula: 'Compartilhamentos ÷ alcance × 100' },
  { metrica: 'Taxa de salvamento', formula: 'Salvamentos ÷ alcance × 100' },
  { metrica: 'Taxa de comentários', formula: 'Comentários ÷ alcance × 100' },
  {
    metrica: 'Engajamento por alcance',
    formula: '(Likes + comentários + salvamentos + compartilhamentos) ÷ alcance × 100',
  },
  { metrica: 'Retenção média', formula: 'Tempo médio assistido ÷ duração do vídeo × 100' },
  { metrica: 'CTR do YouTube', formula: 'Views vindas de impressões ÷ impressões × 100' },
];

// ── Leia as métricas em conjunto (o núcleo interpretativo) ───────────────────

export const LEIA_EM_CONJUNTO: readonly string[] = [
  'Pouco alcance + boa retenção: o conteúdo pode estar bom; revise tema, capa, título, gancho ou distribuição.',
  'Muito alcance + baixa retenção: a embalagem chamou atenção, mas o conteúdo não sustentou a promessa.',
  'Muitas curtidas + poucas ações profundas: conteúdo agradável, porém pouco útil, memorável ou mobilizador.',
  'Compartilhamentos, salvamentos, respostas e conversões normalmente valem mais do que curtidas isoladas.',
];

// ── Instagram — prioridades e faixas por formato ────────────────────────────

export const IG_PRIORIDADES: readonly {
  readonly formato: string;
  readonly p1: string;
  readonly p2: string;
  readonly p3: string;
  readonly apoio: string;
}[] = [
  { formato: 'Reels', p1: 'Retenção', p2: 'Compartilhamentos', p3: 'Seguidores', apoio: 'Salvamentos' },
  { formato: 'Carrossel', p1: 'Salvamentos', p2: 'Compartilhamentos', p3: 'Visitas ao perfil', apoio: 'Seguidores' },
  { formato: 'Post estático', p1: 'Comentários', p2: 'Compartilhamentos', p3: 'Conexão', apoio: 'Curtidas' },
  { formato: 'Stories', p1: 'Conclusão', p2: 'Respostas', p3: 'Cliques', apoio: 'Voltar/saídas' },
];

/** Faixas práticas por alcance — Reels, Carrossel e Post estático. */
export const IG_FAIXAS: readonly GrupoFaixas[] = [
  {
    chave: 'reel',
    label: 'Reels',
    base: 'por alcance',
    metricas: [
      { chave: 'curtidas', label: 'Curtidas', faixa: [0.02, 0.05] },
      { chave: 'comentarios', label: 'Comentários', faixa: [0.001, 0.003] },
      { chave: 'compartilhamentos', label: 'Compartilhamentos', faixa: [0.005, 0.015] },
      { chave: 'salvamentos', label: 'Salvamentos', faixa: [0.003, 0.01] },
      { chave: 'visitas_perfil', label: 'Visitas ao perfil', faixa: [0.005, 0.015] },
      { chave: 'seguidores', label: 'Seguidores gerados', faixa: [0.001, 0.005] },
    ],
  },
  {
    chave: 'carrossel',
    label: 'Carrossel',
    base: 'por alcance',
    metricas: [
      { chave: 'curtidas', label: 'Curtidas', faixa: [0.03, 0.07] },
      { chave: 'comentarios', label: 'Comentários', faixa: [0.001, 0.004] },
      { chave: 'compartilhamentos', label: 'Compartilhamentos', faixa: [0.003, 0.01] },
      { chave: 'salvamentos', label: 'Salvamentos', faixa: [0.005, 0.02] },
      { chave: 'visitas_perfil', label: 'Visitas ao perfil', faixa: [0.003, 0.01] },
      { chave: 'seguidores', label: 'Seguidores gerados', faixa: [0.0005, 0.003] },
    ],
  },
  {
    chave: 'post',
    label: 'Post estático',
    base: 'por alcance',
    metricas: [
      { chave: 'curtidas', label: 'Curtidas', faixa: [0.03, 0.06] },
      { chave: 'comentarios', label: 'Comentários', faixa: [0.001, 0.004] },
      { chave: 'compartilhamentos', label: 'Compartilhamentos', faixa: [0.002, 0.007] },
      { chave: 'salvamentos', label: 'Salvamentos', faixa: [0.002, 0.007] },
    ],
  },
];

/** Retenção de Reels — referência saudável por duração. */
export const REELS_RETENCAO: readonly { readonly duracao: string; readonly referencia: string }[] = [
  { duracao: 'Até 15 segundos', referencia: '70% ou mais' },
  { duracao: '15–30 segundos', referencia: '50%–70%' },
  { duracao: '30–60 segundos', referencia: '40%–60%' },
  { duracao: 'Acima de 60 segundos', referencia: 'Observe minutos, conclusão e compartilhamentos' },
];

/** Stories — sequência (métrica → o que ela responde). */
export const IG_STORIES: readonly { readonly metrica: string; readonly responde: string }[] = [
  { metrica: 'Alcance inicial', responde: 'O assunto e o momento conseguiram chamar atenção?' },
  { metrica: 'Conclusão', responde: 'Quantas pessoas chegaram ao último story?' },
  { metrica: 'Voltar', responde: 'Houve interesse, releitura ou necessidade de rever?' },
  { metrica: 'Avanços + saídas', responde: 'A pessoa entendeu rápido ou perdeu o interesse?' },
  { metrica: 'Respostas e cliques', responde: 'O conteúdo gerou conversa ou ação?' },
];

export const STORIES_CONCLUSAO =
  'Conclusão da sequência = alcance do último story ÷ alcance do primeiro × 100.';

// ── YouTube — vídeos longos e Shorts ────────────────────────────────────────

export const YT_FUNIL =
  'Impressões → CTR → retenção aos 30 segundos → minutos assistidos → percentual visualizado → próximo vídeo ou conversão.';

/** Vídeos longos — faixas + o que ajustar quando cada uma fica fraca. */
export const YT_LONGOS: readonly MetricaFaixa[] = [
  { chave: 'ctr', label: 'CTR', faixa: [0.02, 0.06], ajustar: 'Tema, título e thumbnail' },
  { chave: 'ret30', label: 'Retenção aos 30s', faixa: [0.5, 0.7], ajustar: 'Abertura e promessa' },
  { chave: 'pct_3_5', label: '% médio — 3–5 min', faixa: [0.35, 0.5], ajustar: 'Ritmo e estrutura' },
  { chave: 'pct_8_15', label: '% médio — 8–15 min', faixa: [0.3, 0.5], ajustar: 'Ritmo e entrega' },
  { chave: 'pct_20_40', label: '% médio — 20–40 min', faixa: [0.25, 0.45], ajustar: 'Minutos + profundidade' },
];

export const YT_LONGOS_NOTA =
  'O YouTube informa oficialmente que metade dos canais e vídeos apresenta CTR entre 2% e 10%. As demais divisões são faixas práticas e variam por duração, tema e origem do tráfego.';

/** Como ler a curva de retenção (sinal → leitura → ação). */
export const YT_CURVA_RETENCAO: readonly {
  readonly sinal: string;
  readonly leitura: string;
  readonly acao: string;
}[] = [
  { sinal: 'Queda imediata', leitura: 'Abertura longa ou promessa confusa', acao: 'Entrar mais rápido no assunto' },
  { sinal: 'Queda brusca', leitura: 'Trecho cansativo, repetido ou fora do tema', acao: 'Rever ritmo e edição' },
  { sinal: 'Pico', leitura: 'Trecho revisto, buscado ou compartilhado', acao: 'Reaproveitar a ideia' },
  { sinal: 'Linha estável', leitura: 'Trecho envolvente', acao: 'Repetir estrutura e ritmo' },
];

/** Shorts — "escolheram assistir" (em vez de deslizar). */
export const SHORTS_ESCOLHERAM: readonly { readonly faixa: string; readonly leitura: string }[] = [
  { faixa: 'Abaixo de 50%', leitura: 'Gancho fraco' },
  { faixa: '50%–60%', leitura: 'Razoável' },
  { faixa: '60%–70%', leitura: 'Bom' },
  { faixa: '70%–80%', leitura: 'Muito bom' },
  { faixa: 'Acima de 80%', leitura: 'Excelente' },
];

/** Shorts — percentual médio visualizado por duração (pode passar de 100% com replays). */
export const SHORTS_PCT_VISUALIZADO: readonly {
  readonly duracao: string;
  readonly saudavel: string;
  readonly forte: string;
}[] = [
  { duracao: 'Até 15 segundos', saudavel: '90%+', forte: '110%+' },
  { duracao: '15–30 segundos', saudavel: '80%+', forte: '100%+' },
  { duracao: '30–60 segundos', saudavel: '65%+', forte: '80%+' },
];

/** Shorts — interações por visualizações engajadas (guia lista só Saudável/Forte). */
export const SHORTS_INTERACOES: readonly MetricaFaixa[] = [
  { chave: 'curtidas', label: 'Curtidas', faixa: [0.03, 0.06], semFraco: true },
  { chave: 'comentarios', label: 'Comentários', faixa: [0.001, 0.004], semFraco: true },
  { chave: 'compartilhamentos', label: 'Compartilhamentos', faixa: [0.003, 0.01], semFraco: true },
  { chave: 'inscritos', label: 'Inscritos', faixa: [0.002, 0.01], semFraco: true },
];

export const SHORTS_NOTA =
  'Views brutas de Shorts podem incluir inícios e repetições. Para diagnosticar qualidade, priorize visualizações engajadas, "escolheram assistir", retenção e inscritos gerados.';

// ── Painel semanal e classificação ──────────────────────────────────────────

export const PAINEL_SEMANAL: readonly {
  readonly canal: string;
  readonly metricas: string;
  readonly pergunta: string;
}[] = [
  { canal: 'Instagram Reels', metricas: 'Retenção • compartilhamentos • seguidores', pergunta: 'O vídeo prende e faz a ideia circular?' },
  { canal: 'Carrossel', metricas: 'Salvamentos • compartilhamentos • perfil', pergunta: 'O conteúdo é útil e gera interesse na fonte?' },
  { canal: 'Stories', metricas: 'Conclusão • respostas • cliques', pergunta: 'A audiência acompanha, conversa e age?' },
  { canal: 'YouTube longo', metricas: 'CTR • 30s • minutos/% assistido', pergunta: 'A embalagem atrai e o vídeo entrega?' },
  { canal: 'YouTube Shorts', metricas: 'Escolheram assistir • retenção • inscritos', pergunta: 'O gancho para o scroll e cria afinidade?' },
];

/** Classificação simples de um conteúdo (status → critério → decisão). */
export const CLASSIFICACAO: readonly {
  readonly status: string;
  readonly criterio: string;
  readonly decisao: string;
}[] = [
  { status: 'Vencedor', criterio: 'Supera a mediana em 2+ métricas prioritárias', decisao: 'Replicar tema, estrutura ou gancho' },
  { status: 'Promissor', criterio: 'Boa retenção, mas baixa distribuição', decisao: 'Melhorar capa, título, abertura ou distribuição' },
  { status: 'Atrativo, mas fraco', criterio: 'Bom alcance/CTR e baixa retenção', decisao: 'Alinhar promessa e entrega' },
  { status: 'Agradável', criterio: 'Curtidas boas, poucas ações profundas', decisao: 'Adicionar utilidade, opinião ou CTA' },
  { status: 'Fraco', criterio: 'Abaixo da mediana em atenção e ação', decisao: 'Reformular antes de repetir' },
];

// ── Nota metodológica / calibração ──────────────────────────────────────────

export const NOTA_METODOLOGICA: readonly string[] = [
  'As faixas percentuais são heurísticas de mercado — não metas oficiais das plataformas.',
  'Compare cada conteúdo com a mediana dos últimos 10 a 20 conteúdos do mesmo formato e duração. O histórico do próprio perfil é o benchmark mais confiável.',
  'Depois de ~20 conteúdos, recalcule a mediana por formato: "saudável" é a faixa próxima à mediana; "forte" é o que fica claramente acima.',
  'Separe conteúdo por objetivo (alcance, relacionamento, autoridade, conversão) — objetivos diferentes exigem métricas diferentes.',
  'Pergunta final de todo número: que decisão ele permite tomar? Se não muda tema, formato, gancho, ritmo, CTA ou distribuição, não precisa estar no painel principal.',
];

export const FONTES: readonly string[] = [
  'Meta/Instagram Help Center — Insights do Instagram e métricas de Reels.',
  'YouTube Help — CTR e impressões; retenção de audiência; alcance, views e watch time; Analytics de Shorts.',
  'Socialinsider — Instagram Engagement Report 2026 (~15 mi de posts / 417 mil páginas, out/2025–mar/2026) e Organic Engagement Benchmarks 2026.',
  'Rival IQ — Instagram Engagement Benchmark 2025.',
  'vidIQ — referência de retenção de audiência no YouTube (2026).',
];

// ── Formatação + texto para a IA ────────────────────────────────────────────

/** Decimal (0,015) → percentual pt-BR ("1,5%"). Compartilhado entre tela e IA. */
export function faixaPct(n: number): string {
  return `${(n * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

/** "< 0,5% (fraco) · 0,5%–1,5% (saudável) · > 1,5% (forte)". */
function faixaTexto(m: MetricaFaixa): string {
  const [s, f] = m.faixa;
  const saud = `${faixaPct(s)}–${faixaPct(f)} (saudável)`;
  const forte = `> ${faixaPct(f)} (forte)`;
  if (m.semFraco) return `${saud} · ${forte}`;
  return `< ${faixaPct(s)} (fraco) · ${saud} · ${forte}`;
}

/**
 * Achata o guia inteiro num bloco de texto pronto pra injetar no prompt da IA
 * que fará a análise de desempenho. Deriva das MESMAS constantes acima — nunca
 * diverge da tela. Estável e determinístico (sem datas/aleatório).
 */
export function guiaComoTextoParaIA(): string {
  const L: string[] = [];
  L.push('# Guia de métricas de conteúdo (Instagram + YouTube)');
  L.push(
    'Faixas são heurísticas de mercado, NÃO metas oficiais. O benchmark mais confiável é a mediana dos últimos 10–20 conteúdos do MESMO formato e duração do próprio perfil.',
  );

  L.push('\n## Como avaliar (4 etapas)');
  L.push(ETAPAS.map((e, i) => `${i + 1}) ${e}`).join('; ') + '.');
  L.push(`Regra de base: ${REGRA_PRINCIPAL}`);

  L.push('\n## Fórmulas');
  for (const f of FORMULAS) L.push(`- ${f.metrica} = ${f.formula}`);

  L.push('\n## Leia as métricas em conjunto');
  for (const s of LEIA_EM_CONJUNTO) L.push(`- ${s}`);

  L.push('\n## Instagram — prioridades por formato');
  for (const p of IG_PRIORIDADES) {
    L.push(`- ${p.formato}: 1º ${p.p1}, 2º ${p.p2}, 3º ${p.p3} (apoio: ${p.apoio}).`);
  }

  L.push('\n## Instagram — faixas por alcance');
  for (const g of IG_FAIXAS) {
    L.push(`### ${g.label} (${g.base})`);
    for (const m of g.metricas) L.push(`- ${m.label}: ${faixaTexto(m)}`);
  }
  L.push('### Reels — retenção saudável por duração');
  for (const r of REELS_RETENCAO) L.push(`- ${r.duracao}: ${r.referencia}`);
  L.push('### Stories (sequência)');
  for (const s of IG_STORIES) L.push(`- ${s.metrica}: ${s.responde}`);
  L.push(`- ${STORIES_CONCLUSAO}`);

  L.push('\n## YouTube — vídeos longos');
  L.push(`Funil de diagnóstico: ${YT_FUNIL}`);
  for (const m of YT_LONGOS) {
    L.push(`- ${m.label}: ${faixaTexto(m)}${m.ajustar ? ` — ajustar: ${m.ajustar}` : ''}`);
  }
  L.push(YT_LONGOS_NOTA);
  L.push('### Curva de retenção');
  for (const c of YT_CURVA_RETENCAO) L.push(`- ${c.sinal}: ${c.leitura} → ${c.acao}.`);

  L.push('\n## YouTube — Shorts');
  L.push('"Escolheram assistir": ' + SHORTS_ESCOLHERAM.map((s) => `${s.faixa} = ${s.leitura}`).join('; ') + '.');
  L.push('% médio visualizado por duração: ' + SHORTS_PCT_VISUALIZADO.map((s) => `${s.duracao} ${s.saudavel} saudável / ${s.forte} forte`).join('; ') + '.');
  L.push('Interações por visualizações engajadas:');
  for (const m of SHORTS_INTERACOES) L.push(`- ${m.label}: ${faixaTexto(m)}`);
  L.push(SHORTS_NOTA);

  L.push('\n## Classificação do conteúdo');
  for (const c of CLASSIFICACAO) L.push(`- ${c.status}: ${c.criterio} → ${c.decisao}.`);

  L.push('\n## Nota metodológica');
  for (const n of NOTA_METODOLOGICA) L.push(`- ${n}`);

  return L.join('\n');
}
