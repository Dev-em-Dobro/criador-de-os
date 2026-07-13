/**
 * apps/neurovida — Better Auth (email + senha, adapter Drizzle sobre o Neon).
 * O cliente loga no OS antes de operar. O segredo (`BETTER_AUTH_SECRET`) é
 * server-side; nunca vai ao bundle. `dbAuth` = role `app_auth`.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { dbAuth, schema } from '../db/client';
import { getAuthSecret, getAuthUrl } from './env';

export const auth = betterAuth({
  secret: getAuthSecret(),
  baseURL: getAuthUrl(),
  basePath: '/api/auth',
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
    requireEmailVerification: false,
  },
  trustedOrigins: [getAuthUrl()],
});

export type Auth = typeof auth;
