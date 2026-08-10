/**
 * apps/dobro — template HTML/CSS do carrossel padrão "JARVIS" (parametrizado).
 * Recebe a definição de um carrossel + a imagem de fundo (data URI) e devolve um
 * HTML com os N slides 360×450 (renderizados a 1080×1350 no script, com scale 3).
 *
 * Copia 1:1 a referência @devemdobro: Ubuntu Mono, sequência de fundos, sangria
 * no topo dos escuros, chrome (barra + bolinhas + setas), labels, callout, listas,
 * passos 01-05 e terminal. Ver memória carrossel-estilo-jarvis.
 */

import type { Carrossel, Slide } from './types';
import { svgIcon, BRANDS } from './icons';

const CSS = `
  :root{ --mono:'Ubuntu Mono', ui-monospace, 'Consolas', monospace; }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:#0a0a0d;padding:34px;display:flex;flex-wrap:wrap;gap:30px;font-family:var(--mono);width:1620px;}
  .slide{width:360px;height:450px;position:relative;overflow:hidden;border-radius:12px;display:flex;flex-direction:column;padding:24px 26px;}
  .dark{background:#191426;} .light{background:#eae7f5;} .purple{background:#7c46d6;} .photo{background:#000;}
  /* no-repeat: com bgSize custom a arte pode não cobrir a altura toda, e sem isso
     ela se repetia embaixo (uma segunda cópia aparecendo no rodapé). */
  .imgbg{position:absolute;inset:0;background-size:cover;background-position:center 26%;background-repeat:no-repeat;}
  /* escurecido da capa: rampa longa e com paradas próximas, pra não marcar a
     faixa onde o preto entra (aparecia em arte de fundo claro). O rodapé segue
     escuro o bastante pro texto branco. */
  .scrim{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.10) 0%,rgba(0,0,0,0) 26%,rgba(0,0,0,.09) 42%,rgba(0,0,0,.26) 55%,rgba(0,0,0,.52) 68%,rgba(0,0,0,.76) 82%,rgba(0,0,0,.90) 100%);}
  .topbleed{position:absolute;top:0;left:0;right:0;height:120px;background-size:cover;background-position:center 20%;opacity:.28;filter:blur(1px);
    -webkit-mask-image:linear-gradient(to bottom,#000 0%,#000 30%,transparent 100%);mask-image:linear-gradient(to bottom,#000 0%,#000 30%,transparent 100%);}
  .eyebrow{font-size:10.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;margin-bottom:10px;position:relative;z-index:2;}
  .dark .eyebrow{color:#8f83f0;} .light .eyebrow{color:#6d3ad6;} .purple .eyebrow{color:rgba(255,255,255,.72);}
  h1{font-family:var(--mono);font-weight:700;font-size:25px;line-height:1.12;letter-spacing:-.01em;position:relative;z-index:2;}
  .dark h1,.photo h1,.purple h1{color:#fff;} .light h1{color:#1a1330;}
  .hl{color:#a78bfa;} .light .hl{color:#6d3ad6;}
  .cta .hl{color:#f5c518;}
  .cover h1{font-size:36.8px;line-height:1.04;text-shadow:0 2px 9px rgba(0,0,0,.6),0 0 22px rgba(0,0,0,.5);}
  .cover.tsm h1{font-size:25.8px;}
  /* destaque da capa: roxo mais forte que o .hl padrão + a sombra do h1 por trás.
     O lilás claro sumia quando a arte de fundo era clara. */
  .cover .hl{color:#9b6bff;}
  .cover .body{text-shadow:0 1px 7px rgba(0,0,0,.65);}
  /* Capa: subtítulo entre o título e o corpo (maior que o texto, bem menor que o
     gancho), e a dica de swipe no canto direito. O .cover.gruda encosta o bloco
     no rodapé, deixando a arte inteira à mostra em cima. */
  .cover .subt{font-size:17px;line-height:1.18;font-weight:700;margin-top:9px;color:rgba(255,255,255,.93);
    position:relative;z-index:2;text-shadow:0 2px 8px rgba(0,0,0,.6);}
  .cover .swipe{align-self:flex-end;font-size:11.5px;font-weight:700;letter-spacing:.04em;margin-top:12px;
    color:rgba(255,255,255,.82);position:relative;z-index:2;text-shadow:0 1px 6px rgba(0,0,0,.7);}
  .cover.gruda .foot{margin-top:10px;}
  .body{font-size:12.5px;line-height:1.55;margin-top:10px;position:relative;z-index:2;}
  .dark .body{color:#b8b2cc;} .light .body{color:#6f6885;} .photo .body,.purple .body{color:#ece9f6;}
  .top{position:relative;z-index:2;} .grow{flex:1;}
  .callout{position:relative;z-index:2;margin-top:14px;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:13px 15px;background:rgba(255,255,255,.04);}
  .callout .lb{font-size:10px;font-weight:700;letter-spacing:.06em;color:#8f83f0;}
  .purple .callout .lb{color:#fff;} /* lilás sobre roxo some; no roxo o label vai de branco */
  .callout p{font-size:12px;line-height:1.5;color:#d7d3e6;margin-top:5px;font-style:italic;}
  /* O callout nasceu pros slides escuros: borda branca translúcida e texto claro.
     No slide claro isso vira cinza-claro sobre lilás-claro e some, então aqui ele
     inverte pras mesmas cores que o resto do .light já usa. */
  .light .callout{border-color:rgba(26,19,48,.14);background:rgba(26,19,48,.035);}
  .light .callout .lb{color:#6d3ad6;}
  .light .callout p{color:#4a4360;}
  .ico{width:22px;height:22px;flex-shrink:0;}
  .dark .ico{color:#a78bfa;} .light .ico{color:#6d3ad6;} .purple .ico{color:#fff;}
  .ico svg{width:100%;height:100%;display:block;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;}
  .ico svg .f{fill:currentColor;stroke:none;}
  .ico-lg{width:36px;height:36px;margin-bottom:15px;}
  .ico-badge{width:42px;height:42px;margin-bottom:14px;}
  .list{position:relative;z-index:2;margin-top:12px;}
  .item{display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-top:1px solid rgba(255,255,255,.09);}
  .light .item{border-top-color:rgba(0,0,0,.08);} .item:first-child{border-top:none;}
  .it-t{font-size:14px;font-weight:700;} .dark .it-t,.purple .it-t{color:#fff;} .light .it-t{color:#1a1330;}
  .it-s{font-size:11.5px;line-height:1.4;margin-top:1px;} .dark .it-s{color:#9a94ad;} .light .it-s{color:#7d7791;} .purple .it-s{color:rgba(255,255,255,.85);}
  .num{font-size:17px;font-weight:700;flex-shrink:0;width:24px;} .dark .num{color:#8f83f0;}
  /* .dense: prompt longo cabendo no slide (letra menor, entrelinha menor). Opt-in por slide. */
  .dense h1{font-size:25px;line-height:1.14;}
  .dense .callout p{font-size:10.2px;line-height:1.42;}
  .dense .term{font-size:10.2px;line-height:1.5;padding:11px 13px;}
  .dense .body{font-size:11px;line-height:1.45;}
  /* .shot: print da ferramenta numa janelinha de navegador (barra + 3 bolinhas). */
  /* estica até o rodapé: a janela ocupa o que sobrar do slide, sem vão morto. */
  .shot{position:relative;z-index:2;margin-top:12px;border-radius:9px;overflow:hidden;border:1px solid rgba(255,255,255,.14);flex:1;display:flex;flex-direction:column;min-height:0;}
  .light .shot{border-color:rgba(0,0,0,.12);box-shadow:0 6px 18px rgba(26,19,48,.13);}
  .shot .bar{height:15px;background:#241c38;display:flex;align-items:center;gap:4px;padding:0 7px;}
  .light .shot .bar{background:#d9d4ea;}
  .shot .bar i{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.32);display:block;}
  .light .shot .bar i{background:rgba(0,0,0,.22);}
  .shot .pic{flex:1;min-height:0;background-size:cover;background-position:top center;}
  /* pre-wrap: preserva a indentação de linha continuada (ex.: uma URL longa). */
  .term{position:relative;z-index:2;margin-top:12px;background:#14101f;border-radius:10px;padding:13px 15px;font-size:12.5px;line-height:1.75;white-space:pre-wrap;}
  .term .p{color:#8f83f0;} .term .g{color:#f5c518;} .term .w{color:#e6e6ee;}
  .brand{position:relative;z-index:2;display:flex;align-items:center;gap:7px;margin-top:16px;}
  .brand svg{width:25px;height:25px;display:block;stroke:none;}
  .brand span{font-size:14px;font-weight:700;letter-spacing:.01em;}
  .dark .brand span,.purple .brand span,.photo .brand span{color:#fff;} .light .brand span{color:#1a1330;}
  .center{align-items:center;justify-content:center;text-align:center;}
  .center h1{font-size:26px;} .center .body{text-align:center;}
  .center .ico{color:#6d3ad6;}
  .logo{position:relative;z-index:2;display:flex;align-items:center;gap:9px;font-size:12px;font-weight:700;letter-spacing:.08em;color:#fff;}
  .logo .dot{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#c4b5fd,#7c46d6);}
  .logo .ig{width:27px;height:27px;flex-shrink:0;display:block;}
  .logo .ig svg{width:100%;height:100%;display:block;stroke:currentColor;stroke-width:2;fill:none;stroke-linecap:round;stroke-linejoin:round;}
  .logo .ig svg .f{fill:currentColor;stroke:none;}
  .cta-btn{position:relative;z-index:2;margin-top:14px;align-self:flex-start;background:#fff;color:#5b21b6;font-weight:700;font-size:15px;padding:11px 18px;border-radius:11px;}
  .cta-rich{align-items:center;text-align:center;}
  .cta-rich .logo{justify-content:center;}
  .cta-rich h1{font-size:26.5px;line-height:1.18;}
  .cta-rich .cta-btn{align-self:center;margin-top:20px;border-radius:999px;font-size:16px;padding:13px 22px;}
  .cta-rich .body{margin-top:16px;max-width:300px;font-size:13px;}
  .logo-cta{align-items:center;gap:11px;}
  .logo-cta .lc{display:flex;flex-direction:column;line-height:1.18;text-align:left;}
  .logo-cta .nm{font-size:15px;font-weight:700;color:#fff;letter-spacing:.02em;}
  .logo-cta .lc-sub{font-size:12px;font-weight:400;color:rgba(255,255,255,.72);letter-spacing:.02em;}
  .chev{position:absolute;top:50%;transform:translateY(-50%);width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;z-index:3;}
  .chev.l{left:6px;} .chev.r{right:6px;}
  .dark .chev,.photo .chev,.purple .chev{background:rgba(255,255,255,.1);color:rgba(255,255,255,.55);}
  .light .chev{background:rgba(0,0,0,.05);color:rgba(0,0,0,.35);}
  .tag{position:absolute;top:22px;left:26px;z-index:3;font-size:10.5px;font-weight:700;letter-spacing:.05em;color:#e6e6ee;background:rgba(0,0,0,.42);padding:6px 11px;border-radius:999px;}
  .foot{position:relative;z-index:2;margin-top:14px;}
  .barrow{display:flex;align-items:center;gap:11px;}
  .track{flex:1;height:3px;border-radius:999px;position:relative;}
  .dark .track,.photo .track,.purple .track{background:rgba(255,255,255,.2);} .light .track{background:rgba(0,0,0,.1);}
  .fill{position:absolute;left:0;top:0;bottom:0;border-radius:999px;}
  .dark .fill,.photo .fill,.purple .fill{background:#fff;} .light .fill{background:#6d3ad6;}
  .count{font-size:11px;font-weight:700;} .dark .count,.photo .count,.purple .count{color:rgba(255,255,255,.85);} .light .count{color:#8b8598;}
  .dots{display:flex;gap:5px;justify-content:center;margin-top:9px;}
  .dots i{width:5px;height:5px;border-radius:50%;display:block;}
  .dark .dots i,.photo .dots i,.purple .dots i{background:rgba(255,255,255,.25);} .light .dots i{background:rgba(0,0,0,.15);}
  .dots i.on{width:16px;border-radius:3px;} .dark .dots i.on,.photo .dots i.on,.purple .dots i.on{background:#fff;} .light .dots i.on{background:#6d3ad6;}
`;

/**
 * **destaque** vira roxo; \n vira quebra de linha.
 * O `[\s\S]` (em vez de `.`) é de propósito: sem ele um destaque que atravessa
 * uma quebra de linha não casa e os asteriscos vazam pro slide renderizado.
 */
function realce(t: string): string {
  return t.replace(/\*\*([\s\S]+?)\*\*/g, '<span class="hl">$1</span>').replace(/\n/g, '<br>');
}

/** Uma linha de terminal: prefixo →/$/✓ colorido, resto branco. */
function termLine(line: string): string {
  const m = line.match(/^(\S+)\s+([\s\S]*)$/);
  if (m) {
    const tok = m[1];
    const cls = tok === '✓' ? 'g' : tok === '→' || tok === '$' ? 'p' : 'w';
    return `<div><span class="${cls}">${tok}</span> <span class="w">${m[2]}</span></div>`;
  }
  return `<div><span class="w">${line}</span></div>`;
}

/** Rodapé comum: barra de progresso + contador + bolinhas. */
function foot(i: number, n: number): string {
  const fill = Math.round(((i + 1) / n) * 100);
  const dots = Array.from({ length: n }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
  return `<div class="foot"><div class="barrow"><div class="track"><div class="fill" style="width:${fill}%"></div></div><div class="count">${i + 1}/${n}</div></div><div class="dots">${dots}</div></div>`;
}

/** Renderiza um slide a partir da definição. `shots` = data URI por caminho de `imagem`. */
function renderSlide(s: Slide, i: number, n: number, bg: string, shots: Record<string, string>): string {
  const isLast = i === n - 1;
  const cls = ['slide', s.variant, s.layout === 'center' ? 'center' : '', s.cover ? 'cover' : '', s.tituloMenor ? 'tsm' : '', s.gruda ? 'gruda' : '', s.tipo === 'cta' ? 'cta' : '', s.tipo === 'cta' && s.botao ? 'cta-rich' : '', s.denso ? 'dense' : ''].filter(Boolean).join(' ');
  const parts: string[] = [];

  // Fundo
  if (s.cover) {
    // `bgSize`/`bgPos` sobrescrevem o cover padrão. Servem pra arte QUADRADA: com
    // `cover` ela é escalada pela altura e sangra pelas laterais, e aí não há sobra
    // vertical pra reposicionar. Com `100% auto` + `center top` a imagem ocupa a
    // largura, encosta no topo e deixa o fundo do slide embaixo, onde entra o texto.
    const ajuste = `${s.bgSize ? `background-size:${s.bgSize};` : ''}${s.bgPos ? `background-position:${s.bgPos};` : ''}`;
    const coverBg = bg && !s.semFundo
      ? `background-image:url('${bg}');${ajuste}`
      : 'background:radial-gradient(120% 95% at 60% 8%,#3a1d4d 0%,#1a0f26 55%,#070410 100%)';
    parts.push(`<div class="imgbg" style="${coverBg}"></div><div class="scrim"></div>`);
  } else if (s.video) {
    parts.push(`<div class="imgbg" style="background:radial-gradient(120% 90% at 70% 15%,#2a1650 0%,#140a26 55%,#070410 100%)"></div>`);
    if (s.videoLabel) parts.push(`<div class="tag">${s.videoLabel}</div>`);
    parts.push(`<div class="scrim"></div>`);
  } else if (s.topbleed && bg) {
    parts.push(`<div class="topbleed" style="background-image:url('${bg}')"></div>`);
  }

  // Setas
  if (i > 0) parts.push('<div class="chev l">&lsaquo;</div>');
  if (!isLast) parts.push('<div class="chev r">&rsaquo;</div>');

  // Conteúdo
  if (s.tipo === 'cta') {
    if (s.logo) {
      const ig = `<span class="ig"><svg viewBox="0 0 24 24">${iconInner('instagram')}</svg></span>`;
      const inner = s.handle
        ? `${ig}<span class="lc"><span class="nm">${s.logo}</span><span class="lc-sub">${s.handle}</span></span>`
        : `${ig} ${s.logo}`;
      parts.push(`<div class="logo${s.handle ? ' logo-cta' : ''}"${s.video ? ' style="margin-top:24px"' : ''}>${inner}</div>`);
    }
    parts.push('<div class="grow"></div>');
    // Título vazio some do CTA (em vez de virar um <h1> em branco ocupando altura):
    // é como se pede o layout "botão em cima, texto embaixo", sem frase antes.
    if (s.titulo) parts.push(`<h1>${realce(s.titulo)}</h1>`);
    if (s.botao) parts.push(`<div class="cta-btn">${s.botao}</div>`);
    if (s.corpo) parts.push(`<div class="body">${realce(s.corpo)}</div>`);
    if (s.botao) parts.push('<div class="grow"></div>');
  } else if (s.layout === 'center') {
    if (s.icone) parts.push(`<div class="ico ico-lg"><svg viewBox="0 0 24 24">${iconInner(s.icone)}</svg></div>`);
    parts.push(`<h1>${realce(s.titulo)}</h1>`);
    if (s.corpo) parts.push(`<div class="body">${realce(s.corpo)}</div>`);
    parts.push('<div class="grow"></div>');
  } else if (s.cover) {
    parts.push('<div class="grow"></div>');
    // `tituloEscala` calibra a capa DESTE carrossel sem mexer no tamanho padrão
    // (36.8px, ou 25.8px com `tituloMenor`), que outros carrosséis já usam.
    const base = s.tituloMenor ? 25.8 : 36.8;
    const escala = s.tituloEscala ? ` style="font-size:${(base * s.tituloEscala).toFixed(1)}px"` : '';
    parts.push(`<h1${escala}>${realce(s.titulo)}</h1>`);
    if (s.subtitulo) parts.push(`<div class="subt">${realce(s.subtitulo)}</div>`);
    if (s.corpo) parts.push(`<div class="body">${realce(s.corpo)}</div>`);
    if (s.swipe) parts.push(`<div class="swipe">${s.swipe}</div>`);
  } else {
    const top: string[] = ['<div class="top">'];
    if (s.topIcon) top.push(`<div class="ico ico-badge"><svg viewBox="0 0 24 24">${iconInner(s.topIcon)}</svg></div>`);
    if (s.eyebrow) top.push(`<div class="eyebrow">${s.eyebrow}</div>`);
    top.push(`<h1>${realce(s.titulo)}</h1>`);
    const hasBloco = !!(s.itens || s.steps || s.terminal || s.callout);
    if (s.corpo && !hasBloco) top.push(`<div class="body">${realce(s.corpo)}</div>`);
    if (s.callout) top.push(`<div class="callout"><div class="lb">${s.calloutLabel ?? ''}</div><p>${s.callout}</p></div>`);
    if (s.itens) {
      top.push('<div class="list">');
      for (const it of s.itens) top.push(`<div class="item">${svgIcon(it.icone)}<div><div class="it-t">${it.titulo}</div><div class="it-s">${it.sub}</div></div></div>`);
      top.push('</div>');
    }
    if (s.steps) {
      top.push('<div class="list">');
      for (const st of s.steps) top.push(`<div class="item"><div class="num">${st.n}</div><div><div class="it-t">${st.titulo}</div><div class="it-s">${st.sub}</div></div></div>`);
      top.push('</div>');
    }
    if (s.terminal) top.push(`<div class="term">${s.terminal.map(termLine).join('')}</div>`);
    if (s.corpo && hasBloco) top.push(`<div class="body" style="margin-top:12px">${realce(s.corpo)}</div>`);
    top.push('</div>');
    parts.push(top.join(''));
    // O print entra por último (título, explicação, só então a janelinha) e FORA
    // do bloco de texto, pra poder esticar e ocupar o resto do slide.
    const shot = s.imagem ? shots[s.imagem] : undefined;
    if (shot) {
      parts.push(`<div class="shot"><div class="bar"><i></i><i></i><i></i></div><div class="pic" style="background-image:url('${shot}')"></div></div>`);
    } else {
      parts.push('<div class="grow"></div>');
    }
  }

  // Logo de marca no rodapé (ex.: git), acima do chrome.
  const brand = s.brandLogo ? BRANDS[s.brandLogo] : undefined;
  if (brand) {
    parts.push(
      `<div class="brand"><svg viewBox="0 0 24 24" style="fill:${brand.color}">${brand.path}</svg>${brand.label ? `<span>${brand.label}</span>` : ''}</div>`,
    );
  }

  parts.push(foot(i, n));
  return `<div class="${cls}">${parts.join('')}</div>`;
}

/** interior do svg do ícone central (reaproveita o mapa via svgIcon). */
function iconInner(nome: string): string {
  const m = svgIcon(nome).match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return m ? m[1] : '';
}

/**
 * Monta o HTML completo do carrossel. `bgDataUri` = capa/sangria inline (ou '');
 * `shots` = data URI de cada `slide.imagem`, indexado pelo caminho declarado.
 */
export function buildHtml(car: Carrossel, bgDataUri: string, shots: Record<string, string> = {}): string {
  const n = car.slides.length;
  const slides = car.slides.map((s, i) => renderSlide(s, i, n, bgDataUri, shots)).join('\n');
  return `<!doctype html>
<html lang="pt-br"><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Ubuntu+Mono:wght@400;700&display=swap" rel="stylesheet">
<style>${CSS}</style></head>
<body>${slides}</body></html>`;
}
