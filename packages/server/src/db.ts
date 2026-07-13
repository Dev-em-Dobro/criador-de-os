/**
 * @os/server — tipo do banco injetado. As capacidades não abrem conexão: o app
 * passa o seu client Drizzle (role de runtime, 1 Neon por cliente). Tipo
 * permissivo para aceitar o client do app (que tem o schema compartilhado + as
 * tabelas do próprio negócio).
 */

import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';

export type ServerDb = NeonHttpDatabase<Record<string, unknown>>;
