/**
 * apps/neurovida — cliente Drizzle sobre a Neon (driver HTTP one-shot).
 *
 * Dois papéis: `db` (owner — só scripts admin) e `dbAuth` (role app_auth —
 * R/W nas tabelas de auth + app_settings, é o que o runtime da API usa). A
 * connection string vem SÓ do ambiente server-side (nunca do bundle).
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { getDatabaseUrl, getAuthDatabaseUrl } from '../api/env';
import * as schema from './schema';

/** Client OWNER — privilégio total. SÓ scripts admin (migrate/grants/provision). */
export const db = drizzle(neon(getDatabaseUrl()), { schema });

/** Client do runtime (Better Auth + /api/settings) — role `app_auth`. */
export const dbAuth = drizzle(neon(getAuthDatabaseUrl()), { schema });

export type Db = typeof db;
export { schema };
