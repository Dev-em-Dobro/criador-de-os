/**
 * apps/dobro — gera ARTE DE CAPA por IA (OpenAI) a partir de um prompt.
 *
 * Existe porque a capa é o slide que decide o post, e o conceito dela vem do
 * método da casa: olhar as capas das REFERÊNCIAS que estão indo bem e criar a
 * partir delas, nunca do assunto literal do nosso post.
 *
 * O QUE ELE FAZ: chama a API de imagem, salva o PNG cru e já entrega uma versão
 * recortada em 4:5 (1080×1350), que é o formato que o `carrossel:render` espera na
 * `bgImage`. O corte tira do TOPO, porque o prompt padrão da casa pede o assunto
 * nos dois terços de cima e o rodapé escuro e vazio pro título.
 *
 * Uso:
 *   node server/scripts/gerar-capa-ia.cjs <slug> "<prompt>"
 *   node server/scripts/gerar-capa-ia.cjs <slug> --arquivo prompt.txt
 *
 * Saída: server/carrossel/assets/<slug>/capa.png (4:5) e capa-original.png (cru).
 *
 * Requer OPENAI_API_KEY no .env da raiz do monorepo. Só roda LOCAL.
 */
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const { join, resolve } = require('node:path');

const appRoot = resolve(__dirname, '..', '..');
const repoRoot = resolve(appRoot, '..', '..');

/** Lê uma chave do .env sem depender de dotenv (este script é .cjs solto). */
function lerEnv(nome) {
  if (process.env[nome]) return process.env[nome];
  for (const caminho of [join(repoRoot, '.env'), join(appRoot, '.env')]) {
    if (!existsSync(caminho)) continue;
    for (const linha of readFileSync(caminho, 'utf8').split('\n')) {
      const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && m[1] === nome) return m[2].replace(/^["']|["']$/g, '').trim();
    }
  }
  return '';
}

async function main() {
  const slug = process.argv[2];
  let prompt = process.argv[3];
  if (process.argv[3] === '--arquivo') prompt = readFileSync(process.argv[4], 'utf8');

  if (!slug || !prompt) {
    console.error('uso: node server/scripts/gerar-capa-ia.cjs <slug> "<prompt>"');
    console.error('     node server/scripts/gerar-capa-ia.cjs <slug> --arquivo prompt.txt');
    process.exit(1);
  }

  const key = lerEnv('OPENAI_API_KEY');
  if (!key) {
    console.error('[capa-ia] OPENAI_API_KEY não encontrada no .env da raiz.');
    process.exit(1);
  }

  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', slug);
  mkdirSync(outDir, { recursive: true });
  const cru = join(outDir, 'capa-original.png');
  const final = join(outDir, 'capa.png');

  // 1024×1536 é o vertical que a API entrega. Não é 4:5, por isso o corte depois.
  console.log(`[capa-ia] gerando (pode levar até um minuto)...`);
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', quality: 'high', n: 1 }),
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error(`[capa-ia] FALHOU (${res.status}): ${txt.slice(0, 600)}`);
    process.exit(1);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    console.error('[capa-ia] resposta sem imagem:', JSON.stringify(json).slice(0, 400));
    process.exit(1);
  }
  writeFileSync(cru, Buffer.from(b64, 'base64'));
  console.log(`[capa-ia] cru salvo: assets/${slug}/capa-original.png (1024×1536)`);

  // Corte pra 4:5 tirando do TOPO: o prompt da casa põe o assunto nos dois terços
  // de cima e o rodapé vazio pro título, então cortar de baixo comeria justamente
  // o espaço do texto.
  try {
    execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', cru,
      '-vf', 'crop=1024:1280:0:256', final], { stdio: 'inherit' });
    console.log(`[capa-ia] 4:5 pronto: assets/${slug}/capa.png (1024×1280)`);
  } catch {
    console.error('[capa-ia] ffmpeg falhou; use o capa-original.png e corte à mão.');
    process.exit(1);
  }

  console.log(`\nAgora aponte a bgImage do carrossel pra server/carrossel/assets/${slug}/capa.png`);
  console.log(`e rode: pnpm --filter @app/dobro carrossel:render ${slug}`);
}

main().catch((e) => {
  console.error('[capa-ia] erro:', e instanceof Error ? e.message : e);
  process.exit(1);
});
