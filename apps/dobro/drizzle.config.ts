/**
 * apps/dobro — configuração do drizzle-kit (geração de migrations).
 *
 * As migrations SQL são geradas em `db/migrations/` a partir de `db/schema.ts`.
 * A connection string é lida server-side (env.ts) — nunca hardcoded aqui.
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
  // Nomes de tabela/coluna já são snake_case no schema — sem casing automático.
  verbose: true,
  strict: true,
});
