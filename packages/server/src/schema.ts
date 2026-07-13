/**
 * @os/server — schema Drizzle COMPARTILHADO da fábrica.
 *
 * Tabelas que toda capacidade genérica usa: Better Auth (login), app_settings
 * (BYOK cifrado), leads (ingestão+consolidação) e faturas (PDF por IA). Cada app
 * re-exporta estas tabelas do seu `db/schema.ts` e adiciona as tabelas do próprio
 * negócio. Um Neon por cliente — o isolamento é físico.
 */

import {
  boolean,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ============================================================
// Better Auth
// ============================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => new Date()),
});

// ============================================================
// Configurações do cliente (BYOK) — valor CIFRADO em repouso
// ============================================================

export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  valueEncrypted: text('value_encrypted').notNull(),
  hint: text('hint'),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// ============================================================
// Leads — ingestão (por fonte) + consolidação
// ============================================================

export const leadSourceRows = pgTable('lead_source_rows', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  source: text('source').notNull(),
  email: text('email'),
  phone: text('phone'),
  name: text('name'),
  raw: jsonb('raw').$type<Record<string, string>>().notNull(),
  importedAt: timestamp('imported_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const leads = pgTable('leads', {
  id: text('id').primaryKey(),
  email: text('email'),
  phone: text('phone'),
  name: text('name'),
  sources: jsonb('sources').$type<string[]>().notNull(),
  isAluno: boolean('is_aluno').notNull(),
  respondeuPesquisa: boolean('respondeu_pesquisa').notNull(),
  hasEmail: boolean('has_email').notNull(),
  hasPhone: boolean('has_phone').notNull(),
  recordCount: integer('record_count').notNull(),
  score: integer('score'),
  tier: text('tier'),
  segment: text('segment'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

// ============================================================
// Faturas de cartão — PDF extraído por IA
// ============================================================

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  filename: text('filename').notNull(),
  reference: text('reference'),
  total: doublePrecision('total').notNull(),
  itemCount: integer('item_count').notNull(),
  createdAt: timestamp('created_at')
    .$defaultFn(() => new Date())
    .notNull(),
});

export const invoiceItems = pgTable('invoice_items', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  invoiceId: text('invoice_id')
    .notNull()
    .references(() => invoices.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  establishment: text('establishment'),
  category: text('category').notNull(),
  amount: doublePrecision('amount').notNull(),
  purchaseDate: text('purchase_date'),
  recurring: boolean('recurring').notNull(),
});

/** SQL de GRANTs das tabelas compartilhadas para o role de runtime `app_auth`. */
export const SHARED_TABLES = [
  '"user"',
  '"session"',
  'account',
  'verification',
  'app_settings',
  'lead_source_rows',
  'leads',
  'invoices',
  'invoice_items',
] as const;
