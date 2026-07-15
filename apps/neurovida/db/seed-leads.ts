/**
 * apps/neurovida — SEED de Leads Quentes com dados FALSOS (Caminho C).
 *
 * Monta CSVs sintéticos das 5 fontes (com pessoas sobrepostas p/ exercitar o
 * dedup), importa cada uma, consolida e pontua com a MESMA régua de ICP do
 * manifesto — deixando a tela /leads cheia para o dono ver. Idempotente
 * (importCsv substitui a fonte; merge/score recomputam). Usa OWNER (env.ts).
 *
 * Uso: pnpm -C apps/neurovida db:seed-leads
 */

import { db } from './client';
import { makeLeads, isScoringSpec, type ServerDb, type ScoringSpec } from '@os/server';
import { neurovidaManifest } from '../src/manifest';

// Régua de ICP: a mesma que a UI envia (config.scoring do menu de leads).
function resolveScoring(): ScoringSpec {
  const menu = neurovidaManifest.navigation.menus.find((m) => m.view?.block === 'lead-console');
  const s = (menu?.view?.config as { scoring?: unknown } | undefined)?.scoring;
  if (!isScoringSpec(s)) {
    throw new Error('[seed-leads] não achei a régua de scoring no manifesto (menu lead-console).');
  }
  return s;
}
const scoring = resolveScoring();

const SURVEY_COLS = [
  'Faixa etária',
  'Você já usa suplementos alimentares?',
  'Renda mensal familiar',
  'Qual seu principal objetivo com a saúde hoje?',
  'Algum profissional já recomendou suplementação para você?',
  'Você já comprou produtos de saúde pela internet?',
  'Com que rapidez pretende cuidar disso?',
];

interface Person {
  name: string;
  email: string;
  phone: string;
  survey?: string[]; // respostas na ordem de SURVEY_COLS (só quem respondeu a pesquisa)
}

// Elenco: 8 respondentes (pesquisa) calibrados p/ S/A/B/C + 6 sem pesquisa.
const P: Record<string, Person> = {
  ana: { name: 'Ana Beatriz Rocha', email: 'ana.beatriz@email.com', phone: '(11) 98801-0001', survey: ['35 a 44 anos', 'Uso diariamente', 'Acima de R$ 10.000', 'Mais energia e disposição', 'Sim, tenho recomendação', 'Compro com frequência', 'Quero começar agora'] }, // ~92 → S
  eva: { name: 'Eva Martins', email: 'eva.martins@email.com', phone: '(11) 98801-0002', survey: ['45 a 54 anos', 'Uso de vez em quando', 'R$ 5.001 a R$ 10.000', 'Fortalecer a imunidade', 'Sim, tenho recomendação', 'Já comprei algumas vezes', 'Nos próximos 30 dias'] }, // ~73 → S
  julia: { name: 'Júlia Prado', email: 'julia.prado@email.com', phone: '(21) 98801-0003', survey: ['25 a 34 anos', 'Uso diariamente', 'Acima de R$ 10.000', 'Dormir melhor', 'Sim, tenho recomendação', 'Compro com frequência', 'Quero começar agora'] }, // ~88 → S
  rafael: { name: 'Rafael Souza', email: 'rafael.souza@email.com', phone: '(31) 98801-0004', survey: ['25 a 34 anos', 'Já usei, mas parei', 'R$ 2.501 a R$ 5.000', 'Estética e bem-estar', 'Não, seria por conta própria', 'Já comprei algumas vezes', 'Nos próximos 30 dias'] }, // ~46 → A
  carla: { name: 'Carla Nunes', email: 'carla.nunes@email.com', phone: '(11) 98801-0005', survey: ['18 a 24 anos', 'Já usei, mas parei', 'R$ 1.501 a R$ 2.500', 'Estética e bem-estar', 'Não, seria por conta própria', 'Já comprei algumas vezes', 'Só estou pesquisando'] }, // ~30 → B
  sofia: { name: 'Sofia Lima', email: 'sofia.lima@email.com', phone: '(41) 98801-0006', survey: ['55 anos ou mais', 'Nunca usei', 'R$ 2.501 a R$ 5.000', 'Memória e foco', 'Não, seria por conta própria', 'Nunca comprei', 'Nos próximos 30 dias'] }, // ~34 → B
  bruno: { name: 'Bruno Alves', email: 'bruno.alves@email.com', phone: '(11) 98801-0007', survey: ['18 a 24 anos', 'Nunca usei', 'Até R$ 1.500', 'Estética e bem-estar', 'Não, seria por conta própria', 'Nunca comprei', 'Só estou pesquisando'] }, // ~13 → C
  lucas: { name: 'Lucas Dias', email: 'lucas.dias@email.com', phone: '(51) 98801-0008', survey: ['18 a 24 anos', 'Nunca usei', 'Até R$ 1.500', 'Estética e bem-estar', 'Não, seria por conta própria', 'Nunca comprei', 'Só estou pesquisando'] }, // ~13 → C
  diego: { name: 'Diego Ramos', email: 'diego.ramos@email.com', phone: '(11) 98801-0009' },
  fabio: { name: 'Fábio Costa', email: 'fabio.costa@email.com', phone: '(11) 98801-0010' },
  gustavo: { name: 'Gustavo Reis', email: 'gustavo.reis@email.com', phone: '(61) 98801-0011' },
  helena: { name: 'Helena Castro', email: 'helena.castro@email.com', phone: '(11) 98801-0012' },
  igor: { name: 'Igor Mendes', email: 'igor.mendes@email.com', phone: '(11) 98801-0013' },
  marina: { name: 'Marina Rocha', email: 'marina.rocha@email.com', phone: '(71) 98801-0014' },
};

interface SourceDef {
  cols: string[];
  people: string[];
}
const SOURCES: Record<string, SourceDef> = {
  activecampaign: { cols: ['Nome', 'E-mail'], people: ['ana', 'julia', 'carla', 'diego', 'igor', 'marina'] },
  clint: { cols: ['Nome', 'E-mail', 'Telefone'], people: ['ana', 'eva', 'fabio', 'igor', 'diego'] },
  pesquisa: { cols: ['Nome', 'E-mail', 'WhatsApp', ...SURVEY_COLS], people: ['ana', 'eva', 'julia', 'rafael', 'carla', 'sofia', 'bruno', 'lucas'] },
  hotmart: { cols: ['Nome', 'E-mail'], people: ['rafael', 'bruno', 'gustavo'] },
  manychat: { cols: ['Nome', 'WhatsApp'], people: ['ana', 'sofia', 'diego', 'helena'] },
};

function cell(v: string): string {
  return /[",;\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}
function valueFor(col: string, p: Person): string {
  if (col === 'Nome') return p.name;
  if (col === 'E-mail') return p.email;
  if (col === 'Telefone' || col === 'WhatsApp') return p.phone;
  const si = SURVEY_COLS.indexOf(col);
  if (si >= 0) return p.survey?.[si] ?? '';
  return '';
}
function buildCsv(def: SourceDef): string {
  const header = def.cols.map(cell).join(',');
  const lines = def.people.map((key) => def.cols.map((c) => cell(valueFor(c, P[key]))).join(','));
  return [header, ...lines].join('\r\n');
}

async function main(): Promise<void> {
  const leads = makeLeads(db as unknown as ServerDb);

  console.log('[seed-leads] importando 5 fontes (dados falsos):');
  for (const [source, def] of Object.entries(SOURCES)) {
    const res = await leads.importCsv(source as never, buildCsv(def));
    console.log(`  ${source.padEnd(15)} → ${res.inserted} linha(s) [email:${res.detected.email ?? '—'} tel:${res.detected.phone ?? '—'}]`);
  }

  const merge = await leads.mergeLeads();
  console.log(`[seed-leads] merge: ${merge.totalRecords} registros → ${merge.uniqueLeads} leads (${merge.duplicatesMerged} fundidos, ${merge.pctComPesquisa}% com pesquisa)`);

  const score = await leads.scoreLeads(scoring);
  console.log('[seed-leads] score por tier:', JSON.stringify(score.byTier));
  console.log('[seed-leads] por segmento:', JSON.stringify(score.bySegment));
  console.log('[seed-leads] OK — abra /leads (a tela já mostra os segmentos e a tabela).');
}

main().catch((err) => {
  console.error('[seed-leads] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
