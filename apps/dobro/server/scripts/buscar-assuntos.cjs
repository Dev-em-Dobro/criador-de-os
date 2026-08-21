/**
 * apps/dobro — BUSCA ASSUNTOS VALIDADOS no Instagram, pelo termo do nicho.
 *
 * POR QUE ELE EXISTE (20/08/2026): é o passo 1 a 3 do método de pauta validada
 * que o dono trouxe do Cast de Coragem. Em vez de inventar assunto pra sustentar
 * 20 reels por semana, você pesquisa o termo que é a dor do nicho e usa o que já
 * estourou como pauta — depois refaz cada um com a sua própria verdade.
 *
 * COMO ELE LÊ O DESEMPENHO (e por que não traz o número de views): o Instagram
 * não expõe visualizações nem na grade da busca nem no texto da página do post,
 * e o GraphQL não devolve o nó do post principal de forma estável. O que ele
 * expõe, e que serve igual, é a ORDEM: o topo da busca já é o ranking do próprio
 * algoritmo pra aquele termo. Então o script captura a GRADE em imagem e devolve
 * os links na ordem em que apareceram — quem lê as capas com visão extrai o
 * assunto, que é o que o método realmente pede.
 *
 * O QUE ELE NÃO FAZ: decidir a pauta. Ele traz o ASSUNTO já validado pela
 * demanda; a "sua verdade" em cima dele continua sendo trabalho humano, porque
 * copiar o roteiro é justamente o que estraga o formato.
 *
 * Só roda LOCAL (Playwright + sessão logada via `ig:login`). Se a busca voltar
 * vazia, provavelmente a sessão perdeu o cookie `sessionid`: rode `ig:login`.
 *
 * Uso:
 *   node server/scripts/buscar-assuntos.cjs "vibe coding"
 *   node server/scripts/buscar-assuntos.cjs "vibe coding,agente de IA" 3
 *   (via pnpm) pnpm --filter @app/dobro conteudo:buscar-assuntos "<termos>" [telas]
 */
const { loadChromium, SESSION_PATH } = require('./lib/ig-playwright.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');

/** Quantas telas de resultado capturar por termo. */
const TELAS_PADRAO = 2;
/** Teto de espera pelos resultados da busca, em ms. */
const ESPERA_BUSCA = 15000;

/** Vira nome de arquivo seguro. */
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'termo';

/** Links de post na grade, na ORDEM em que o Instagram rankeou. */
async function colherLinks(page, limite) {
  const hrefs = await page.$$eval('a[href*="/p/"], a[href*="/reel/"]', (as) =>
    as.map((a) => a.getAttribute('href')).filter(Boolean),
  );
  const vistos = [];
  for (const h of hrefs) {
    const url = `https://www.instagram.com${h.split('?')[0]}`;
    if (!vistos.includes(url)) vistos.push(url);
    if (vistos.length >= limite) break;
  }
  return vistos;
}

(async () => {
  const termos = (process.argv[2] || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  const telas = Number(process.argv[3]) || TELAS_PADRAO;
  if (!termos.length) {
    console.error('uso: buscar-assuntos "<termo>[,termo2,...]" [telas-por-termo]');
    process.exit(1);
  }
  if (!fs.existsSync(SESSION_PATH)) {
    console.error('Sem sessão do Instagram. Rode uma vez: pnpm --filter @app/dobro ig:login');
    process.exit(1);
  }

  const chromium = loadChromium();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    storageState: SESSION_PATH,
    locale: 'pt-BR',
    viewport: { width: 1280, height: 1400 },
  });
  const page = await ctx.newPage();
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ig-assuntos-'));

  const resultado = [];
  for (const termo of termos) {
    const busca = `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(termo)}`;
    await page.goto(busca, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.keyboard.press('Escape').catch(() => {});

    const limite = Date.now() + ESPERA_BUSCA;
    while (Date.now() < limite) {
      if (await page.$('a[href*="/p/"], a[href*="/reel/"]')) break;
      await page.waitForTimeout(500);
    }

    // Se nem um link apareceu, quase sempre é sessão sem login — avisa em vez
    // de devolver lista vazia, que parece "não achei nada".
    if (!(await page.$('a[href*="/p/"], a[href*="/reel/"]'))) {
      resultado.push({ termo, erro: 'nenhum resultado; confira se a sessão tem cookie sessionid (ig:login)' });
      continue;
    }

    const imagens = [];
    for (let i = 0; i < telas; i += 1) {
      const arq = path.join(outDir, `${slug(termo)}-${String(i + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: arq });
      imagens.push(arq);
      await page.mouse.wheel(0, 1350);
      await page.waitForTimeout(1600);
    }

    resultado.push({ termo, imagens, links: await colherLinks(page, telas * 12) });
  }

  await browser.close();
  console.log(JSON.stringify({ dir: outDir, resultado }, null, 2));
})().catch((e) => {
  console.error('FALHOU:', e instanceof Error ? e.message : e);
  process.exit(1);
});
