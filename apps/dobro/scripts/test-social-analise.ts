/**
 * Teste do motor de análise (Lead Score) — Story 1 do epic Social Media Estrategista.
 *
 * Sem framework (o dobro não usa Vitest): script `tsx` no padrão dos smokes.
 * Rodar da raiz do repo:  npx tsx apps/dobro/scripts/test-social-analise.ts
 *
 * Valida PROPRIEDADES (robustas a recalibração), não números mágicos:
 *  - campeão rankeia acima de post fraco;
 *  - trocar o objetivo inverte a ordem entre um post "de salvamento" e um "de alcance";
 *  - alcance nulo/0 sai do ranking (dados insuficientes);
 *  - agregações por formato/dia e nível de confiança.
 */

import {
  construirContexto,
  rankear,
  leadScore,
  agregarPorFormato,
  agregarPorDiaSemana,
  nivelConfianca,
  type PostMetrics,
  type Objetivo,
} from '../src/blocks/social-analise';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean): void {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}`);
  }
}

/** Cria um PostMetrics de carrossel com defaults 0 (alcance 1000). */
function mk(id: string, over: Partial<PostMetrics> = {}): PostMetrics {
  return {
    id,
    formato: 'carrossel',
    data: null,
    tema: null,
    alcance: 1000,
    comentarios: 0,
    visitasPerfil: 0,
    salvamentos: 0,
    compartilhamentos: 0,
    seguidores: 0,
    curtidas: 0,
    ...over,
  };
}

function rankComObjetivo(posts: PostMetrics[], objetivo: Objetivo) {
  const ctx = construirContexto(posts, objetivo);
  return rankear(posts, ctx);
}

// ── 1) Campeão > Fraco ──────────────────────────────────────────────────────
console.log('\n[1] campeão rankeia acima de fraco');
{
  const campeao = mk('campeao', {
    comentarios: 8,
    visitasPerfil: 30,
    salvamentos: 30,
    compartilhamentos: 20,
    seguidores: 8,
    curtidas: 50,
  });
  const fraco = mk('fraco', {
    comentarios: 0,
    visitasPerfil: 1,
    salvamentos: 2,
    compartilhamentos: 1,
    seguidores: 0,
    curtidas: 10,
  });
  const { ranked } = rankComObjetivo([fraco, campeao], 'lead');
  check('campeão é o 1º do ranking', ranked[0]?.id === 'campeao');
  check('score do campeão > score do fraco', (ranked[0]?.score ?? 0) > (ranked[1]?.score ?? 0));
  check('campeão recebe rótulo "Campeão"', ranked[0]?.rotulo === 'Campeão');
  check('taxaTop do campeão é uma métrica de funil', ranked[0]?.taxaTop != null);
}

// ── 2) Objetivo muda o ranking ──────────────────────────────────────────────
console.log('\n[2] trocar o objetivo inverte a ordem (saves vs alcance)');
{
  const pSaves = mk('saves', { salvamentos: 25, curtidas: 5 });
  const pCompart = mk('compart', { compartilhamentos: 15, curtidas: 5 });
  const posts = [pCompart, pSaves];

  const autoridade = rankComObjetivo(posts, 'autoridade').ranked;
  check('em "autoridade", o post de salvamento vem 1º', autoridade[0]?.id === 'saves');

  const alcance = rankComObjetivo(posts, 'alcance').ranked;
  check('em "alcance", o post de compartilhamento vem 1º', alcance[0]?.id === 'compart');
}

// ── 3) Alcance nulo/0 sai do ranking ────────────────────────────────────────
console.log('\n[3] alcance ausente → fora do ranking');
{
  const ok = mk('ok', { salvamentos: 10 });
  const semAlc = mk('sem', { alcance: null, salvamentos: 10 });
  const zero = mk('zero', { alcance: 0, salvamentos: 10 });
  const { ranked, semAlcance } = rankComObjetivo([ok, semAlc, zero], 'lead');
  check('só o post com alcance entra no ranking', ranked.length === 1 && ranked[0].id === 'ok');
  check('os 2 sem alcance vão pra lista à parte', semAlcance.length === 2);

  const ctx = construirContexto([ok, semAlc], 'lead');
  check('leadScore marca semAlcance=true p/ alcance nulo', leadScore(semAlc, ctx).semAlcance === true);
}

// ── 4) Agregação por formato ────────────────────────────────────────────────
console.log('\n[4] agregação por formato');
{
  const posts: PostMetrics[] = [
    mk('c1', { salvamentos: 25 }),
    mk('c2', { salvamentos: 20 }),
    mk('r1', { formato: 'reel', compartilhamentos: 12, salvamentos: 8 }),
  ];
  const ctx = construirContexto(posts, 'lead');
  const agg = agregarPorFormato(posts, ctx);
  const formatos = agg.map((a) => a.formato).sort();
  check('retorna carrossel + reel', formatos.join(',') === 'carrossel,reel');
  const total = agg.reduce((s, a) => s + a.n, 0);
  check('soma das amostras = nº de posts com alcance', total === 3);
  check('está ordenado por scoreMedio desc', agg.every((a, i) => i === 0 || agg[i - 1].scoreMedio >= a.scoreMedio));
}

// ── 5) Agregação por dia da semana ──────────────────────────────────────────
console.log('\n[5] agregação por dia da semana (ignora sem data)');
{
  const posts: PostMetrics[] = [
    mk('d1', { data: '2026-07-06T12:00:00Z', salvamentos: 20 }),
    mk('d2', { data: '2026-07-07T12:00:00Z', salvamentos: 15 }),
    mk('d3', { data: null, salvamentos: 30 }), // sem data → ignorado
  ];
  const ctx = construirContexto(posts, 'lead');
  const agg = agregarPorDiaSemana(posts, ctx);
  const total = agg.reduce((s, a) => s + a.n, 0);
  check('só os 2 posts com data entram', total === 2);
  check('cada entrada tem um label de dia', agg.every((a) => typeof a.label === 'string' && a.label.length > 0));
}

// ── 6) Nível de confiança ───────────────────────────────────────────────────
console.log('\n[6] nível de confiança pela amostra');
{
  const poucos = Array.from({ length: 3 }, (_, i) => mk(`p${i}`, { salvamentos: 10 }));
  const medio = Array.from({ length: 10 }, (_, i) => mk(`m${i}`, { salvamentos: 10 }));
  const muitos = Array.from({ length: 20 }, (_, i) => mk(`x${i}`, { salvamentos: 10 }));
  check('3 posts → baixa', nivelConfianca(poucos).nivel === 'baixa');
  check('10 posts → media', nivelConfianca(medio).nivel === 'media');
  check('20 posts → boa', nivelConfianca(muitos).nivel === 'boa');
  check('conta só posts com alcance', nivelConfianca([...poucos, mk('nn', { alcance: null })]).n === 3);
}

// ── Resultado ───────────────────────────────────────────────────────────────
console.log(`\n${failed === 0 ? '✅' : '❌'} social-analise: ${passed} passaram, ${failed} falharam`);
if (failed > 0) process.exitCode = 1;
