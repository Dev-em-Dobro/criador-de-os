/**
 * apps/dobro — classifica a ESTRUTURA NARRATIVA dos carrosséis medidos, via IA
 * (offline, uma vez). Popula `conteudo_desempenho.estrutura` para os posts de
 * formato 'carrossel' que ainda não têm estrutura. Idempotente e reutilizável:
 * rode de novo quando entrarem carrosséis novos (só classifica os pendentes).
 *
 * A tela Estrategista (v2) NÃO chama IA em runtime — ela só agrega esta coluna.
 * Toda a inteligência de classificação vive aqui, roda uma vez, e fica no banco.
 *
 * Uso: pnpm --filter @app/dobro conteudo:classificar
 */
import Anthropic from '@anthropic-ai/sdk';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoDesempenho } from '../../db/schema';
import { getAgencyAnthropicKey } from '../env';

export const ESTRUTURAS = [
  'listicle', 'tutorial', 'contrarian', 'storytelling',
  'noticia', 'pergunta', 'venda', 'conceito', 'ferramenta',
] as const;
export type Estrutura = (typeof ESTRUTURAS)[number];

const DEFINICOES = [
  '- listicle: lista numerada de itens ("5 ferramentas", "7 erros", "3 sinais de...").',
  '- tutorial: passo a passo de COMO fazer/configurar algo.',
  '- contrarian: quebra um mito ou senso comum ("não é X", "pare de", "o problema não é falta de esforço/talento", "a real sobre").',
  '- storytelling: conta a história de uma pessoa ou uma jornada (aluno que conseguiu a vaga, trajetória).',
  '- noticia: novidade/acontecimento do mundo tech (lançamento, empresa fez X, dado de mercado, "novidades da semana").',
  '- pergunta: gira em torno de uma pergunta ao público pra gerar engajamento.',
  '- venda: oferta/evento/matrícula (DevQuest, Semana, inscrição, "comenta AGORA que te chamo na DM pra inscrição").',
  '- conceito: explica UM conceito técnico (clean code, especificidade do CSS, o que é Git, métodos de array).',
  '- ferramenta: apresenta/mostra UMA ferramenta ou produto específico como foco (n8n, LightBot, um app de IA, config do VS Code).',
  '',
  'Desempate: se o post ENSINA/mostra uma ferramenta específica como foco, use "ferramenta" (não "noticia"). Se é uma novidade/lançamento que aconteceu, use "noticia". Se o foco é explicar um conceito, use "conceito". "venda" tem apelo comercial/evento explícito.',
].join('\n');

const TOOL: Anthropic.Tool = {
  name: 'classificar',
  description: 'Classifica cada carrossel listado por estrutura narrativa.',
  input_schema: {
    type: 'object',
    properties: {
      itens: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            i: { type: 'number', description: 'o índice # mostrado do carrossel' },
            estrutura: { type: 'string', enum: [...ESTRUTURAS] },
          },
          required: ['i', 'estrutura'],
        },
      },
    },
    required: ['itens'],
  },
};

type Lote = { id: string; tema: string | null };

async function classificarLote(client: Anthropic, lote: Lote[]): Promise<{ i: number; estrutura: Estrutura }[]> {
  const linhas = lote
    .map((c, k) => `#${k}: ${(c.tema ?? '').slice(0, 320).replace(/\s+/g, ' ').trim()}`)
    .join('\n');
  const prompt = [
    'Você classifica carrosséis de Instagram de um perfil de ensino de programação (@devemdobro) por ESTRUTURA NARRATIVA.',
    'Taxonomia:',
    DEFINICOES,
    '',
    `Classifique CADA um dos ${lote.length} carrosséis abaixo pelo índice #. Chame a tool 'classificar' com UM item por carrossel (todos os índices de 0 a ${lote.length - 1}).`,
    '',
    linhas,
  ].join('\n');

  const res = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2000,
    tools: [TOOL],
    tool_choice: { type: 'tool', name: 'classificar' },
    messages: [{ role: 'user', content: prompt }],
  });
  const call = res.content.find(
    (x): x is Anthropic.ToolUseBlock => x.type === 'tool_use' && x.name === 'classificar',
  );
  if (!call) throw new Error('IA não classificou o lote');
  return (call.input as { itens: { i: number; estrutura: Estrutura }[] }).itens ?? [];
}

async function main(): Promise<void> {
  const apiKey = getAgencyAnthropicKey();
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY ausente no ambiente do servidor.');
  const client = new Anthropic({ apiKey });

  const pendentes = await db
    .select({ id: conteudoDesempenho.id, tema: conteudoDesempenho.tema })
    .from(conteudoDesempenho)
    .where(and(eq(conteudoDesempenho.formato, 'carrossel'), isNull(conteudoDesempenho.estrutura)));

  console.log(`[classificar] ${pendentes.length} carrosséis sem estrutura`);
  if (!pendentes.length) {
    console.log('[classificar] nada a fazer');
    process.exit(0);
  }

  const TAM = 20;
  let ok = 0;
  for (let off = 0; off < pendentes.length; off += TAM) {
    const lote = pendentes.slice(off, off + TAM);
    const itens = await classificarLote(client, lote);
    for (const { i, estrutura } of itens) {
      const alvo = lote[i];
      if (!alvo || !ESTRUTURAS.includes(estrutura)) continue;
      await db.update(conteudoDesempenho).set({ estrutura }).where(eq(conteudoDesempenho.id, alvo.id));
      ok++;
    }
    console.log(`[classificar] lote ${Math.floor(off / TAM) + 1}: ${itens.length} classificados`);
  }
  console.log(`[classificar] OK — ${ok} carrosséis atualizados`);
  process.exit(0);
}

main().catch((err) => {
  console.error('[classificar] FALHOU:', err instanceof Error ? err.stack ?? err.message : err);
  process.exit(1);
});
