/**
 * @os/server — parser CSV (RFC 4180) + normalizadores de contato (genéricos).
 *
 * Auto-detecta separador (`;`/`,`), respeita aspas/quebras embutidas e `""`.
 * Normaliza email (lowercase) e telefone (canônico BR) para chave de dedupe.
 */

export interface ParsedCsv {
  headers: string[];
  rows: Array<Record<string, string>>;
}

function detectSeparator(firstLine: string): ',' | ';' {
  return firstLine.includes(';') ? ';' : ',';
}

export function parseCsv(text: string): ParsedCsv {
  const clean = text.replace(/^﻿/, ''); // remove BOM
  const firstNl = clean.indexOf('\n');
  const firstLine = firstNl >= 0 ? clean.slice(0, firstNl) : clean;
  const sep = detectSeparator(firstLine);

  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (inQuotes) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && clean[i + 1] === '\n') i++;
      record.push(field);
      field = '';
      if (record.some((f) => f.trim() !== '')) records.push(record);
      record = [];
    } else {
      field += ch;
    }
  }
  if (field !== '' || record.length > 0) {
    record.push(field);
    if (record.some((f) => f.trim() !== '')) records.push(record);
  }

  if (records.length === 0) return { headers: [], rows: [] };

  const headers = records[0].map((h) => h.trim());
  const rows = records.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = (r[idx] ?? '').trim();
    });
    return obj;
  });
  return { headers, rows };
}

export function findEmailColumn(headers: string[]): number {
  return headers.findIndex((h) => {
    const l = h.toLowerCase();
    return l.includes('email') || l.includes('e-mail');
  });
}

export function findPhoneColumn(headers: string[]): number {
  return headers.findIndex((h) => {
    const l = h.toLowerCase();
    return (
      l.includes('fone') ||
      l.includes('phone') ||
      l.includes('tel') ||
      l.includes('cel') ||
      l.includes('whats') ||
      l.includes('numero') ||
      l.includes('número')
    );
  });
}

export function findNameColumn(headers: string[]): number {
  return headers.findIndex((h) => {
    const l = h.toLowerCase();
    return l === 'nome' || l === 'name' || l.includes('nome') || l.includes('name') || l.includes('full');
  });
}

export function normalizeEmail(raw: string | undefined): string | null {
  if (!raw) return null;
  const e = raw.trim().toLowerCase();
  return e.includes('@') && e.length >= 5 ? e : null;
}

/** Telefone canônico BR: só dígitos → `55DDD9XXXXXXXX`. Null se < 10 dígitos. */
export function canonicalPhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 10) return null;
  if (digits.length === 13 && digits.startsWith('55')) return digits;
  if (digits.length === 12 && digits.startsWith('55')) return digits.slice(0, 4) + '9' + digits.slice(4);
  if (digits.length === 11) return '55' + digits;
  if (digits.length === 10) return '55' + digits.slice(0, 2) + '9' + digits.slice(2);
  return digits;
}
