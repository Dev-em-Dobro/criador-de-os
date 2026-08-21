/**
 * apps/dobro — GATE: pega import sem extensão `.js` na cadeia da Vercel Function.
 *
 * POR QUE EXISTE (20/08/2026). A function (`api/index.ts`) é buildada pela Vercel
 * como ESM **nodenext**, que exige extensão explícita em todo import relativo. O
 * `pnpm typecheck` local usa `moduleResolution: bundler`, onde import sem extensão
 * é perfeitamente válido. Resultado: o erro passa no typecheck, passa no build do
 * front, e só aparece em produção como `ERR_MODULE_NOT_FOUND` na primeira
 * requisição que toca aquele módulo.
 *
 * Isso já mordeu três vezes. Na terceira (o `shared/carrossel-dossie.ts`), só não
 * derrubou a geração de rascunho porque o import era de TIPO e some na compilação.
 * Da próxima pode ser um valor, e aí a rota morre.
 *
 * O QUE ELE FAZ: roda o tsc com a resolução da Vercel (`tsconfig.vercel.json`) e
 * falha SÓ nos erros de extensão faltando (TS2835 e TS2834). Os outros erros são
 * ignorados de propósito: a cadeia tem um TS2305 cosmético conhecido em
 * `server/auth.ts` (o `drizzleAdapter` existe em runtime e só o tipo não está
 * exportado na versão do better-auth), e um gate que falha sempre é um gate que
 * todo mundo aprende a ignorar.
 *
 * Uso: `pnpm --filter @app/dobro check:function`
 */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '../..');

/** Os dois erros que significam "faltou a extensão no import relativo". */
const ERROS_DE_EXTENSAO = /error TS(2835|2834):/;

const res = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['tsc', '-p', 'tsconfig.vercel.json', '--noEmit', '--pretty', 'false'],
  { cwd: appRoot, encoding: 'utf8', shell: process.platform === 'win32' },
);

const saida = `${res.stdout ?? ''}${res.stderr ?? ''}`;
const problemas = saida
  .split('\n')
  .map((l) => l.trim())
  .filter((l) => ERROS_DE_EXTENSAO.test(l));

if (problemas.length) {
  console.error('\n❌ Import sem extensão `.js` na cadeia da Vercel Function:\n');
  for (const p of problemas) console.error(`   ${p}`);
  console.error(
    '\nA function builda como ESM nodenext e quebra em produção com ERR_MODULE_NOT_FOUND.',
  );
  console.error('Conserto: acrescente `.js` ao import relativo (mesmo quando o arquivo é .ts).\n');
  process.exit(1);
}

console.log('✅ Cadeia da function: todo import relativo tem extensão `.js`.');
