/**
 * @os/scaffolder — constrói o objeto do manifesto a partir das respostas,
 * VALIDA com o zod real do core (fail-fast) e serializa para `src/manifest.ts`.
 *
 * Importa o validador por caminho de arquivo direto (`../../core/src/...`) de
 * propósito: assim `tsx` carrega SÓ o schema + zod (leves), sem puxar o barrel
 * React/CSS do core. É a garantia do critério §7 do doc 06 ("manifesto gerado
 * passa na validação zod") — por construção, todo app nasce com manifesto válido.
 */

import { validateManifest } from '../../core/src/manifest/schema';
import { buildMenu, DEFAULT_ICON, type ViewSpec } from './blocks';
import type { ClientAnswers } from './types';
import { derivePalette, serializeToTs, toCamel } from './util';

export interface BuiltManifest {
  /** Objeto do manifesto já validado. */
  manifest: Record<string, unknown>;
  /** Código-fonte do arquivo `src/manifest.ts`. */
  source: string;
  /** Views a materializar no banco (preset full). Vazio no preset static. */
  views: ViewSpec[];
  /** Nome da const exportada, ex.: `clienteExemploManifest`. */
  exportName: string;
}

/**
 * Monta + valida + serializa o manifesto. Lança `ManifestValidationError`
 * (do core) se algo ficou inválido — o CLI traduz para mensagem amigável.
 */
export function buildManifest(answers: ClientAnswers): BuiltManifest {
  const preset = answers.preset;
  const authEnabled = preset === 'full' ? answers.auth : false;
  const periodEnabled = answers.period.enabled;
  const palette = derivePalette(answers.theme.brand, answers.theme.signal);

  const views: ViewSpec[] = [];
  const menus = answers.menus.map((m) => {
    const built = buildMenu(m, preset, periodEnabled);
    if (built.viewSpec) views.push(built.viewSpec);
    return {
      key: m.key,
      label: m.label,
      icon: m.icon ?? DEFAULT_ICON[m.block],
      route: `/${m.key}`,
      view: built.binding,
    };
  });

  const settings: Record<string, unknown> = {
    auth: authEnabled
      ? {
          enabled: true,
          provider: 'better-auth',
          ...(answers.allowedDomain ? { allowedDomains: [answers.allowedDomain] } : {}),
        }
      : { enabled: false, provider: 'better-auth' },
  };
  if (periodEnabled) {
    settings.period = {
      enabled: true,
      default: answers.period.default,
      options: answers.period.options,
    };
  }
  if (answers.footerText) settings.footerText = answers.footerText;

  const manifest = {
    version: 1,
    identity: {
      clientId: answers.slug,
      displayName: answers.displayName,
      productName: answers.productName ?? `${answers.displayName} OS`,
      logoUrl: '/logo.svg',
      theme: palette,
    },
    dataApi: { baseUrl: '', queryPath: '/api/query', authPath: '/api/auth' },
    navigation: { redirectRoot: `/${answers.menus[0].key}`, menus },
    settings,
  };

  // GATE (doc 06, §7): fail-fast se o manifesto gerado não passar no schema.
  validateManifest(manifest);

  const exportName = `${toCamel(answers.slug)}Manifest`;
  return { manifest, source: renderManifestSource(exportName, manifest), views, exportName };
}

function renderManifestSource(exportName: string, manifest: unknown): string {
  return `/**
 * Manifesto gerado pelo @os/scaffolder (Fase 4) — fonte única da navegação,
 * marca e dados deste cliente. NENHUM código React descreve as telas: menus,
 * blocos e dados são tudo config aqui.
 *
 * Passou na validação zod do core no momento da geração. Edite livremente
 * (KPIs, colunas, textos, views) — o app revalida no boot (fail-fast).
 */

import type { ClientManifest } from '@os/core';

export const ${exportName}: ClientManifest = ${serializeToTs(manifest)};
`;
}
