/**
 * @os/core — Schemas zod do `ClientManifest` + `validateManifest` (fail-fast).
 *
 * Espelha 1:1 os tipos de `manifest/types.ts`. O manifesto é validado no LOAD
 * (boot do app): manifesto malformado falha CEDO e com mensagem CLARA — não com
 * tela branca. Isso importa porque quem edita manifestos é o operador (não-dev).
 *
 * A mensagem de erro é montada com o PATH legível do campo problemático
 * (ex.: `navigation.menus[0].view.block`) para orientar o operador.
 */

import { z } from 'zod';
import type { ClientManifest } from './types';

// ============================================================
// Tema / Identidade
// ============================================================

// Espelha `Theme` (theme/types.ts): todos os campos opcionais (herdam default).
const themeSchema = z
  .object({
    brand: z.string().optional(),
    brandBright: z.string().optional(),
    brandSoft: z.string().optional(),
    brandStrong: z.string().optional(),
    brandDeep: z.string().optional(),
    signal: z.string().optional(),
    background: z.string().optional(),
  })
  .strict();

const identitySchema = z
  .object({
    clientId: z.string().min(1, 'clientId não pode ser vazio'),
    displayName: z.string().min(1, 'displayName não pode ser vazio'),
    productName: z.string().min(1, 'productName não pode ser vazio'),
    logoUrl: z.string(),
    theme: themeSchema,
  })
  .strict();

// ============================================================
// Data API
// ============================================================

const dataApiSchema = z
  .object({
    baseUrl: z.string(),
    queryPath: z.string().optional(),
    authPath: z.string().optional(),
  })
  .strict();

// ============================================================
// DataSource
// ============================================================

const filterOpSchema = z.enum(['=', '!=', '>', '>=', '<', '<=', 'in', 'like']);

// value pode ser literal (unknown) OU uma ref a estado do shell ({ ref: '...' }).
const filterValueSchema = z.union([
  z.object({ ref: z.string().min(1) }).strict(),
  z.unknown(),
]);

const filterClauseSchema = z
  .object({
    field: z.string().min(1),
    op: filterOpSchema,
    value: filterValueSchema,
  })
  .strict();

const orderByClauseSchema = z
  .object({
    field: z.string().min(1),
    dir: z.enum(['asc', 'desc']),
  })
  .strict();

const aggregateClauseSchema = z
  .object({
    fn: z.enum(['sum', 'count', 'avg', 'min', 'max']),
    field: z.string().min(1),
    as: z.string().min(1),
  })
  .strict();

const refetchPolicySchema = z
  .object({
    mode: z.enum(['manual', 'interval']),
    ms: z.number().int().positive().optional(),
  })
  .strict();

const dataSourceSchema = z
  .object({
    kind: z.enum(['query', 'rest', 'static']),

    // query
    view: z.string().optional(),
    table: z.string().optional(),
    select: z.array(z.string()).optional(),
    where: z.array(filterClauseSchema).optional(),
    orderBy: z.array(orderByClauseSchema).optional(),
    limit: z.number().int().positive().optional(),
    aggregate: z.array(aggregateClauseSchema).optional(),
    groupBy: z.array(z.string()).optional(),

    // rest
    url: z.string().optional(),

    // static
    data: z.unknown().optional(),

    refetch: refetchPolicySchema.optional(),
    mapper: z.string().optional(),
  })
  .strict()
  // Regras cruzadas por `kind`: garante que o binding tem o mínimo necessário
  // para ser resolvido — falha cedo se um operador esquecer o essencial.
  .superRefine((ds, ctx) => {
    if (ds.kind === 'query' && !ds.view && !ds.table) {
      ctx.addIssue({
        code: 'custom',
        message: "dataSource kind 'query' exige 'view' ou 'table'",
        path: ['view'],
      });
    }
    if (ds.kind === 'rest' && !ds.url) {
      ctx.addIssue({
        code: 'custom',
        message: "dataSource kind 'rest' exige 'url'",
        path: ['url'],
      });
    }
    if (ds.kind === 'static' && ds.data === undefined) {
      ctx.addIssue({
        code: 'custom',
        message: "dataSource kind 'static' exige 'data' (dados embutidos)",
        path: ['data'],
      });
    }
  });

// ============================================================
// Binding / Navegação
// ============================================================

const blockTypeSchema = z
  .string()
  .min(1, 'block não pode ser vazio')
  .refine(
    (v) =>
      [
        'kpi-dashboard',
        'data-table',
        'kanban-board',
        'funnel',
        'timeline',
        'doc-viewer',
        'metric-comparison',
        'settings-panel',
        'lead-console',
        'invoice-console',
      ].includes(v) || v.startsWith('custom:'),
    { message: 'block deve ser um tipo conhecido ou começar com "custom:"' },
  );

const sectionHelpSchema = z
  .object({
    description: z.string().optional(),
    tutorial: z
      .object({
        title: z.string().optional(),
        steps: z.array(z.string()).min(1, 'tutorial precisa de ao menos 1 passo'),
      })
      .strict()
      .optional(),
  })
  .strict();

const blockBindingSchema = z
  .object({
    block: blockTypeSchema,
    title: z.string().optional(),
    subtitle: z.string().optional(),
    config: z.record(z.string(), z.unknown()),
    dataSource: dataSourceSchema.optional(),
    help: sectionHelpSchema.optional(),
  })
  .strict();

const subTabSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    icon: z.string().min(1),
    view: blockBindingSchema,
  })
  .strict();

const menuItemSchema = z
  .object({
    key: z.string().min(1),
    label: z.string().min(1),
    icon: z.string().min(1),
    route: z.string().min(1),
    view: blockBindingSchema.optional(),
    tabs: z.array(subTabSchema).optional(),
  })
  .strict()
  // Um menu é OU folha (`view`) OU grupo (`tabs`), nunca ambos nem nenhum.
  .superRefine((m, ctx) => {
    const hasView = m.view != null;
    const hasTabs = m.tabs != null && m.tabs.length > 0;
    if (!hasView && !hasTabs) {
      ctx.addIssue({
        code: 'custom',
        message: "menu precisa de 'view' (folha) OU 'tabs' (grupo com sub-abas)",
        path: ['view'],
      });
    }
    if (hasView && hasTabs) {
      ctx.addIssue({
        code: 'custom',
        message: "menu não pode ter 'view' e 'tabs' ao mesmo tempo — escolha um",
        path: ['tabs'],
      });
    }
  });

const navigationSchema = z
  .object({
    redirectRoot: z.string().min(1, 'redirectRoot não pode ser vazio'),
    menus: z.array(menuItemSchema).min(1, 'navigation precisa de ao menos 1 menu'),
  })
  .strict();

// ============================================================
// Settings
// ============================================================

const periodSchema = z.enum(['weekly', 'monthly', 'quarterly']);

const settingsSchema = z
  .object({
    auth: z
      .object({
        enabled: z.boolean(),
        provider: z.literal('better-auth'),
        allowedDomains: z.array(z.string()).optional(),
      })
      .strict(),
    period: z
      .object({
        enabled: z.boolean(),
        default: periodSchema,
        options: z.array(periodSchema).optional(),
      })
      .strict()
      .optional(),
    footerText: z.string().optional(),
  })
  .strict();

// ============================================================
// Manifesto completo
// ============================================================

export const clientManifestSchema = z
  .object({
    version: z.literal(1),
    identity: identitySchema,
    dataApi: dataApiSchema,
    navigation: navigationSchema,
    settings: settingsSchema,
  })
  .strict();

// ============================================================
// validateManifest — fail-fast com mensagem clara
// ============================================================

/** Erro lançado quando um manifesto não passa na validação zod. */
export class ManifestValidationError extends Error {
  /** Lista de problemas legíveis (path + mensagem), um por linha. */
  readonly issues: string[];

  constructor(issues: string[]) {
    super(
      `Manifesto inválido — corrija ${issues.length} problema(s):\n` +
        issues.map((i) => `  • ${i}`).join('\n'),
    );
    this.name = 'ManifestValidationError';
    this.issues = issues;
  }
}

/**
 * Formata o `path` de um issue do zod em algo legível para um operador não-dev.
 * Ex.: `['navigation','menus',0,'view','block']` → `navigation.menus[0].view.block`.
 */
function formatPath(path: ReadonlyArray<PropertyKey>): string {
  if (path.length === 0) return '(raiz)';
  return path.reduce<string>((acc, seg) => {
    if (typeof seg === 'number') return `${acc}[${seg}]`;
    return acc ? `${acc}.${String(seg)}` : String(seg);
  }, '');
}

/**
 * Valida um manifesto desconhecido contra o schema e o devolve TIPADO.
 *
 * Fail-fast: se inválido, lança `ManifestValidationError` com uma mensagem que
 * lista cada campo problemático pelo caminho legível — para o operador corrigir
 * o manifesto sem precisar ler stack trace de zod.
 */
export function validateManifest(input: unknown): ClientManifest {
  const result = clientManifestSchema.safeParse(input);
  if (result.success) {
    // O schema espelha os tipos; o cast estreita para a união literal de version/kind.
    return result.data as ClientManifest;
  }

  const issues = result.error.issues.map((issue) => `${formatPath(issue.path)}: ${issue.message}`);
  throw new ManifestValidationError(issues);
}
