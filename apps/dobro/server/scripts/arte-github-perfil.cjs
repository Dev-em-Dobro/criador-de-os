/**
 * apps/dobro — gera a ARTE da capa do carrossel "github-perfil".
 *
 * A capa mostra o RESULTADO: um README de perfil do GitHub montado, com os cards
 * carregados das APIs de verdade na hora do render. Se um serviço estiver fora do
 * ar, o card some da arte, e isso é proposital: só entra no carrossel o bloco que
 * respondeu.
 *
 * O perfil é GENÉRICO ("seu-usuario"), e não o do @devemdobro: a composição do
 * README e o repositório fixado são exemplo nosso, então apontar a barra de
 * endereço pra uma conta real seria afirmar uma página que não existe daquele
 * jeito. Os badges e os ícones, esses, são carregados dos serviços reais.
 *
 * ATENÇÃO: `github-readme-stats.vercel.app` está com o deployment PAUSADO desde
 * 19/04/2026 (HTTP 503, issue #4867 aberta no repositório). Por isso o card de
 * estatísticas mais copiado da internet NÃO entra aqui nem no carrossel.
 *
 * ⚠️ ESTA NÃO É MAIS A CAPA EM USO. Em 12/08/2026 o dono trocou a capa pela arte
 * do Octocat nível 1 virando nível 99, que é a que está em `capa.png` e a que o
 * carrossel aponta. Por isso este script grava em `capa-janela.png`: gravar em
 * `capa.png`, como fazia antes, apagaria a arte do dono na primeira vez que
 * alguém rodasse o script de novo.
 *
 * Uso: node server/scripts/arte-github-perfil.cjs
 * Saída: server/carrossel/assets/github-perfil/capa-janela.png (1080×1350)
 */
const { chromium } = require('playwright');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join, resolve } = require('node:path');
const { tmpdir } = require('node:os');
const { pathToFileURL } = require('node:url');

const appRoot = resolve(__dirname, '..', '..');
// Usuário GENÉRICO de propósito. A arte já usou 'devemdobro' e a barra de
// endereço dizia github.com/devemdobro, mas o perfil real tem outro README (com
// dois cards quebrados) e o repositório fixado não tem a descrição que a arte
// mostrava. Arte que aponta pra uma página real precisa bater com ela; como a
// capa aqui é ILUSTRAÇÃO do resultado, o caminho honesto é não apontar pra
// ninguém (revisor de fato, 12/08/2026).
const USER = 'seu-usuario';
const NOME = 'Seu Nome';

const html = `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1350px;font-family:'Ubuntu Mono',monospace;overflow:hidden}
  .art{position:relative;width:1080px;height:1350px;
    background:radial-gradient(120% 70% at 50% 0%, #241a44 0%, #170f2c 45%, #0b0816 100%);}

  /* A janela do GitHub sangra pelas laterais e termina antes da faixa de texto. */
  .win{position:absolute;top:40px;left:38px;width:1004px;height:700px;
    background:#0d1117;border:1px solid #30363d;border-radius:20px;overflow:hidden;
    box-shadow:0 50px 120px rgba(0,0,0,.75), 0 0 0 1px rgba(139,92,246,.10);}
  .bar{height:52px;background:#161b22;border-bottom:1px solid #30363d;
    display:flex;align-items:center;gap:9px;padding:0 20px}
  .dot{width:12px;height:12px;border-radius:50%}
  .url{margin-left:16px;background:#0d1117;border:1px solid #30363d;border-radius:7px;
    padding:6px 16px;font-size:20px;color:#8b949e}
  .url b{color:#e6edf3;font-weight:700}

  .readme{padding:26px 30px;color:#e6edf3}
  .head{display:flex;align-items:center;gap:16px;padding-bottom:16px;border-bottom:1px solid #21262d}
  .ava{width:58px;height:58px;border-radius:50%;background:#8b5cf6;flex-shrink:0}
  .nome{font-size:27px;font-weight:700}
  .user{font-size:21px;color:#8b949e}
  .file{margin:18px 0 12px;font-size:19px;color:#8b949e}
  .file b{color:#58a6ff;font-weight:400}
  .bloco{margin-bottom:15px}
  .bloco img{display:block;max-width:100%}
  .linha{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
  .titulo{font-size:29px;font-weight:700;margin-bottom:12px}
  .bio{font-size:23px;line-height:1.5;color:#c9d1d9;margin-bottom:18px}
  .pin{margin-top:18px;border:1px solid #30363d;border-radius:10px;padding:14px 18px;background:#0d1117}
  .pin-t{font-size:22px;color:#58a6ff;font-weight:700}
  .pin-s{font-size:19px;color:#8b949e;margin-top:4px}

  .fade{position:absolute;inset:0;background:linear-gradient(180deg,
    rgba(11,8,22,0) 52%, rgba(11,8,22,.80) 62%, #0b0816 70%)}
</style></head><body>
<div class="art">
  <div class="win">
    <div class="bar">
      <div class="dot" style="background:#ff5f57"></div>
      <div class="dot" style="background:#febc2e"></div>
      <div class="dot" style="background:#28c840"></div>
      <div class="url">github.com/<b>${USER}</b></div>
    </div>
    <div class="readme">
      <div class="head">
        <div class="ava"></div>
        <div><div class="nome">${NOME}</div><div class="user">@${USER}</div></div>
      </div>
      <div class="file">${USER} / <b>README.md</b></div>

      <div class="bloco">
        <img src="https://capsule-render.vercel.app/api?type=waving&color=8b5cf6&height=110&section=header&text=Seu%20Nome&fontColor=ffffff&fontSize=42&animation=fadeIn" alt="">
      </div>
      <div class="bloco linha">
        <img src="https://skillicons.dev/icons?i=js,ts,react,nodejs,nextjs,tailwind,git,github&perline=8" height="58" alt="">
      </div>
      <!-- O gráfico de atividade saiu da capa de propósito: ele expõe o volume
           de commits, e num perfil de marca (que commita pouco) a linha reta
           passa a impressão contrária à do post. Ele continua sendo um bloco
           possível do README, e aparece no presente. -->
      <!-- Sem número de anos de carreira: a arte é ilustrativa, mas nem em arte
           a casa inventa fato sobre o dono. -->
      <div class="bio">
        Dev front-end focado em React e TypeScript. Aqui ficam<br>
        os projetos que eu construo estudando.
      </div>
      <div class="bloco linha">
        <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" height="42" alt="">
        <img src="https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white" height="42" alt="">
        <img src="https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white" height="42" alt="">
      </div>
      <div class="pin">
        <div class="pin-t">📌 dashboard-financeiro</div>
        <div class="pin-s">Painel de gastos com React, Recharts e API própria</div>
      </div>
    </div>
  </div>
  <div class="fade"></div>
</div>
</body></html>`;

(async () => {
  const outDir = resolve(appRoot, 'server', 'carrossel', 'assets', 'github-perfil');
  mkdirSync(outDir, { recursive: true });

  const tmp = join(tmpdir(), `arte-github-perfil-${Date.now()}.html`);
  writeFileSync(tmp, html, 'utf8');

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: 'networkidle' });
  // Os cards vêm de APIs externas e a fonte do Google: sem esta espera a arte
  // sai com quadrado de imagem quebrada, que é justamente o que o post critica.
  await page.waitForTimeout(6000);
  await page.screenshot({ path: join(outDir, 'capa-janela.png') });
  await browser.close();
  console.log('[arte] capa-janela.png em server/carrossel/assets/github-perfil/ (a capa em uso é capa.png, arte do dono)');
})().catch((e) => {
  console.error('[arte] FALHOU:', e.message);
  process.exit(1);
});
