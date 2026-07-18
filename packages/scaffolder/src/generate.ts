/**
 * @os/scaffolder — orquestra a ESCRITA do app `apps/<slug>` a partir das
 * respostas. Constrói+valida o manifesto (fail-fast), depois materializa os
 * arquivos do preset. Não lê o terminal (o CLI faz isso).
 */

import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { buildManifest } from './manifest';
import type { ClientAnswers } from './types';
import { derivePalette } from './util';
import {
  drizzleConfig,
  envExample,
  frontPackageJson,
  indexCss,
  indexHtml,
  logoSvg,
  mainTsx,
  registryTs,
  tsconfigApp,
  tsconfigNode,
  viteConfig,
} from './templates-front';
import {
  apiApp,
  apiAuth,
  apiCreateUser,
  apiEnv,
  apiQueryAllowlist,
  apiQueryBuilder,
  apiServer,
} from './templates-api';
import {
  dbClient,
  dbGrantsSql,
  dbMigrate,
  dbProvisionRoles,
  dbSchema,
  dbVerifyGrants,
  dbViewsSql,
} from './templates-db';
import { appReadme } from './templates-readme';
import { securityReport } from './templates-security';

export interface GenerateResult {
  appDir: string;
  files: string[];
  views: number;
  preset: ClientAnswers['preset'];
  /** Caminho (relativo à raiz) do relatório de segurança gerado para este OS. */
  securityReport: string;
}

/**
 * Gera o app. Lança se `apps/<slug>` já existe e não está vazio (a menos que
 * `force`). Retorna o resumo do que foi escrito.
 */
export function generateApp(
  answers: ClientAnswers,
  repoRoot: string,
  opts: { force?: boolean } = {},
): GenerateResult {
  const appDir = resolve(repoRoot, 'apps', answers.slug);

  if (existsSync(appDir) && readdirSync(appDir).length > 0 && !opts.force) {
    throw new Error(
      `apps/${answers.slug} já existe e não está vazio. Escolha outro slug ou remova a pasta ` +
        `(o scaffolder não sobrescreve trabalho existente).`,
    );
  }

  // Constrói + VALIDA o manifesto antes de escrever qualquer arquivo (fail-fast).
  const built = buildManifest(answers);
  const isFull = answers.preset === 'full';
  const files: string[] = [];

  const write = (rel: string, content: string): void => {
    const abs = resolve(appDir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
    files.push(`apps/${answers.slug}/${rel}`);
  };

  const productName = answers.productName ?? `${answers.displayName} OS`;
  const palette = derivePalette(answers.theme.brand, answers.theme.signal);

  // Relatório de segurança (trilha de auditoria) — na RAIZ do monorepo, fora de
  // apps/<slug>. Emitido para AMBOS os presets: o conteúdo reflete o preset (full
  // lista as camadas de banco/API; static deixa explícito que elas não existem).
  const securityReportRel = `security-reports/${answers.slug}.md`;
  const writeSecurityReport = (): void => {
    const abs = resolve(repoRoot, securityReportRel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, securityReport(answers, built.views), 'utf8');
  };

  // ---- Comum (front) ----
  write('package.json', frontPackageJson(answers.slug, answers.preset, productName));
  write('index.html', indexHtml(productName));
  write('vite.config.ts', viteConfig(answers.preset));
  write('tsconfig.json', tsconfigApp(answers.preset));
  write('README.md', appReadme(answers));
  write('src/manifest.ts', built.source);
  write('src/main.tsx', mainTsx(built.exportName, answers.preset));
  write('src/registry.ts', registryTs());
  write('src/index.css', indexCss());
  write('src/blocks/.gitkeep', '');
  write('public/logo.svg', logoSvg(answers.displayName, palette.brand));

  if (!isFull) {
    writeSecurityReport();
    return {
      appDir,
      files,
      views: built.views.length,
      preset: answers.preset,
      securityReport: securityReportRel,
    };
  }

  // ---- Full: config extra + api/ + db/ ----
  write('tsconfig.node.json', tsconfigNode());
  write('drizzle.config.ts', drizzleConfig());
  write('.env.example', envExample(answers.slug));

  write('api/env.ts', apiEnv(answers.slug));
  write('api/auth.ts', apiAuth(answers.slug));
  write('api/query-builder.ts', apiQueryBuilder());
  write('api/query-allowlist.ts', apiQueryAllowlist(built.views));
  write('api/app.ts', apiApp(answers.slug));
  write('api/server.ts', apiServer(answers.slug));
  write('api/scripts/create-user.ts', apiCreateUser(answers.slug, answers.displayName));

  write('db/client.ts', dbClient(answers.slug));
  write('db/schema.ts', dbSchema(answers.slug, built.views));
  write('db/migrate.ts', dbMigrate(answers.slug));
  write('db/views.sql', dbViewsSql(built.views));
  write('db/grants.sql', dbGrantsSql(built.views));
  write('db/provision-roles.ts', dbProvisionRoles(answers.slug, built.views));
  write('db/verify-grants.ts', dbVerifyGrants(answers.slug, built.views));

  writeSecurityReport();

  return {
    appDir,
    files,
    views: built.views.length,
    preset: answers.preset,
    securityReport: securityReportRel,
  };
}
