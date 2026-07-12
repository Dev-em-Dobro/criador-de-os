/**
 * apps/dobro — cliente Drizzle sobre a Neon (driver HTTP one-shot).
 *
 * Usa `@neondatabase/serverless` em modo HTTP (doc 05, §3): ideal para o
 * read-path serverless/stateless do endpoint de query (abrir/usar sem manter
 * pool). A connection string vem SÓ do ambiente server-side (nunca do bundle).
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { getDatabaseUrl } from '../api/env';
import * as schema from './schema';

/** Instância Drizzle compartilhada pela API e pelos scripts (migrate/seed). */
export const db = drizzle(neon(getDatabaseUrl()), { schema });

export type Db = typeof db;
export { schema };
