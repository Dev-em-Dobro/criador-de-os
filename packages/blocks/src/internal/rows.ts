/**
 * @os/blocks/internal — utilitários internos compartilhados pelos blocos.
 *
 * NÃO faz parte da API pública do pacote (não é reexportado no index). São só
 * helpers para tratar `ctx.data` de forma consistente entre blocos. Nada aqui
 * conhece cliente, coleção ou texto de negócio — só a FORMA genérica dos dados.
 */

/** Uma linha genérica de dados resolvida pelo adapter (objeto chave→valor). */
export type Row = Record<string, unknown>;

/**
 * Normaliza `ctx.data` em um array de linhas.
 *
 * O adapter pode entregar: um array de linhas (caso comum de `query`/`static`),
 * uma única linha (objeto), ou `null`/`undefined` (sem dados). Este helper
 * uniformiza tudo em `Row[]`, para o bloco não repetir esse tratamento.
 */
export function asRows(data: unknown): Row[] {
  if (Array.isArray(data)) {
    return data.filter((r): r is Row => r != null && typeof r === 'object');
  }
  if (data != null && typeof data === 'object') {
    return [data as Row];
  }
  return [];
}

/** Coage um valor desconhecido em `number` (ou `undefined` se não numérico). */
export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

/** Coage um valor desconhecido em `string` legível (vazio vira ''). */
export function toText(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}
