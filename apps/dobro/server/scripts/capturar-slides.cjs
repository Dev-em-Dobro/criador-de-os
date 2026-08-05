/**
 * apps/dobro — CAPTURA os slides de um carrossel (ou a imagem de um post) do
 * Instagram a partir do LINK, usando a sessão logada (`ig:login`).
 *
 * O QUE ELE FAZ: abre o post logado como o dono, navega slide a slide e coleta a
 * URL ORIGINAL de cada imagem no CDN; depois BAIXA essas imagens. Imprime um JSON
 * com a pasta e os caminhos — quem chama (o pipeline ou o Claude Code) lê essas
 * imagens com visão e transcreve o texto.
 *
 * POR QUE BAIXAR A IMAGEM EM VEZ DE PRINTAR A TELA: o print pega qualquer coisa
 * que o Instagram sobreponha (modal de notificação, banner de cookies) e sai na
 * resolução da viewport. A imagem do CDN vem limpa, completa e em alta.
 *
 * Só roda LOCAL (Playwright + sessão logada) — nunca dentro da function da Vercel.
 *
 * LIMITAÇÃO CONHECIDA: em alguns posts o ÚLTIMO slide não é alcançado (o botão de
 * avançar some antes de a imagem final entrar no DOM). Na prática o último slide
 * é o CTA, que já vem na legenda, então a transcrição não perde conteúdo de
 * substância. O JSON informa `coletadas` (navegação) e `count` (download) para dar
 * pra ver de que lado ficou a perda, e o `total` esperado sai do Apify.
 *
 * Uso:
 *   node server/scripts/capturar-slides.cjs "<url-instagram>"
 *   (via pnpm) pnpm --filter @app/dobro conteudo:capturar-slides "<url>"
 */
const { loadChromium, SESSION_PATH } = require('./lib/ig-playwright.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');

/** Teto de slides — o Instagram permite 20 por post. */
const MAX_SLIDES = 20;

/**
 * Fecha o que o Instagram joga por cima do post. O que mais atrapalha é o modal
 * "Cadastre-se no Instagram" (aparece alguns segundos depois de abrir o post):
 * ele não tem botão de texto, só um X, e enquanto está aberto o overlay ENGOLE o
 * clique no botão de avançar — o clique não dá erro, simplesmente não faz nada.
 * Por isso isto roda também DENTRO do loop, não só uma vez.
 */
async function fecharModais(page) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const dialog = page.locator('div[role="dialog"]').first();
    if (!(await dialog.isVisible().catch(() => false))) return;

    // 1) Botão de texto, quando existe (cookies, "salvar login").
    for (const r of ['Agora não', 'Not Now', 'Not now', 'Cancelar', 'Aceitar tudo']) {
      const botao = page.locator(`button:has-text("${r}"), [role="button"]:has-text("${r}")`).first();
      if (await botao.isVisible().catch(() => false)) {
        await botao.click({ timeout: 2000 }).catch(() => {});
        await page.waitForTimeout(500);
        break;
      }
    }

    // 2) O X do modal de cadastro (é um svg; clicamos no ancestral clicável).
    const x = page
      .locator('div[role="dialog"] svg[aria-label="Fechar"], div[role="dialog"] svg[aria-label="Close"]')
      .first();
    if (await x.isVisible().catch(() => false)) {
      await x.click({ timeout: 2000, force: true }).catch(() => {});
      await page.waitForTimeout(500);
    }

    // 3) Último recurso: Escape.
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  }
}

/**
 * URL da maior imagem visível do post (o slide atual). Ignora avatar, ícones e a
 * grade de "posts relacionados" (que ficam fora do article principal).
 */
async function urlDoSlideAtual(page) {
  return page.evaluate(() => {
    // Um slide de carrossel pode ser IMAGEM ou VÍDEO. No caso do vídeo pegamos o
    // `poster` (o frame de capa): não dá pra transcrever a fala, mas o texto na
    // tela costuma estar ali, e sem isso o último slide se perde silenciosamente.
    const nos = Array.from(
      document.querySelectorAll('article img, main img, div[role="dialog"] img, article video, main video'),
    );
    let melhor = null;
    let area = 0;
    for (const no of nos) {
      const r = no.getBoundingClientRect();
      // Slides são grandes e aproximadamente quadrados ou retrato.
      if (r.width < 300 || r.height < 300) continue;
      if (no.tagName === 'VIDEO' && !no.getAttribute('poster')) continue;
      if (r.width * r.height > area) {
        area = r.width * r.height;
        melhor = no;
      }
    }
    if (!melhor) return null;
    if (melhor.tagName === 'VIDEO') return melhor.getAttribute('poster');
    // srcset traz variações; a última costuma ser a maior.
    const srcset = melhor.getAttribute('srcset');
    if (srcset) {
      const ultima = srcset.split(',').pop();
      if (ultima) return ultima.trim().split(/\s+/)[0];
    }
    return melhor.currentSrc || melhor.src || null;
  });
}

/**
 * Botão "avançar" do carrossel. O aria-label muda com o idioma da conta, então
 * tentamos vários e caímos no SVG dentro de botão como último recurso.
 */
async function botaoAvancar(page) {
  const seletores = [
    'button[aria-label="Avançar"]',
    'button[aria-label="Next"]',
    'button[aria-label="Próximo"]',
    'button[aria-label="Seguinte"]',
    '[aria-label="Avançar"]',
    '[aria-label="Next"]',
    'button:has(svg[aria-label="Avançar"])',
    'button:has(svg[aria-label="Next"])',
  ];
  for (const s of seletores) {
    const el = page.locator(s).first();
    if (await el.isVisible().catch(() => false)) return el;
  }
  return null;
}

(async () => {
  const url = (process.argv[2] || '').split('?')[0];
  if (!url) {
    console.error('uso: capturar-slides "<url-instagram>"');
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
    viewport: { width: 1180, height: 1500 },
  });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(3000);
  await fecharModais(page);

  // 1) Percorre o carrossel coletando a URL de cada slide (sem baixar ainda).
  //
  // O PRIMEIRO clique depois de fechar o modal costuma ser engolido (a página só
  // ganha foco com ele). Por isso não paramos na primeira tentativa sem efeito:
  // só desistimos depois de DUAS rodadas seguidas sem sair do lugar.
  const urls = [];
  let paradas = 0;
  for (let i = 0; i < MAX_SLIDES; i++) {
    await fecharModais(page); // o modal pode subir a qualquer momento e travar o clique

    const u = await urlDoSlideAtual(page);
    if (u && !urls.includes(u)) urls.push(u);

    const next = await botaoAvancar(page);
    if (!next) break; // sem botão de avançar → último slide (ou post de imagem única)
    await next.click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(1600);

    // Não mudou? Tenta a seta do teclado antes de contar como parada.
    let depois = await urlDoSlideAtual(page);
    if (depois === u) {
      await page.keyboard.press('ArrowRight').catch(() => {});
      await page.waitForTimeout(1600);
      depois = await urlDoSlideAtual(page);
    }

    if (depois === u) {
      paradas += 1;
      if (paradas >= 2) break; // travou de verdade → fim do carrossel
    } else {
      paradas = 0;
    }
  }

  // 2) Baixa as imagens usando o contexto logado (cookies do CDN quando preciso).
  // Uma tentativa extra por slide: a URL do CDN às vezes responde 403 na primeira.
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ig-slides-'));
  const slides = [];
  const falhas = [];
  for (let i = 0; i < urls.length; i++) {
    let salvo = false;
    for (let tentativa = 0; tentativa < 2 && !salvo; tentativa++) {
      try {
        const resp = await ctx.request.get(urls[i], { timeout: 30000 });
        if (!resp.ok()) {
          if (tentativa === 1) falhas.push(`slide ${i + 1}: HTTP ${resp.status()}`);
          await page.waitForTimeout(500);
          continue;
        }
        const buf = await resp.body();
        const ext = /\.png/i.test(urls[i]) ? 'png' : /\.webp/i.test(urls[i]) ? 'webp' : 'jpg';
        const p = path.join(outDir, `slide-${String(i + 1).padStart(2, '0')}.${ext}`);
        fs.writeFileSync(p, buf);
        slides.push(p);
        salvo = true;
      } catch (err) {
        if (tentativa === 1) falhas.push(`slide ${i + 1}: ${err.message}`);
      }
    }
  }

  await browser.close();
  // `coletadas` vs `count` diz onde perdemos slide: navegação ou download.
  if (falhas.length) console.error('[capturar-slides] falhas:', falhas.join(' | '));
  console.log(JSON.stringify({ dir: outDir, coletadas: urls.length, count: slides.length, slides }));
})().catch((e) => {
  console.error('FALHOU:', e instanceof Error ? e.message : e);
  process.exit(1);
});
