/**
 * apps/neurovida — armazenamento + agregação das faturas de cartão.
 *
 * Guarda a fatura extraída (por IA) e seus itens no Neon; agrega os custos por
 * categoria SOMANDO TODAS as faturas (o pedido: "categoriza todas juntas e mostra
 * os custos somados"). R/W via role app_auth (autenticado).
 */

import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { dbAuth, schema } from '../db/client';
import type { ExtractedInvoice } from './invoice-extract';

const CHUNK = 200;

export interface SavedInvoice {
  id: string;
  reference: string;
  total: number;
  itemCount: number;
}

/** Persiste uma fatura extraída + seus itens. Retorna o resumo. */
export async function saveInvoice(filename: string, extracted: ExtractedInvoice): Promise<SavedInvoice> {
  const id = `inv_${randomUUID()}`;
  const total = extracted.items.reduce((s, i) => s + i.amount, 0);

  await dbAuth.insert(schema.invoices).values({
    id,
    filename,
    reference: extracted.reference,
    total,
    itemCount: extracted.items.length,
  });

  const rows = extracted.items.map((it) => ({
    invoiceId: id,
    description: it.description,
    establishment: it.establishment ?? null,
    category: it.category,
    amount: it.amount,
    purchaseDate: it.date ?? null,
    recurring: it.recurring,
  }));
  for (let i = 0; i < rows.length; i += CHUNK) {
    await dbAuth.insert(schema.invoiceItems).values(rows.slice(i, i + CHUNK));
  }

  return { id, reference: extracted.reference, total, itemCount: extracted.items.length };
}

export interface InvoiceItemOut {
  id: number;
  description: string;
  establishment: string | null;
  category: string;
  amount: number;
  purchaseDate: string | null;
  recurring: boolean;
}
export interface InvoiceOut {
  id: string;
  filename: string;
  reference: string | null;
  total: number;
  itemCount: number;
  items: InvoiceItemOut[];
}
export interface InvoicesResponse {
  invoices: InvoiceOut[];
  totals: { grand: number; recurring: number; byCategory: Record<string, number> };
}

/** Lista as faturas + itens + agregados (soma geral, recorrentes, por categoria). */
export async function getInvoices(): Promise<InvoicesResponse> {
  const invs = await dbAuth.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
  const rawItems = await dbAuth.select().from(schema.invoiceItems);

  const byInvoice = new Map<string, InvoiceItemOut[]>();
  const byCategory: Record<string, number> = {};
  let grand = 0;
  let recurring = 0;
  for (const it of rawItems) {
    const out: InvoiceItemOut = {
      id: it.id,
      description: it.description,
      establishment: it.establishment,
      category: it.category,
      amount: it.amount,
      purchaseDate: it.purchaseDate,
      recurring: it.recurring,
    };
    const list = byInvoice.get(it.invoiceId);
    if (list) list.push(out);
    else byInvoice.set(it.invoiceId, [out]);
    byCategory[it.category] = (byCategory[it.category] ?? 0) + it.amount;
    grand += it.amount;
    if (it.recurring) recurring += it.amount;
  }

  return {
    invoices: invs.map((inv) => ({
      id: inv.id,
      filename: inv.filename,
      reference: inv.reference,
      total: inv.total,
      itemCount: inv.itemCount,
      items: (byInvoice.get(inv.id) ?? []).sort((a, b) => b.amount - a.amount),
    })),
    totals: { grand, recurring, byCategory },
  };
}

/** Remove uma fatura (os itens caem por cascade). */
export async function deleteInvoice(id: string): Promise<void> {
  await dbAuth.delete(schema.invoices).where(eq(schema.invoices.id, id));
}
