/**
 * apps/dobro — LOGIN único no Instagram para os scripts de captura.
 *
 * Abre uma janela do navegador; o dono faz login manualmente. Detecta o login
 * pelo cookie `sessionid` (mais confiável que a URL) e salva a sessão em
 * `.ig-session.json` (gitignored). Depois, `conteudo:capturar-slides` abre posts
 * LOGADO como o dono e navega/lê o carrossel inteiro pelo link.
 *
 * Uso (rodar UMA vez, no PC, com tela):
 *   pnpm --filter @app/dobro ig:login
 */
const { loadChromium, SESSION_PATH } = require('./lib/ig-playwright.cjs');

async function temSessionId(ctx) {
  const cookies = await ctx.cookies('https://www.instagram.com').catch(() => []);
  return cookies.some((c) => c.name === 'sessionid' && c.value && c.value.length > 10);
}

(async () => {
  const chromium = loadChromium();
  const browser = await chromium.launch({ headless: false });
  const ctx = await browser.newContext({ locale: 'pt-BR', viewport: { width: 1180, height: 900 } });
  const page = await ctx.newPage();
  await page.bringToFront().catch(() => {});
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'domcontentloaded' });

  console.log('\n============================================================');
  console.log('  FAÇA LOGIN no Instagram na janela que abriu.');
  console.log('  Detecto o login sozinho e salvo a sessão. (aguardo até 5 min)');
  console.log('============================================================\n');

  const deadline = Date.now() + 5 * 60 * 1000;
  let logado = false;
  while (Date.now() < deadline) {
    if (await temSessionId(ctx)) {
      logado = true;
      break;
    }
    await page.waitForTimeout(2000).catch(() => {});
  }

  if (logado) {
    await page.waitForTimeout(2500).catch(() => {});
    await ctx.storageState({ path: SESSION_PATH });
    console.log('\n[OK] Login detectado! Sessão salva em', SESSION_PATH);
    console.log('Pronto! Agora leio carrosséis inteiros pelo link. Pode fechar a janela.');
  } else {
    console.log('\n[!] Não detectei login (sem cookie sessionid) em 5 min — NÃO salvei sessão logada.');
    console.log('Rode de novo e conclua o login na janela: pnpm --filter @app/dobro ig:login');
  }
  await browser.close();
  process.exit(logado ? 0 : 2);
})().catch((e) => {
  console.error('FALHOU:', e instanceof Error ? e.message : e);
  process.exit(1);
});
