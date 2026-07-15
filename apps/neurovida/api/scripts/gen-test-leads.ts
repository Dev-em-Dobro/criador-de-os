/**
 * apps/neurovida — gera 5 CSVs de leads FICTÍCIOS (um por fonte) para testar o
 * fluxo de Leads quentes (Subir CSV → Consolidar → Pontuar) SEM tocar em dado real.
 *
 * O elenco é sobreposto de propósito (mesma pessoa por e-mail OU telefone em
 * fontes diferentes) para PROVAR a deduplicação; a "Pesquisa de perfil" traz as
 * 7 colunas do ICP do manifesto para PROVAR o score. Cada CSV imita o export de
 * uma ferramenta real (colunas e separador diferentes) — o sistema auto-detecta.
 *
 * Uso: pnpm -C apps/neurovida tsx api/scripts/gen-test-leads.ts
 * Saída: api/scripts/test-leads/{activecampaign,clint,pesquisa,hotmart,manychat}.csv
 *
 * Resultado esperado ao subir tudo → Consolidar → Pontuar (régua do manifesto):
 *   14 registros → 6 leads únicos (8 fundidos)
 *   Ana=92 (S, icp-alto, 4 fontes) · Eva=90 (S, icp-alto)
 *   Carla=32 (B, icp-medio) · Bruno=13 (C, icp-baixo)
 *   Diego e Fábio = sem pesquisa → sem-perfil
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------- serializador CSV (RFC 4180) ----------

/** Envolve o campo em aspas se contiver o separador, aspas ou quebra de linha. */
function field(value: string, sep: string): string {
  if (value.includes(sep) || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function toCsv(headers: string[], rows: string[][], sep: ',' | ';'): string {
  return [headers, ...rows].map((r) => r.map((f) => field(f, sep)).join(sep)).join('\r\n') + '\r\n';
}

// ---------- elenco (sobreposto por e-mail/telefone) ----------

// Telefones em formatos diferentes de propósito — a canonicalização BR os une.
const ana = { name: 'Ana Beatriz Rocha', email: 'ana.rocha@example.com', phone: '(11) 98888-1001' };
const bruno = { name: 'Bruno Carvalho', email: 'bruno.carvalho@example.com' };
const carla = { name: 'Carla Mendes', email: 'carla.mendes@example.com', phone: '(21) 99999-2002' };
const diego = { name: 'Diego Santos', email: 'diego.santos@example.com', phone: '(31) 98888-3003' };
const eva = { name: 'Eva Lima', email: 'eva.lima@example.com' };
const fabio = { name: 'Fábio Nunes', phone: '(41) 99999-4004' };

// Respostas da pesquisa (valores = opções exatas do surveyTemplate do manifesto).
// Ordem: faixa etária, suplementos, renda, objetivo, recomendação, internet, rapidez.
const anaSurvey = ['35 a 44 anos', 'Uso diariamente', 'Acima de R$ 10.000', 'Mais energia e disposição', 'Sim, tenho recomendação', 'Compro com frequência', 'Quero começar agora'];
const brunoSurvey = ['18 a 24 anos', 'Nunca usei', 'Até R$ 1.500', 'Estética e bem-estar', 'Não, seria por conta própria', 'Nunca comprei', 'Só estou pesquisando'];
const carlaSurvey = ['18 a 24 anos', 'Já usei, mas parei', 'R$ 1.501 a R$ 2.500', 'Estética e bem-estar', 'Não, seria por conta própria', 'Nunca comprei', 'Nos próximos 30 dias'];
const evaSurvey = ['45 a 54 anos', 'Uso diariamente', 'R$ 5.001 a R$ 10.000', 'Fortalecer a imunidade', 'Sim, tenho recomendação', 'Compro com frequência', 'Quero começar agora'];

// ---------- os 5 CSVs (colunas/separador imitando cada ferramenta) ----------

interface SourceCsv {
  file: string;
  sep: ',' | ';';
  headers: string[];
  rows: string[][];
}

const SURVEY_COLS = [
  'Faixa etária',
  'Você já usa suplementos alimentares?',
  'Renda mensal familiar',
  'Qual seu principal objetivo com a saúde hoje?',
  'Algum profissional já recomendou suplementação para você?',
  'Você já comprou produtos de saúde pela internet?',
  'Com que rapidez pretende cuidar disso?',
];

const SOURCES: SourceCsv[] = [
  {
    // "Listas de e-mail" (ex.: ActiveCampaign) — só e-mail + nome.
    file: 'activecampaign.csv',
    sep: ',',
    headers: ['Email', 'First Name', 'Last Name', 'Tags'],
    rows: [
      [ana.email, 'Ana Beatriz', 'Rocha', 'vip;newsletter'],
      [bruno.email, 'Bruno', 'Carvalho', 'newsletter'],
      [eva.email, 'Eva', 'Lima', 'vip'],
    ],
  },
  {
    // "CRM (contatos)" (ex.: Clint) — e-mail + telefone, separador ';'.
    file: 'clint.csv',
    sep: ';',
    headers: ['Nome', 'Email', 'Telefone', 'Origem'],
    rows: [
      [ana.name, ana.email, ana.phone, 'Landing page'],
      [diego.name, diego.email, diego.phone, 'Indicação'],
    ],
  },
  {
    // "Pesquisa de perfil" — identidade + as 7 perguntas do ICP (alimenta o score).
    file: 'pesquisa.csv',
    sep: ',',
    headers: ['Nome', 'E-mail', 'WhatsApp', ...SURVEY_COLS],
    rows: [
      [ana.name, ana.email, '11988881001', ...anaSurvey],
      [bruno.name, bruno.email, '', ...brunoSurvey],
      [carla.name, carla.email, carla.phone, ...carlaSurvey],
      [eva.name, eva.email, '', ...evaSurvey],
    ],
  },
  {
    // "Compras" (ex.: Hotmart) — comprador + e-mail.
    file: 'hotmart.csv',
    sep: ',',
    headers: ['Nome do Comprador', 'Email do Comprador', 'Produto', 'Data da Compra'],
    rows: [
      [carla.name, carla.email, 'Programa Vitalidade 90 dias', '12/06/2026'],
      [diego.name, diego.email, 'Kit Imunidade', '03/06/2026'],
    ],
  },
  {
    // "Chat / social" (ex.: ManyChat) — telefone (formatos variados) + @.
    file: 'manychat.csv',
    sep: ',',
    headers: ['Nome', 'WhatsApp', 'Instagram'],
    rows: [
      [ana.name, '+55 11 98888-1001', '@ana.bea'],
      [diego.name, '5531988883003', '@diego.santos'],
      [fabio.name, fabio.phone, '@fabio.nunes'],
    ],
  },
];

function main(): void {
  const outDir = join(dirname(fileURLToPath(import.meta.url)), 'test-leads');
  mkdirSync(outDir, { recursive: true });

  let totalRows = 0;
  for (const s of SOURCES) {
    const csv = toCsv(s.headers, s.rows, s.sep);
    writeFileSync(join(outDir, s.file), csv, 'utf8');
    totalRows += s.rows.length;
    console.log(`✔ ${s.file.padEnd(20)} — ${s.rows.length} registros — sep '${s.sep}'`);
  }

  console.log(`\nPasta: ${outDir}`);
  console.log(`Total de registros nas 5 fontes: ${totalRows}`);
  console.log('\nSuba cada CSV na fonte correspondente em "Leads quentes", depois:');
  console.log('  1. Consolidar → esperado: 6 leads únicos (8 duplicados fundidos)');
  console.log('  2. Pontuar    → Ana/Eva = S (icp-alto), Carla = B (icp-medio),');
  console.log('                  Bruno = C (icp-baixo), Diego/Fábio = sem-perfil');
}

main();
