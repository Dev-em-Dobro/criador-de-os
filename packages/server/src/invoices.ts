/**
 * @os/server — armazenamento + agregação das faturas de cartão (genérico).
 *
 * `makeInvoices(db)` devolve as operações ligadas ao banco do app. Agrega os
 * custos por categoria somando TODAS as faturas.
 */

import { randomUUID } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { invoices, invoiceItems } from './schema';
import type { ServerDb } from './db';
import type { ExtractedInvoice } from './invoice-extract';

const CHUNK = 200;

export interface SavedInvoice {
  id: string;
  reference: string;
  total: number;
  itemCount: number;
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

export interface InvoicesApi {
  saveInvoice(filename: string, extracted: ExtractedInvoice): Promise<SavedInvoice>;
  getInvoices(): Promise<InvoicesResponse>;
  deleteInvoice(id: string): Promise<void>;
}

export function makeInvoices(db: ServerDb): InvoicesApi {
  return {
    async saveInvoice(filename, extracted) {
      const id = `inv_${randomUUID()}`;
      const total = extracted.items.reduce((s, i) => s + i.amount, 0);

      await db.insert(invoices).values({
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
        await db.insert(invoiceItems).values(rows.slice(i, i + CHUNK));
      }

      return { id, reference: extracted.reference, total, itemCount: extracted.items.length };
    },

    async getInvoices() {
      const invs = await db.select().from(invoices).orderBy(desc(invoices.createdAt));
      const rawItems = await db.select().from(invoiceItems);

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
    },

    async deleteInvoice(id) {
      await db.delete(invoices).where(eq(invoices.id, id));
    },
  };
}
