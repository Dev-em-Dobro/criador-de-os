/**
 * apps/dobro — construção SEGURA de SQL para /api/query (doc 05, §4, Defesa 3).
 *
 * Regras inegociáveis:
 *  - VIEW e COLUNAS são IDENTIFICADORES → não podem ser bind params. Por isso
 *    passam pela allowlist (query-allowlist.ts): só nomes conhecidos entram, e
 *    são citados via `sql.identifier(...)` (Drizzle escapa/quota), NUNCA
 *    interpolados como string crua.
 *  - VALORES (where[].value, limit) → SEMPRE bind params ($1, $2...) via o
 *    template `sql` do Drizzle. Nunca concatenados.
 *  - `op` (operador) e `dir` (ordem) → validados contra conjuntos FECHADOS.
 *  - `limit` → coerção numérica + teto (MAX_LIMIT) para evitar exfiltração.
 *
 * A função lança `QueryValidationError` com um `status` HTTP quando a requisição
 * viola a allowlist (403 view / 400 coluna|op|dir). O handler traduz isso.
 */

import { sql, type SQL } from 'drizzle-orm';
import { getAllowedView, isKnownColumn, type AllowedView } from './query-allowlist';

/** Conjunto FECHADO de operadores aceitos (espelha FilterOp do core). */
const ALLOWED_OPS = ['=', '!=', '>', '>=', '<', '<=', 'in', 'like'] as const;
type AllowedOp = (typeof ALLOWED_OPS)[number];

/** Teto de linhas — evita exfiltração em massa (doc 05, §4.2). */
const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;

/** Erro de validação com o status HTTP que o handler deve retornar. */
export class QueryValidationError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'QueryValidationError';
    this.status = status;
  }
}

/** Forma declarativa recebida no body de /api/query (o dataSource do manifesto). */
export interface QueryRequest {
  view?: string;
  table?: string;
  select?: string[];
  where?: Array<{ field: string; op: string; value: unknown }>;
  orderBy?: Array<{ field: string; dir: string }>;
  limit?: number;
}

/** Variáveis do shell que resolvem refs `{ ref: 'period' }` → bind param. */
export interface QueryVars {
  period: string;
  clientId: string;
}

/** Resolve `{ ref: 'period' | 'clientId' }` para o valor concreto (vira bind). */
function resolveValue(value: unknown, vars: QueryVars): unknown {
  if (value && typeof value === 'object' && 'ref' in value) {
    const ref = (value as { ref: string }).ref;
    if (ref === 'period') return vars.period;
    if (ref === 'clientId') return vars.clientId;
    throw new QueryValidationError(`ref desconhecida: "${ref}"`, 400);
  }
  return value;
}

function assertOp(op: string): AllowedOp {
  if (!(ALLOWED_OPS as readonly string[]).includes(op)) {
    throw new QueryValidationError(`operador não permitido: "${op}"`, 400);
  }
  return op as AllowedOp;
}

function assertDir(dir: string): 'asc' | 'desc' {
  if (dir !== 'asc' && dir !== 'desc') {
    throw new QueryValidationError(`direção inválida: "${dir}"`, 400);
  }
  return dir;
}

function assertColumn(view: AllowedView, field: string): string {
  if (!isKnownColumn(view, field)) {
    throw new QueryValidationError(
      `coluna "${field}" não é conhecida da view "${view.view}"`,
      400,
    );
  }
  return field;
}

/**
 * Valida a requisição contra a allowlist e monta um `SQL` PARAMETRIZADO.
 *
 * - view fora da allowlist (ou tabela crua) → 403 (fail-closed).
 * - coluna/op/dir inválidos → 400.
 * - identificadores via `sql.identifier` (nunca string crua); valores via bind.
 */
export function buildSecureQuery(req: QueryRequest, vars: QueryVars): SQL {
  // Defesa 2: só VIEWS da allowlist. Referenciar `table` crua é sempre negado.
  if (req.table) {
    throw new QueryValidationError(
      'leitura de tabela crua não é permitida — use uma view da allowlist',
      403,
    );
  }
  const allowed = getAllowedView(req.view);
  if (!allowed) {
    throw new QueryValidationError(
      `view "${req.view ?? '(ausente)'}" não está na allowlist`,
      403,
    );
  }

  // SELECT: colunas conhecidas da view (ou todas as colunas conhecidas se omitido).
  const selectCols =
    req.select && req.select.length > 0
      ? req.select.map((c) => assertColumn(allowed, c))
      : [...allowed.columns];
  const selectSql = sql.join(
    selectCols.map((c) => sql.identifier(c)),
    sql`, `,
  );

  // FROM: a view (identificador validado pela allowlist).
  let query = sql`SELECT ${selectSql} FROM ${sql.identifier(allowed.view)}`;

  // WHERE: cada cláusula → coluna validada + op fechado + VALOR como bind param.
  if (req.where && req.where.length > 0) {
    const conditions = req.where.map((clause) => {
      const col = assertColumn(allowed, clause.field);
      const op = assertOp(clause.op);
      const value = resolveValue(clause.value, vars);

      if (op === 'in') {
        if (!Array.isArray(value)) {
          throw new QueryValidationError("operador 'in' exige um array", 400);
        }
        const list = sql.join(
          value.map((v) => sql`${v}`),
          sql`, `,
        );
        return sql`${sql.identifier(col)} IN (${list})`;
      }

      // `op` vem de um conjunto fechado → seguro concatenar como texto SQL cru.
      // O VALOR (`${value}`) é sempre bind param.
      return sql`${sql.identifier(col)} ${sql.raw(op)} ${value}`;
    });
    query = sql`${query} WHERE ${sql.join(conditions, sql` AND `)}`;
  }

  // ORDER BY: colunas validadas + direção fechada.
  if (req.orderBy && req.orderBy.length > 0) {
    const orders = req.orderBy.map((o) => {
      const col = assertColumn(allowed, o.field);
      const dir = assertDir(o.dir);
      return sql`${sql.identifier(col)} ${sql.raw(dir.toUpperCase())}`;
    });
    query = sql`${query} ORDER BY ${sql.join(orders, sql`, `)}`;
  }

  // LIMIT: coerção numérica + teto. Valor vai como bind param.
  const rawLimit = Number(req.limit);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.min(Math.floor(rawLimit), MAX_LIMIT)
      : DEFAULT_LIMIT;
  query = sql`${query} LIMIT ${limit}`;

  return query;
}
