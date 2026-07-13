/**
 * @os/scaffolder — CLI do "Criador de OS" (Fase 4).
 *
 * Uso (a partir da raiz do monorepo):
 *   pnpm create-client                              # wizard interativo
 *   pnpm create-client -- --config cliente.json     # não-interativo (a partir de JSON)
 *   pnpm create-client -- --config cliente.json --dry-run   # valida sem escrever
 *   pnpm create-client -- validate apps/cliente-x   # valida o manifesto de um app
 *
 * O `--` separa as flags do wrapper do pnpm. Sob tsx: `tsx src/index.ts <args>`.
 */

import { readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname } from 'node:path';
import { validateManifest } from '../../core/src/manifest/schema';
import { normalizeAnswers } from './answers';
import { generateApp } from './generate';
import { runWizard } from './prompts';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..'); // packages/scaffolder/src → raiz
const invokeCwd = process.env.INIT_CWD || process.cwd();

function resolveInput(p: string): string {
  return isAbsolute(p) ? p : resolve(invokeCwd, p);
}

function getFlag(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
  return undefined;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);

  // --- Subcomando: validate ---
  if (argv[0] === 'validate') {
    const target = argv[1];
    if (!target) throw new Error('uso: validate <apps/cliente | caminho/para/manifest.ts>');
    await validateCommand(resolveInput(target));
    return;
  }

  // --- Criar app ---
  const configPath = getFlag(argv, '--config') ?? getFlag(argv, '-c');
  const dryRun = argv.includes('--dry-run');
  const force = argv.includes('--force');

  const raw = configPath
    ? JSON.parse(readFileSync(resolveInput(configPath), 'utf8'))
    : await runWizard();

  const answers = normalizeAnswers(raw);

  if (dryRun) {
    // Só valida (o generate valida o manifesto ao construir) sem tocar no disco.
    const { buildManifest } = await import('./manifest');
    const built = buildManifest(answers);
    console.log(`✓ manifesto válido — ${answers.slug} (preset ${answers.preset}, ${built.views.length} view(s), ${answers.menus.length} menu(s)).`);
    return;
  }

  const result = generateApp(answers, repoRoot, { force });

  console.log(`\n✓ Gerado apps/${answers.slug} (preset ${result.preset}) — ${result.files.length} arquivo(s), ${result.views} view(s).`);
  printNextSteps(answers.slug, result.preset);
}

async function validateCommand(target: string): Promise<void> {
  // Aceita um diretório de app (usa src/manifest.ts) ou o caminho direto do .ts.
  const manifestPath = target.endsWith('.ts') ? target : resolve(target, 'src', 'manifest.ts');
  const mod = (await import(pathToFileURL(manifestPath).href)) as Record<string, unknown>;
  const candidate = Object.values(mod).find(
    (v) => v && typeof v === 'object' && (v as { version?: unknown }).version === 1 && 'identity' in (v as object),
  );
  if (!candidate) {
    throw new Error(`nenhum manifesto exportado encontrado em ${manifestPath}.`);
  }
  validateManifest(candidate);
  console.log(`✓ manifesto válido: ${manifestPath}`);
}

function printNextSteps(slug: string, preset: 'static' | 'full'): void {
  console.log('\nPróximos passos:');
  console.log('  pnpm install                       # linka o novo workspace + instala deps');
  if (preset === 'static') {
    console.log(`  pnpm -C apps/${slug} dev           # http://localhost:5173`);
  } else {
    console.log(`  # crie o projeto Neon, preencha apps/${slug}/.env (ver README), então:`);
    console.log(`  pnpm -C apps/${slug} db:generate && pnpm -C apps/${slug} db:migrate`);
    console.log(`  pnpm -C apps/${slug} db:provision-roles && pnpm -C apps/${slug} auth:create-user`);
    console.log(`  pnpm -C apps/${slug} dev           # API 8787 + Vite 5173`);
  }
  console.log(`\nDetalhes completos em apps/${slug}/README.md`);
}

main().catch((err) => {
  console.error(`\n✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
