/**
 * apps/neurovida — provisiona um usuário via Better Auth (signUpEmail).
 * Idempotente: se o email já existir, apenas reporta.
 *
 * Uso:
 *   pnpm auth:create-user                     # cria o admin default (DEV)
 *   pnpm auth:create-user email senha nome    # customizado
 */

import { auth } from '../auth';

const [, , emailArg, passwordArg, nameArg] = process.argv;

const email = emailArg ?? 'admin@neurovida.local';
const password = passwordArg ?? 'neurovida-dev-2026';
const name = nameArg ?? 'Admin Neurovida';

async function main(): Promise<void> {
  try {
    await auth.api.signUpEmail({ body: { email, password, name } });
    console.log(`[create-user] usuário criado: ${email}`);
    console.log(`[create-user] senha (DEV, não é segredo real): ${password}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/exist|already|unique|duplicate/i.test(msg)) {
      console.log(`[create-user] usuário ${email} já existe — nada a fazer.`);
      return;
    }
    console.error('[create-user] FALHOU:', msg);
    process.exit(1);
  }
}

main();
