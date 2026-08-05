/**
 * Resolve o Playwright (chromium) para os scripts de captura do Instagram.
 * Tenta o pacote local do projeto; se não houver, cai no que vem com o gstack
 * (instalado em ~/.claude/skills/gstack/node_modules). Assim os scripts NÃO
 * adicionam uma dependência pesada ao app, mas rodam no PC do dono.
 *
 * Só rodam via tsx/node LOCAL (não entram na function da Vercel).
 */
const path = require('path');
const os = require('os');

function loadChromium() {
  const candidates = [
    'playwright',
    'playwright-core',
    path.join(os.homedir(), '.claude', 'skills', 'gstack', 'node_modules', 'playwright'),
    path.join(os.homedir(), '.claude', 'skills', 'gstack', 'node_modules', 'playwright-core'),
  ];
  for (const c of candidates) {
    try {
      const pw = require(c);
      if (pw && pw.chromium) return pw.chromium;
    } catch {
      /* tenta o próximo candidato */
    }
  }
  throw new Error(
    'Playwright não encontrado. Instale o gstack (skill /browse) ou rode: ' +
      'pnpm add -D playwright && npx playwright install chromium',
  );
}

/** Arquivo de sessão logada do Instagram (gitignored — cookies sensíveis). */
const SESSION_PATH = path.resolve(__dirname, '..', '..', '..', '.ig-session.json');

module.exports = { loadChromium, SESSION_PATH };
