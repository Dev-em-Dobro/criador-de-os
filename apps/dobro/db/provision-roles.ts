/**
 * apps/dobro — provisiona LOGIN+senha dos roles de menor privilégio e grava as
 * connection strings por papel no .env (Fase 3 — hardening, doc 05, §4/§6).
 *
 * Roda como OWNER (getDatabaseUrl). Para cada role (app_auth, app_query):
 *   1. gera uma senha forte (crypto — hex, URL-safe);
 *   2. ALTER ROLE ... LOGIN PASSWORD (o owner tem CREATEROLE no Neon);
 *   3. monta a connection string trocando SÓ user:senha na URL do owner;
 *   4. testa a conexão REAL do role (prova que o Neon roteia roles criados por SQL);
 *   5. grava/atualiza AUTH_DATABASE_URL / QUERY_DATABASE_URL no .env da raiz.
 *
 * NUNCA imprime senha nem connection string. Pré-requisito: `pnpm db:migrate`
 * (cria os roles + privilégios via grants.sql). Idempotente: re-rodar rotaciona
 * as senhas e reescreve o .env.
 */

import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDatabaseUrl } from '../api/env';

const here = dirname(fileURLToPath(import.meta.url));
// apps/dobro/db → apps/dobro → apps → raiz do monorepo (onde vive o .env canônico).
const repoRoot = resolve(here, '..', '..', '..');
const envPath = resolve(repoRoot, '.env');

interface RoleSpec {
  role: string;
  envVar: string;
  /** Query de fumaça que o role DEVE conseguir rodar (prova a conexão real). */
  smokeTest: string;
}

const ROLES: RoleSpec[] = [
  { role: 'app_auth', envVar: 'AUTH_DATABASE_URL', smokeTest: 'SELECT count(*) FROM "user"' },
  { role: 'app_query', envVar: 'QUERY_DATABASE_URL', smokeTest: 'SELECT count(*) FROM v_visao_geral' },
  { role: 'app_ingest', envVar: 'INGEST_DATABASE_URL', smokeTest: 'SELECT count(*) FROM referencias' },
  { role: 'app_content', envVar: 'CONTENT_DATABASE_URL', smokeTest: 'SELECT count(*) FROM conteudo_posts' },
];

/** Monta a connection string do role trocando SÓ user:senha na URL do owner. */
function buildRoleUrl(ownerUrl: string, role: string, password: string): string {
  const u = new URL(ownerUrl);
  u.username = role;
  u.password = password;
  return u.toString();
}

/** Atualiza (ou insere) `KEY=value` no conteúdo do .env, preservando o resto. */
function upsertEnv(content: string, key: string, value: string): string {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, 'm');
  if (re.test(content)) return content.replace(re, line);
  const sep = content.length > 0 && !content.endsWith('\n') ? '\n' : '';
  return `${content}${sep}${line}\n`;
}

async function main(): Promise<void> {
  const ownerUrl = getDatabaseUrl();
  const owner = neon(ownerUrl);

  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';

  for (const { role, envVar, smokeTest } of ROLES) {
    // 1+2. senha forte (hex → sem @ : / + que quebrariam a URL) + LOGIN.
    // A senha é gerada por nós (não input externo) e só-hex, então interpolá-la
    // no DDL é seguro (ALTER ROLE não aceita bind param para a senha).
    const password = randomBytes(24).toString('hex');
    await owner.query(`ALTER ROLE ${role} LOGIN PASSWORD '${password}'`);

    // 3. connection string do role (mesmo host/db/params do owner).
    const roleUrl = buildRoleUrl(ownerUrl, role, password);

    // 4. teste de conexão REAL — confirma que o Neon roteia o role criado por SQL.
    const roleClient = neon(roleUrl);
    await roleClient.query(smokeTest);

    // 5. grava no .env (o valor NUNCA é impresso).
    envContent = upsertEnv(envContent, envVar, roleUrl);
    console.log(`[provision] ${role}: LOGIN definido · conexão testada ✓ · ${envVar} gravado`);
  }

  writeFileSync(envPath, envContent, 'utf8');
  console.log(`[provision] OK — .env atualizado. Nenhum segredo foi impresso.`);
}

main().catch((err) => {
  console.error('[provision] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
