/**
 * apps/dobro — provisiona um usuário via Better Auth (doc 05, §5).
 *
 * Cria o usuário através da API do próprio Better Auth (signUpEmail), garantindo
 * que o hash da senha e as colunas batem com o que o sign-in espera. Idempotente:
 * se o email já existir, apenas reporta e segue.
 *
 * Uso:
 *   pnpm auth:create-user                     # cria admin@dobro.local / senha DEV
 *   pnpm auth:create-user email senha nome    # customizado
 */

import { auth } from '../auth';

const [, , emailArg, passwordArg, nameArg] = process.argv;

const email = emailArg ?? 'admin@dobro.local';
const password = passwordArg ?? 'dobro-dev-2026';
const name = nameArg ?? 'Admin Dobro';

async function main(): Promise<void> {
  try {
    await auth.api.signUpEmail({
      body: { email, password, name },
    });
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
