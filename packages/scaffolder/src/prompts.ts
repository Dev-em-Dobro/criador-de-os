/**
 * @os/scaffolder — wizard interativo (sem dependências: node:readline nativo).
 *
 * Coleta o mínimo para um manifesto válido e devolve um objeto BRUTO de
 * respostas — a validação/normalização fica com `normalizeAnswers` (mesma porta
 * do modo `--config`). O objetivo é UX simples e à prova de falhas, não bonita.
 */

import { createInterface, type Interface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { BLOCK_KINDS, titleize } from './answers';
import { toKebab } from './util';

function yes(v: string, def: boolean): boolean {
  const s = v.trim().toLowerCase();
  if (!s) return def;
  return s === 's' || s === 'sim' || s === 'y' || s === 'yes';
}

async function askMenus(rl: Interface): Promise<unknown[]> {
  const menus: unknown[] = [];
  console.log('\nBlocos disponíveis:');
  BLOCK_KINDS.forEach((b, i) => console.log(`  ${i + 1}) ${b}`));

  for (;;) {
    const n = menus.length + 1;
    const pick = (await rl.question(`\nMenu ${n} — número do bloco (Enter encerra${menus.length === 0 ? ', mín. 1' : ''}): `)).trim();
    if (!pick) {
      if (menus.length === 0) {
        console.log('  → adicione ao menos 1 menu.');
        continue;
      }
      break;
    }
    const idx = Number(pick) - 1;
    if (!Number.isInteger(idx) || idx < 0 || idx >= BLOCK_KINDS.length) {
      console.log('  → número inválido.');
      continue;
    }
    const block = BLOCK_KINDS[idx];
    const label = (await rl.question(`  Rótulo do menu (ex.: "Vendas"): `)).trim() || titleize(block);
    const keyRaw = (await rl.question(`  Slug/rota [/${toKebab(label)}] (Enter aceita): `)).trim();
    menus.push({ block, label, key: keyRaw || toKebab(label) });
  }
  return menus;
}

/** Roda o wizard e devolve o objeto bruto de respostas (a normalizar). */
export async function runWizard(): Promise<unknown> {
  const rl = createInterface({ input, output });
  try {
    console.log('\n=== Criador de OS — novo cliente ===\n');

    let slug = '';
    while (!slug) {
      slug = toKebab((await rl.question('Slug do cliente (kebab-case, ex.: cliente-exemplo): ')).trim());
      if (!slug) console.log('  → obrigatório.');
    }
    const displayName = (await rl.question(`Nome de exibição [${titleize(slug)}]: `)).trim() || titleize(slug);
    const productName = (await rl.question(`Nome do produto [${displayName} OS]: `)).trim() || undefined;

    const presetIn = (await rl.question('Preset — 1) full (com Neon+auth)  2) static (protótipo) [1]: ')).trim();
    const preset = presetIn === '2' ? 'static' : 'full';

    const brand = (await rl.question('Cor primária (hex) [#4f46e5]: ')).trim() || '#4f46e5';
    const signal = (await rl.question('Cor de sinal/positivo (hex) [#22c55e]: ')).trim() || undefined;

    let auth = false;
    let allowedDomain: string | undefined;
    if (preset === 'full') {
      auth = yes(await rl.question('Autenticação obrigatória? (S/n): '), true);
      if (auth) {
        allowedDomain = (await rl.question('Domínio de e-mail permitido (opcional): ')).trim() || undefined;
      }
    }

    const periodEnabled = yes(await rl.question('Filtro de período no topo? (S/n): '), true);

    const menus = await askMenus(rl);

    return {
      slug,
      displayName,
      productName,
      preset,
      theme: { brand, signal },
      auth,
      allowedDomain,
      period: { enabled: periodEnabled, default: 'monthly' },
      menus,
    };
  } finally {
    rl.close();
  }
}
