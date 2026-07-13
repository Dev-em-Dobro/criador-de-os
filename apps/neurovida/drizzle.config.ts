/**
 * apps/neurovida — configuração do drizzle-kit (geração de migrations).
 * A connection string é lida server-side (api/env.ts) — nunca hardcoded aqui.
 */

import { defineConfig } from 'drizzle-kit';
import { getDatabaseUrl } from './api/env';

export default defineConfig({
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseUrl(),
  },
  verbose: true,
  strict: true,
});
