/**
 * apps/neurovida — gera 3 PDFs de fatura de cartão FICTÍCIAS para testar o fluxo
 * de upload de faturas (Subir PDF(s) → IA extrai/categoriza → soma).
 *
 * Sem dependências: escreve PDF 1.4 mínimo (texto real, fonte Helvetica) à mão.
 * As 3 faturas têm referências, mix de categorias e totais DIFERENTES entre si.
 *
 * Uso: pnpm tsx api/scripts/gen-test-invoices.ts
 * Saída: api/scripts/test-invoices/fatura-1-maio.pdf, ...-2-junho.pdf, ...-3-julho.pdf
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ---------- PDF mínimo (texto) ----------

interface Line {
  text: string;
  x: number;
  y: number;
  size?: number;
  bold?: boolean;
}

/** Remove acentos e não-ASCII (Helvetica/WinAnsi + escrita latin1 = seguro). */
function toAscii(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x20-\x7E]/g, '?');
}

/** Escapa os delimitadores de string do PDF. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function contentStream(lines: Line[]): string {
  let out = '';
  for (const l of lines) {
    const font = l.bold ? '/F2' : '/F1';
    const size = l.size ?? 10;
    out += `BT ${font} ${size} Tf 1 0 0 1 ${l.x} ${l.y} Tm (${esc(toAscii(l.text))}) Tj ET\n`;
  }
  return out;
}

/** Monta um PDF 1.4 de uma página A4 (595x842) com as linhas dadas. */
function buildPdf(lines: Line[]): Buffer {
  const content = contentStream(lines);
  const contentLen = Buffer.byteLength(content, 'latin1');

  const header = '%PDF-1.4\n';
  const parts: string[] = [];
  const offsets: number[] = [];
  let pos = Buffer.byteLength(header, 'latin1');

  const addObj = (body: string): void => {
    offsets.push(pos);
    parts.push(body);
    pos += Buffer.byteLength(body, 'latin1');
  };

  addObj('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  addObj('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  addObj(
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
      '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>\nendobj\n',
  );
  addObj(`4 0 obj\n<< /Length ${contentLen} >>\nstream\n${content}endstream\nendobj\n`);
  addObj('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n');
  addObj('6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n');

  const body = parts.join('');
  const xrefPos = Buffer.byteLength(header + body, 'latin1');

  let xref = 'xref\n0 7\n0000000000 65535 f \n';
  for (const off of offsets) xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  const trailer = `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;

  return Buffer.from(header + body + xref + trailer, 'latin1');
}

// ---------- Layout de fatura ----------

function brl(n: number): string {
  const [int, dec] = n.toFixed(2).split('.');
  return `${int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')},${dec}`;
}

interface Item {
  date: string;
  desc: string;
  amount: number;
}
interface InvoiceSpec {
  card: string;
  bank: string;
  last4: string;
  reference: string;
  due: string;
  close: string;
  items: Item[];
}

function layoutInvoice(spec: InvoiceSpec): { lines: Line[]; total: number } {
  const lines: Line[] = [];
  lines.push({ text: spec.card, x: 60, y: 792, size: 16, bold: true });
  lines.push({ text: 'Fatura do cartao de credito', x: 60, y: 772, size: 10 });
  lines.push({ text: `${spec.bank}  |  Cartao final ****${spec.last4}`, x: 60, y: 757, size: 9 });
  lines.push({ text: `Periodo de referencia: ${spec.reference}`, x: 60, y: 733, size: 11, bold: true });
  lines.push({ text: `Vencimento: ${spec.due}    Fechamento: ${spec.close}`, x: 60, y: 717, size: 10 });

  lines.push({ text: 'LANCAMENTOS', x: 60, y: 688, size: 11, bold: true });
  lines.push({ text: 'DATA', x: 60, y: 670, size: 9, bold: true });
  lines.push({ text: 'DESCRICAO', x: 120, y: 670, size: 9, bold: true });
  lines.push({ text: 'VALOR (R$)', x: 452, y: 670, size: 9, bold: true });

  let y = 650;
  let total = 0;
  for (const it of spec.items) {
    total += it.amount;
    lines.push({ text: it.date, x: 60, y, size: 9 });
    lines.push({ text: it.desc, x: 120, y, size: 9 });
    lines.push({ text: brl(it.amount), x: 452, y, size: 9 });
    y -= 20;
  }

  y -= 8;
  lines.push({ text: 'TOTAL DA FATURA', x: 120, y, size: 11, bold: true });
  lines.push({ text: `R$ ${brl(total)}`, x: 430, y, size: 11, bold: true });
  return { lines, total };
}

// ---------- As 3 faturas (distintas) ----------

const INVOICES: { file: string; spec: InvoiceSpec }[] = [
  {
    file: 'fatura-1-maio.pdf',
    spec: {
      card: 'Cartao Impulse Black',
      bank: 'Banco Impulse S.A.',
      last4: '1234',
      reference: 'Maio/2026',
      due: '10/05/2026',
      close: '30/04/2026',
      items: [
        { date: '03/04', desc: 'ANTHROPIC CLAUDE.AI', amount: 142.9 },
        { date: '05/04', desc: 'OPENAI CHATGPT PLUS', amount: 110.0 },
        { date: '07/04', desc: 'ACTIVECAMPAIGN', amount: 349.0 },
        { date: '09/04', desc: 'VERCEL INC', amount: 98.0 },
        { date: '12/04', desc: 'META PLATFORMS ADS', amount: 1250.0 },
        { date: '15/04', desc: 'NOTION LABS', amount: 48.0 },
        { date: '18/04', desc: 'CANVA PRO', amount: 54.9 },
        { date: '20/04', desc: 'UBER *TRIP', amount: 32.4 },
        { date: '28/04', desc: 'IOF TRANSACAO EXTERIOR', amount: 18.73 },
      ],
    },
  },
  {
    file: 'fatura-2-junho.pdf',
    spec: {
      card: 'Cartao Neurovida Gold',
      bank: 'Banco Neurovida S.A.',
      last4: '5678',
      reference: 'Junho/2026',
      due: '08/06/2026',
      close: '31/05/2026',
      items: [
        { date: '02/05', desc: 'GOOGLE ADS', amount: 890.0 },
        { date: '04/05', desc: 'TIKTOK ADS', amount: 460.0 },
        { date: '06/05', desc: 'HOTMART CURSO MARKETING', amount: 297.0 },
        { date: '09/05', desc: 'ELEVENLABS', amount: 132.0 },
        { date: '11/05', desc: 'GITHUB', amount: 210.0 },
        { date: '14/05', desc: 'ZOOM VIDEO', amount: 79.9 },
        { date: '17/05', desc: 'CLARO CELULAR', amount: 119.99 },
        { date: '21/05', desc: '99 APP CORRIDA', amount: 24.8 },
        { date: '30/05', desc: 'IOF FATURA', amount: 15.4 },
      ],
    },
  },
  {
    file: 'fatura-3-julho.pdf',
    spec: {
      card: 'Cartao Lirane Corporativo',
      bank: 'Banco Lirane S.A.',
      last4: '9012',
      reference: 'Julho/2026',
      due: '12/07/2026',
      close: '30/06/2026',
      items: [
        { date: '01/06', desc: 'CLOUDFLARE', amount: 66.0 },
        { date: '03/06', desc: 'AMAZON AWS', amount: 435.2 },
        { date: '05/06', desc: 'MIDJOURNEY', amount: 60.0 },
        { date: '08/06', desc: 'RD STATION', amount: 559.0 },
        { date: '10/06', desc: 'GOOGLE WORKSPACE', amount: 66.8 },
        { date: '13/06', desc: 'GOL LINHAS AEREAS', amount: 780.0 },
        { date: '16/06', desc: 'HOTEL IBIS SP', amount: 320.0 },
        { date: '22/06', desc: 'NOTAZZ NF-E', amount: 49.9 },
        { date: '29/06', desc: 'IOF TARIFA', amount: 22.15 },
      ],
    },
  },
];

function main(): void {
  const outDir = join(dirname(fileURLToPath(import.meta.url)), 'test-invoices');
  mkdirSync(outDir, { recursive: true });

  let grand = 0;
  for (const { file, spec } of INVOICES) {
    const { lines, total } = layoutInvoice(spec);
    const pdf = buildPdf(lines);
    const path = join(outDir, file);
    writeFileSync(path, pdf);
    grand += total;
    console.log(`✔ ${file}  —  ${spec.reference}  —  ${spec.items.length} itens  —  R$ ${brl(total)}  (${pdf.length} bytes)`);
  }
  console.log(`\nPasta: ${outDir}`);
  console.log(`Total das 3 faturas somadas: R$ ${brl(grand)}`);
  console.log('\nSuba os 3 PDFs na aba de Faturas (botao "Subir PDF(s) da fatura") para testar.');
}

main();
