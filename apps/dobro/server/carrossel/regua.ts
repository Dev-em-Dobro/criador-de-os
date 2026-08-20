/**
 * apps/dobro — RÉGUA DO GANCHO: a nota que o card ganha no momento em que nasce.
 *
 * POR QUE EXISTE (19/08/2026): o dono cansou de receber gancho e capa que os
 * próprios números da conta já diziam que iam converter menos, e de ter que ser
 * ele a perguntar "isso não é ruim?". A régua tira isso da memória de quem está
 * escrevendo e põe no código: o card nasce com a nota e com a lista do que falta,
 * por extenso.
 *
 * NÃO USA IA e não depende de chave nenhuma. É aritmética sobre o título e o CTA,
 * então roda em qualquer lugar, de graça, em milissegundos.
 *
 * NÃO BLOQUEIA nada. Ela sinaliza. Quem decide publicar um card de nota baixa é o
 * dono, e às vezes tem razão: o maior post da conta (elevator-saga, 382
 * seguidores) tiraria nota média aqui.
 *
 * ── DE ONDE VÊM OS PESOS ──────────────────────────────────────────────────────
 * Todos medidos em 19/08/2026 sobre os 150 carrosséis com desempenho no banco
 * (`conteudo_desempenho` × `conteudo_posts`), comparando MEDIANAS:
 *
 *   nome próprio no título   50,5 salv/1k · 17,2 com/1k · 22 seguidores
 *     contra genérico (IA)   14,2 · 3,2 · 1
 *     contra sem âncora      12,3 · 4,5 · 0        ← a maior diferença medida
 *   CTA com 3 ou 4 entregas  22,4 a 27,0 com/1k  contra 12,9 com duas
 *   número no título         66,1 salv/1k  contra 43,9
 *   "de graça" no título     presente em 21% dos campeões contra 2% do resto
 *   comparação/superlativo   58,2 salv/1k e 27,7 com/1k  contra 47,5 e 14,7
 *   título até 45 caracteres presente em 8% dos campeões contra 1% do resto
 *
 * RESSALVA HONESTA, que precisa continuar escrita aqui: os posts com nome próprio
 * se concentram em agosto, a melhor fase da conta, então parte do ganho é fase e
 * não causa. O gap de 22 contra 0 seguidores é grande demais pra ser só isso, mas
 * a régua é uma bússola, não um oráculo.
 *
 * Quando entrar safra nova, recalibrar com `_tmp-tracos-limpo.ts` e
 * `_tmp-jargao-titulo.ts`, e ATUALIZAR os números deste cabeçalho junto.
 */

/**
 * Ferramentas com NOME PRÓPRIO que o público reconhece. É a lista que decide o
 * traço mais pesado da régua, então cresce conforme a conta cobre coisa nova.
 * Nome de categoria (IA, automação, sistema) NÃO entra aqui de propósito: na
 * medição, título genérico rendeu 1 seguidor mediano contra 22 do nome próprio.
 */
export const FERRAMENTAS = [
  'claude', 'chatgpt', 'gpt', 'gemini', 'copilot', 'cursor', 'windsurf', 'lovable',
  'replit', 'vercel', 'v0', 'supabase', 'notion', 'figma', 'canva', 'zapier',
  'n8n', 'make', 'whisper', 'github', 'gitlab', 'git', 'docker', 'linux',
  'mcp', 'skill', 'skills', 'jarvis', 'excalidraw', 'obsidian', 'airtable',
  'bitburner', 'python', 'javascript', 'typescript', 'react', 'next', 'node',
  'css', 'html', 'sql', 'notebooklm', 'perplexity', 'midjourney', 'sora',
  'elevenlabs', 'runway', 'hermes', 'graphify', 'ruflo', 'openai', 'anthropic',
  // Entraram em 19/08/2026, quando a régua deu falso negativo no carrossel do
  // Manus: o nome estava na capa e a lista não conhecia. Toda vez que isso
  // acontecer, a correção é esta linha, não baixar a régua.
  'manus', 'bolt', 'dify', 'flowise', 'langflow', 'crewai', 'gamma', 'framer',
  'webflow', 'wordpress', 'shopify', 'stripe', 'heygen', 'capcut', 'descript',
  'slack', 'discord', 'telegram', 'whatsapp', 'trello', 'clickup', 'linear',
  'hackerrank', 'linkedin', 'kiro', 'devin', 'grok', 'llama', 'mistral', 'ollama',
];

/** Termos de CATEGORIA. Não pontuam: servem só para o alerta de "genérico". */
const GENERICOS =
  /\b(ia|intelig[êe]ncia artificial|automa[çc][ãa]o|rob[ôo]|agente|sistema|software|aplicativo|app|ferramenta|tecnologia|programa[çc][ãa]o|c[óo]digo)\b/i;

const NUMERO = /(?:^|\s)(\d{1,3})(?:\s|\b)/;
const GRATIS = /\b(gr[áa]tis|de gra[çc]a|gratuito|gratuita|free|sem pagar|R\$\s*0\b)\b/i;
const COMPARACAO =
  // "o mais \w+" e "o melhor \w+" entraram em 19/08/2026: o gancho "o agente mais
  // hypado" é superlativo puro e a régua não via, porque a lista só tinha
  // comparação explícita ("melhor que"). Superlativo faz o mesmo trabalho, que é
  // colocar a coisa contra um universo.
  /\b(melhor que|pior que|mais forte|na frente de|[àa] frente de|em vez de|no lugar de|substitu\w*|99%|nível|nivel|parec\w+ ilegal|feito por|(?:o|a|os|as) (?:mais|melhor|maior|pior) \w+|(?:o|a|os|as) \w+ (?:mais|melhor|maior|pior) \w+|mais (?!de\b)(?:forte|r[áa]pido|f[áa]cil|barato|caro|hypado|usado|completo|poderoso|esperto)\b)\b/i;

/** Um sinal medido: presente ou ausente, com o número que o sustenta. */
export interface Traco {
  chave: string;
  nome: string;
  presente: boolean;
  peso: number;
  /** O dado da conta que justifica o peso. Vai junto na saída, sempre. */
  evidencia: string;
  /** O que fazer quando falta. Frase acionável, não conselho vago. */
  comoResolver: string;
}

/** Problema que não tira ponto, mas custa caro na prática. */
export interface Alerta {
  chave: string;
  texto: string;
}

export interface Veredito {
  nota: number;
  faixa: 'forte' | 'ok' | 'fraco';
  tracos: Traco[];
  faltando: Traco[];
  alertas: Alerta[];
}

/**
 * Conta quantas ENTREGAS distintas o CTA promete. Separa por vírgula e por " e ",
 * e só conta pedaço com substância (mais de 8 caracteres), pra "e" de ligação não
 * inflar a conta.
 */
export function contarEntregas(cta: string): number {
  const limpo = cta.replace(/\s+/g, ' ').trim();
  if (!limpo) return 0;
  // Corta o "Comenta X que eu te mando" da frente: o que interessa é o que vem
  // depois da promessa.
  const depois = limpo.replace(/^.*?\b(mando|envio|te mando|mando na dm)\b/i, '');
  const base = depois.length > 12 ? depois : limpo;
  return base.split(/,|\se\s/).filter((p) => p.trim().length > 8).length;
}

/** A palavra que a pessoa precisa digitar no comentário (ex.: "Comenta FLUXO"). */
export function palavraDoCta(cta: string): string | null {
  const m = cta.match(/comenta\s+["'“]?([A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9]{3,})/i);
  return m ? m[1] : null;
}

/** Avalia o gancho de um card. Puro: mesma entrada, mesma saída, sem rede. */
export function avaliarGancho(entrada: { titulo: string; ctaFinal?: string | null }): Veredito {
  const titulo = (entrada.titulo ?? '').replace(/\s+/g, ' ').trim();
  const cta = (entrada.ctaFinal ?? '').replace(/\s+/g, ' ').trim();
  const tituloBaixo = titulo.toLowerCase();

  const temNome = FERRAMENTAS.some((f) => new RegExp(`\\b${f}\\b`, 'i').test(tituloBaixo));
  const entregas = contarEntregas(cta);

  const tracos: Traco[] = [
    {
      chave: 'nomeProprio',
      nome: 'Ferramenta com nome próprio no título',
      presente: temNome,
      peso: 30,
      evidencia: 'mediana de 22 seguidores por post, contra 1 com termo genérico e 0 sem âncora',
      comoResolver: 'Ponha o nome da ferramenta na capa (Claude, n8n, MCP). "IA" e "automação" não contam: são categoria.',
    },
    {
      chave: 'ctaEntregas',
      nome: 'CTA com 3 ou mais entregas distintas',
      presente: entregas >= 3,
      peso: 20,
      evidencia: '22,4 a 27,0 comentários por mil, contra 12,9 quando o CTA promete duas coisas',
      comoResolver: 'Prometa três coisas diferentes: o material, o que fazer quando dá errado e o próximo passo.',
    },
    {
      chave: 'numero',
      nome: 'Número contável no título',
      presente: NUMERO.test(titulo),
      peso: 15,
      evidencia: '66,1 salvamentos por mil, contra 43,9 sem número',
      comoResolver: 'Prometa uma quantia fechada na capa: 5 pastas, 7 repos, 12 coisas.',
    },
    {
      chave: 'gratis',
      nome: '"De graça" ou "grátis" no título',
      presente: GRATIS.test(titulo),
      peso: 15,
      evidencia: 'aparece em 21% dos campeões e em 2% do resto',
      comoResolver: 'Se a coisa é gratuita, diga na capa. É a barreira derrubada, e é o traço de maior lift da conta.',
    },
    {
      chave: 'comparacao',
      nome: 'Comparação ou superlativo',
      presente: COMPARACAO.test(titulo),
      peso: 10,
      evidencia: '58,2 salv/1k e 27,7 com/1k, contra 47,5 e 14,7 sem comparação',
      comoResolver: 'Nomeie o inimigo caro: "melhor que curso pago", "substitui software pago", "à frente de 99%".',
    },
    {
      chave: 'tituloCurto',
      nome: 'Título de até 45 caracteres',
      presente: titulo.length > 0 && titulo.length <= 45,
      peso: 10,
      evidencia: 'aparece em 8% dos campeões e em 1% do resto',
      comoResolver: `Corte o título (está com ${titulo.length}). O que sobrar vira subtítulo.`,
    },
  ];

  const alertas: Alerta[] = [];

  const palavra = palavraDoCta(cta);
  if (palavra && /\d/.test(palavra)) {
    alertas.push({
      chave: 'palavraComNumero',
      texto: `A palavra do CTA ("${palavra}") mistura letra e número. Cada pessoa que digitar errado é um comentário que o robô não responde. Troque por uma palavra pronunciável.`,
    });
  }
  if (cta && !palavra) {
    alertas.push({
      chave: 'ctaSemPalavra',
      texto: 'O CTA não tem uma palavra em caixa alta pra pessoa comentar. Sem palavra não tem gatilho de DM.',
    });
  }
  if (!cta) {
    alertas.push({ chave: 'semCta', texto: 'O card não tem CTA. Post sem pedido não vira comentário nem lead.' });
  }
  const generico = titulo.match(GENERICOS);
  if (!temNome && generico) {
    // Cita o termo encontrado. A primeira versão dizia sempre "IA, automação,
    // sistema", e num título com "Lógica de Programação" isso confundia mais do
    // que ajudava: a pessoa procurava uma palavra que não estava lá.
    alertas.push({
      chave: 'ancoraGenerica',
      texto: `O título se ancora em "${generico[0]}", que é categoria, não nome próprio. Na medição, categoria rendeu 1 seguidor mediano, quase o mesmo que não ter âncora nenhuma (0).`,
    });
  }
  if (titulo.length > 60) {
    alertas.push({ chave: 'tituloLongo', texto: `Título com ${titulo.length} caracteres. Acima de 60 ele quebra em muitas linhas e come a arte da capa.` });
  }
  if (/—|–/.test(titulo) || /—|–/.test(cta)) {
    alertas.push({ chave: 'travessao', texto: 'Tem travessão no texto. A casa não usa travessão em conteúdo.' });
  }

  const nota = tracos.filter((t) => t.presente).reduce((s, t) => s + t.peso, 0);
  const faixa: Veredito['faixa'] = nota >= 60 ? 'forte' : nota >= 35 ? 'ok' : 'fraco';

  return { nota, faixa, tracos, faltando: tracos.filter((t) => !t.presente), alertas };
}

/** Formata o veredito pro terminal, com o que falta por extenso. */
export function formatarVeredito(v: Veredito, titulo: string): string {
  const selo = v.faixa === 'forte' ? '✅ FORTE' : v.faixa === 'ok' ? '🟡 OK' : '🔴 FRACO';
  const linhas: string[] = [];
  linhas.push(`\n── RÉGUA DO GANCHO ${'─'.repeat(46)}`);
  linhas.push(`  "${titulo}"`);
  linhas.push(`  ${selo}  ${v.nota}/100`);
  linhas.push('');
  for (const t of v.tracos) {
    linhas.push(`  ${t.presente ? '✓' : '✗'} ${String(t.peso).padStart(2)}pt  ${t.nome}`);
  }
  if (v.faltando.length) {
    linhas.push('\n  O QUE FALTA:');
    for (const t of v.faltando) {
      linhas.push(`  · ${t.comoResolver}`);
      linhas.push(`      (${t.evidencia})`);
    }
  }
  if (v.alertas.length) {
    linhas.push('\n  ATENÇÃO:');
    for (const a of v.alertas) linhas.push(`  ! ${a.texto}`);
  }
  linhas.push('─'.repeat(66));
  return linhas.join('\n');
}
