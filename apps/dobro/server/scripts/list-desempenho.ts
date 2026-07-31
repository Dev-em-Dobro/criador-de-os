/**
 * Lista o histórico medido em `conteudo_desempenho` (o que alimenta a Análise).
 * Uso:  npx tsx apps/dobro/server/scripts/list-desempenho.ts
 */

import { desc } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { conteudoDesempenho } from '../../db/schema.js';

function fmt(d: Date | null): string {
  if (!d) return '—        ';
  return d.toISOString().slice(0, 10);
}
function n(v: number | null): string {
  return v == null ? '·' : String(v);
}

const rows = await db.select().from(conteudoDesempenho).orderBy(desc(conteudoDesempenho.data));

console.log(`\nTotal de medições: ${rows.length}\n`);
if (rows.length === 0) {
  console.log('(vazio — a seção Análise mostraria "Nenhuma medição ainda")');
} else {
  const porFormato: Record<string, number> = {};
  let comAlcance = 0;
  console.log('data       | formato    | alc   | salv | comp | com | seg | tema');
  console.log('-'.repeat(90));
  for (const r of rows) {
    porFormato[r.formato] = (porFormato[r.formato] ?? 0) + 1;
    if (r.alcance != null && r.alcance > 0) comAlcance++;
    const tema = (r.tema ?? '').slice(0, 34);
    console.log(
      `${fmt(r.data)} | ${(r.formato ?? '').padEnd(10)} | ${n(r.alcance).padStart(5)} | ${n(r.salvamentos).padStart(4)} | ${n(r.compartilhamentos).padStart(4)} | ${n(r.comentarios).padStart(3)} | ${n(r.seguidores).padStart(3)} | ${tema}`,
    );
  }
  console.log('-'.repeat(90));
  console.log(`Por formato: ${Object.entries(porFormato).map(([f, c]) => `${f}=${c}`).join(' · ')}`);
  console.log(`Com alcance (entram no ranking): ${comAlcance}/${rows.length}`);
}
process.exit(0);
