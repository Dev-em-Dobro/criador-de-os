/**
 * apps/dobro — a DESCRIÇÃO pronta do Instagram (o texto que o social media cola).
 *
 * Regra da casa: toda descrição começa com a linha de follow. Ela mora AQUI, e não
 * dentro da legenda de cada post, por dois motivos:
 *  - a legenda no banco continua sendo só o conteúdo, então nada duplica quando o
 *    post é reprocessado ou a legenda é reescrita;
 *  - se um dia a frase mudar, muda num lugar só e vale pra todos os posts, os
 *    antigos inclusive.
 *
 * O que sai daqui é o texto FINAL: linha de follow, legenda e hashtags com "#".
 */

/** Primeira linha de toda descrição. Decisão do dono, 05/08/2026. */
export const LINHA_FOLLOW = 'Segue @devemdobro pra aprender a usar IA do jeito certo.';

/** "a b c" ou "#a #b" → "#a #b #c" (aceita o que já vier com #). */
function formatarHashtags(hashtags: string | string[] | null | undefined): string {
  const lista = Array.isArray(hashtags)
    ? hashtags
    : String(hashtags ?? '')
        .split(/[\s,]+/)
        .filter(Boolean);
  return lista
    .map((h) => `#${String(h).trim().replace(/^#+/, '')}`)
    .filter((h) => h.length > 1)
    .join(' ');
}

/**
 * Monta a descrição pronta pro Instagram.
 *
 * Se a legenda JÁ começar com a linha de follow (post antigo, ou alguém colou à
 * mão), ela não é repetida: o resultado tem a linha uma vez só.
 */
export function montarDescricaoInsta(
  legenda: string | null | undefined,
  hashtags: string | string[] | null | undefined,
): string {
  const corpo = String(legenda ?? '').trim();
  const semDuplicar = corpo.startsWith(LINHA_FOLLOW)
    ? corpo.slice(LINHA_FOLLOW.length).trim()
    : corpo;

  const tags = formatarHashtags(hashtags);

  return [LINHA_FOLLOW, semDuplicar, tags].filter(Boolean).join('\n\n');
}
