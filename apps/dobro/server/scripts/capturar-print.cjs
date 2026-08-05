/**
 * apps/dobro — tira um PRINT de uma página web para usar como `imagem` de slide
 * (a janelinha de navegador que o template desenha embaixo do texto).
 *
 * Serve pra MOSTRAR a ferramenta em vez de só descrever: quando o carrossel fala
 * de um site ou de um repo, o print faz o slide provar o que o texto diz.
 *
 * Fecha os banners que aparecem por cima (cookies, "sign in", modal do GitHub),
 * senão o print sai com um tarja no meio da tela.
 *
 * Uso:
 *   node server/scripts/capturar-print.cjs "<url>" "<arquivo-de-saida.png>" [largura] [altura]
 *   ex.: node server/scripts/capturar-print.cjs "https://github.com/x/y" public/carrosseis/foo/y.png
 */
const { loadChromium } = require('./lib/ig-playwright.cjs');
const fs = require('fs');
const path = require('path');

/** Banners e modais que costumam cobrir a página. */
async function fecharPopups(page) {
  const rotulos = [
    'Accept all',
    'Aceitar tudo',
    'Accept cookies',
    'Got it',
    'Entendi',
    'Dismiss',
    'Close',
    'Fechar',
    'Não, obrigado',
    'No thanks',
  ];
  for (const r of rotulos) {
    const botao = page.locator(`button:has-text("${r}"), a:has-text("${r}")`).first();
    if (await botao.isVisible().catch(() => false)) {
      await botao.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
}

(async () => {
  const url = process.argv[2];
  const saida = process.argv[3];
  const largura = Number(process.argv[4]) || 1440;
  const altura = Number(process.argv[5]) || 900;

  if (!url || !saida) {
    console.error('uso: capturar-print "<url>" "<saida.png>" [largura] [altura]');
    process.exit(1);
  }

  const chromium = loadChromium();
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: largura, height: altura },
    deviceScaleFactor: 2, // o print entra pequeno no slide; 2x mantém o texto nítido
    locale: 'en-US',
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await fecharPopups(page);
  await page.waitForTimeout(500);

  fs.mkdirSync(path.dirname(saida), { recursive: true });
  await page.screenshot({ path: saida }); // só a dobra: é o que cabe na janelinha
  await browser.close();

  const kb = Math.round(fs.statSync(saida).size / 1024);
  console.log(JSON.stringify({ url, saida, kb }));
})().catch((e) => {
  console.error('FALHOU:', e instanceof Error ? e.message : e);
  process.exit(1);
});
