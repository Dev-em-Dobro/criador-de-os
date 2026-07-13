/**
 * apps/neurovida — Schema Drizzle do Neon do cliente.
 *
 *  1) Better Auth (user/session/account/verification) — o cliente loga no OS.
 *  2) app_settings — chave→valor CIFRADO das configurações do cliente (BYOK).
 *     A API NUNCA devolve o valor cru ao browser; só um "hint" mascarado.
 *
 * Blocos de dados de negócio (fatura, leads) virão em fases seguintes, com suas
 * tabelas + views read-only na allowlist do /api/query.
 */

import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

// ============================================================
// Better Auth — tabelas de autenticação
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

/**
 * Um par chave→segredo por linha (ex.: `anthropic_api_key`). `valueEncrypted`
 * guarda AES-256-GCM (iv+tag+ciphertext, base64) — nunca o texto puro. `hint` é
 * um resumo mascarado (ex.: `••••Xy4Z`) seguro para exibir no painel.
 */
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  valueEncrypted: text('value_encrypted').notNull(),
  hint: text('hint'),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => new Date())
    .notNull(),
});
