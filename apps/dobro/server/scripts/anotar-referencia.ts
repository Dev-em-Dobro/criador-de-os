/**
 * apps/dobro — grava À MÃO a transcrição de uma referência (slides ou frames).
 *
 * POR QUE EXISTE (19/08/2026): quem lê os slides do carrossel e os frames do
 * reels e escreve o teardown é o pipeline de IA, e ele depende da
 * ANTHROPIC_API_KEY. Com a chave fora do ar desde 12/08/2026, toda referência
 * capturada parou em `aguardando_slides` com só a LEGENDA no banco. E a legenda
 * é o pedaço fraco: o gancho de um reels mora no texto da tela.
 *
 * Enquanto a chave não volta, o caminho é: `conteudo:capturar-slides` (ou
 * `conteudo:capturar-reels`) baixa as imagens, o Claude Code lê com visão, e
 * este script grava o que foi lido no lugar certo do banco. Assim a leitura fica
 * registrada e a estrategista para de decidir pela legenda.
 *
 * Uso (de dentro de apps/dobro):
 *   npx tsx server/scripts/anotar-referencia.ts <id-ou-pedaço-da-url> --transcricao "<texto>" [--analise "<texto>"] [--formato carrossel|reels] [--status processada]
 *
 * A transcrição é ACRESCENTADA ao conteúdo bruto, embaixo de um marcador, em vez
 * de substituir: a legenda continua valendo, ela só deixa de ser a única coisa.
 */

import { desc, eq, like } from 'drizzle-orm';
import { db } from '../../db/client';
import { referencias } from '../../db/schema';

const MARCADOR = '[Transcrição lida à mão (slides/frames)]';

function ehUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

/** Lê `--chave valor` da linha de comando. */
function flag(nome: string): string | undefined {
  const i = process.argv.indexOf(`--${nome}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function resolverId(alvo: string): Promise<string> {
  if (ehUuid(alvo)) return alvo;
  const achadas = await db
    .select()
    .from(referencias)
    .where(like(referencias.origemUrl, `%${alvo}%`))
    .orderBy(desc(referencias.createdAt));
  if (!achadas.length) throw new Error(`nenhuma referência com "${alvo}" na URL`);
  if (achadas.length > 1) {
    console.error(`[anotar] "${alvo}" casou com ${achadas.length} referências. Rode de novo com o id:`);
    for (const r of achadas) console.error(`  · ${r.id}  [${r.status}]  ${r.origemUrl}`);
    process.exit(2);
  }
  return achadas[0]!.id;
}

async function main(): Promise<void> {
  const alvo = process.argv[2];
  const transcricao = flag('transcricao');
  if (!alvo || !transcricao) {
    console.error('uso: anotar-referencia <id-ou-pedaço-da-url> --transcricao "<texto>" [--analise "<texto>"] [--formato carrossel|reels] [--status processada]');
    process.exit(1);
  }

  const id = await resolverId(alvo);
  const [ref] = await db.select().from(referencias).where(eq(referencias.id, id)).limit(1);
  if (!ref) throw new Error(`referência ${id} não existe`);

  // Se já houver uma transcrição nossa lá, ela é SUBSTITUÍDA (reler de novo é
  // corrigir, não duplicar). O que vem antes do marcador, a legenda original,
  // fica intacto.
  const antes = (ref.conteudoBruto ?? '').split(MARCADOR)[0]!.trimEnd();
  const conteudoBruto = `${antes}\n\n${MARCADOR}\n${transcricao}`.trim();

  const analise = flag('analise');
  const formatoRef = flag('formato');
  const status = flag('status');

  await db
    .update(referencias)
    .set({
      conteudoBruto,
      ...(analise ? { analise } : {}),
      ...(formatoRef ? { formatoRef } : {}),
      ...(status ? { status } : {}),
    })
    .where(eq(referencias.id, id));

  console.log(`[anotar] OK — ${id}`);
  console.log(`  url: ${ref.origemUrl}`);
  console.log(`  transcrição: ${transcricao.length} caracteres gravados`);
  if (analise) console.log(`  análise: ${analise.length} caracteres`);
  if (status) console.log(`  status: ${status}`);
}

main().catch((err) => {
  console.error('[anotar] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
