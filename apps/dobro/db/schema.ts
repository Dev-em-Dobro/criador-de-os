/**
 * apps/dobro — Schema Drizzle (schema-as-code) do Neon do cliente "dobro".
 *
 * Duas famílias de tabelas:
 *  1) Better Auth (user/session/account/verification) — colunas conforme o
 *     core schema do Better Auth (doc 05, §5). O Drizzle adapter mapeia por
 *     nome de tabela/coluna, então os nomes têm de bater com o esperado.
 *  2) Negócio (metricas_visao_geral) — tabela de EXEMPLO desta fase, com as
 *     colunas usadas no manifesto (receita/conversao/roas/leads + *_prev).
 *
 * A VIEW read-only `v_visao_geral` (o contrato de exposição, doc 05, §4) é
 * criada por SQL puro em `db/views.sql` (Drizzle não modela views), e é a ÚNICA
 * coisa que o endpoint /api/query aceita ler — nunca a tabela crua.
 */

import {
  boolean,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ============================================================
// Better Auth — tabelas de autenticação
// (nomes/colunas conforme o core schema do Better Auth 1.6.x)
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
// Negócio — tabela de EXEMPLO desta fase
// ============================================================

/**
 * Métricas da tela "Visão geral". Colunas espelham exatamente o que o manifesto
 * consome (cada KPI + seu `*_prev` para a variação percentual dos cards).
 * A API NUNCA lê esta tabela direto — só a view `v_visao_geral` (allowlist).
 */
export const metricasVisaoGeral = pgTable('metricas_visao_geral', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  receita: doublePrecision('receita').notNull(),
  receitaPrev: doublePrecision('receita_prev').notNull(),
  conversao: doublePrecision('conversao').notNull(),
  conversaoPrev: doublePrecision('conversao_prev').notNull(),
  roas: doublePrecision('roas').notNull(),
  roasPrev: doublePrecision('roas_prev').notNull(),
  leads: integer('leads').notNull(),
  leadsPrev: integer('leads_prev').notNull(),
  /** Período de agregação: 'weekly' | 'monthly' | 'quarterly' (bate com Period do core). */
  period: text('period').notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});
