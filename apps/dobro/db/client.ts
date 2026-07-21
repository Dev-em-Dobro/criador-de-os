/**
 * apps/dobro — cliente Drizzle sobre a Neon (driver HTTP one-shot).
 *
 * Usa `@neondatabase/serverless` em modo HTTP (doc 05, §3): ideal para o
 * read-path serverless/stateless do endpoint de query (abrir/usar sem manter
 * pool). A connection string vem SÓ do ambiente server-side (nunca do bundle).
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import {
  getDatabaseUrl,
  getAuthDatabaseUrl,
  getQueryDatabaseUrl,
  getIngestDatabaseUrl,
  getContentDatabaseUrl,
} from '../server/env';
import * as schema from './schema';

// `neon(url)` só monta o client HTTP (não abre conexão até a 1ª query), então
// manter três instâncias por papel é barato. Cada uma carrega o privilégio da
// sua connection string (Fase 3 — least privilege por caminho, doc 05, §4/§6).

/**
 * Client OWNER — privilégio total (lê/escreve/DROP). Usado SÓ por scripts admin
 * (migrate/seed/grants). NUNCA pelo runtime da API exposta à internet.
 */
export const db = drizzle(neon(getDatabaseUrl()), { schema });

/**
 * Client do Better Auth — role `app_auth` (R/W só nas tabelas de auth). É o que
 * o handler `/api/auth/*` usa. Fallback DEV: owner (com WARN em env.ts).
 */
export const dbAuth = drizzle(neon(getAuthDatabaseUrl()), { schema });

/**
 * Client do endpoint `/api/query` — role `app_query` (SELECT só nas views `v_*`).
 * Fallback DEV: owner (com WARN em env.ts).
 */
export const dbQuery = drizzle(neon(getQueryDatabaseUrl()), { schema });

/**
 * Client do webhook do Telegram — role `app_ingest` (INSERT só em `referencias`).
 * Fallback DEV: owner (com WARN em env.ts).
 */
export const dbIngest = drizzle(neon(getIngestDatabaseUrl()), { schema });

/**
 * Client das rotas `/api/conteudo` — role `app_content` (SELECT/INSERT/UPDATE/
 * DELETE só em `conteudo_posts`). É o que o criador usa para cadastrar/editar o
 * cronograma pela tela. Fallback DEV: owner (com WARN em env.ts).
 */
export const dbContent = drizzle(neon(getContentDatabaseUrl()), { schema });

export type Db = typeof db;
export { schema };
