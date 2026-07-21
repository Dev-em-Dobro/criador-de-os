/**
 * apps/dobro — configuração do Better Auth (doc 05, §5).
 *
 * Email + senha (o operador cria os usuários). Adapter Drizzle (provider "pg")
 * apontando ao Neon do cliente — os usuários vivem no banco do próprio cliente
 * (isolamento). O segredo que assina as sessões (`BETTER_AUTH_SECRET`) é
 * server-side; nunca vai ao bundle.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { dbAuth, schema } from '../db/client';
import { getAuthSecret, getAuthUrl } from './env';

export const auth = betterAuth({
  secret: getAuthSecret(),
  baseURL: getAuthUrl(),
  // A API vive atrás do proxy do Vite em /api/auth (basePath do handler abaixo).
  basePath: '/api/auth',
  // `dbAuth` = role `app_auth` (R/W só nas tabelas de auth) — nunca lê negócio.
  database: drizzleAdapter(dbAuth, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    // Sem verificação de email neste piloto (o operador provisiona usuários).
    requireEmailVerification: false,
  },
  // Confia na origem do dev (Vite em 5173) para os cookies de sessão.
  trustedOrigins: [getAuthUrl()],
});

export type Auth = typeof auth;
