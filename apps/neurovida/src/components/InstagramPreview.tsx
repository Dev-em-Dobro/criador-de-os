/**
 * apps/neurovida — preview de carrossel no formato Instagram.
 *
 * Renderiza os slides (texto) gerados pelo Estúdio IA como um POST navegável do
 * Instagram: frame do feed (header + carrossel com dots/setas/swipe + ações +
 * legenda), com os slides estilizados na identidade da Neurovida (esmeralda +
 * creme + serifa). As cores são FIXAS de propósito — um post parece um post em
 * qualquer tema (não herda o skin creme/dusk).
 */

import { useRef, useState } from 'react';

interface Slide {
  titulo: string;
  corpo: string;
}

interface InstagramPreviewProps {
  titulo: string;
  slides: Slide[];
  legenda?: string;
  hashtags?: string[];
  marca?: string;
  handle?: string;
}

// Paleta da marca (fixa — o post não segue o skin).
const BRAND = '#059669';
const BRAND_BRIGHT = '#10b981';
const BRAND_STRONG = '#047857';
const BRAND_DEEP = '#065f46';
const CREME = '#faf8f3';
const INK = '#22302a';
const SERIF = "'Fraunces', Georgia, serif";

/** Um slide estilizado (capa/CTA em esmeralda; internos em creme). */
function SlideCard({ slide, index, total, marca, handle }: { slide: Slide; index: number; total: number; marca: string; handle: string }) {
  const isCapa = index === 0;
  const isCTA = index === total - 1 && total > 1;
  const escuro = isCapa || isCTA;

  const bg = escuro
    ? `linear-gradient(150deg, ${BRAND_DEEP} 0%, ${BRAND_STRONG} 55%, ${BRAND} 100%)`
    : CREME;
  const corTitulo = escuro ? '#ffffff' : BRAND_DEEP;
  const corCorpo = escuro ? 'rgba(255,255,255,.92)' : INK;

  return (
    <div
      style={{
        flex: 'none',
        width: '100%',
        height: '100%',
        background: bg,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: 26,
        boxSizing: 'border-box',
      }}
    >
      {/* Número gigante como marca-d'água */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -22,
          right: 6,
          fontFamily: SERIF,
          fontSize: 150,
          fontWeight: 600,
          lineHeight: 1,
          color: escuro ? 'rgba(255,255,255,.09)' : 'rgba(6,95,70,.06)',
        }}
      >
        {index + 1}
      </span>

      {/* Etiqueta do topo */}
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.18em',
          textTransform: 'uppercase',
          color: escuro ? 'rgba(255,255,255,.82)' : BRAND,
        }}
      >
        {isCapa ? `${marca} · comece por aqui` : isCTA ? marca : `Slide ${index + 1} de ${total}`}
      </div>

      {/* Conteúdo (ancorado embaixo) */}
      <div style={{ marginTop: 'auto' }}>
        <h3
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            color: corTitulo,
            fontSize: isCapa ? 27 : 21,
            lineHeight: 1.12,
            letterSpacing: '-.01em',
            margin: 0,
          }}
        >
          {slide.titulo}
        </h3>
        {slide.corpo && (
          <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.5, color: corCorpo }}>{slide.corpo}</p>
        )}
      </div>

      {/* Rodapé com o handle */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: escuro ? 'rgba(255,255,255,.78)' : '#8a938c',
        }}
      >
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: escuro ? '#fff' : BRAND }} />
        {handle}
      </div>
    </div>
  );
}

/** Seta de navegação sobreposta ao carrossel. */
function NavArrow({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Slide anterior' : 'Próximo slide'}
      style={{
        position: 'absolute',
        top: '50%',
        left: dir === 'left' ? 8 : undefined,
        right: dir === 'right' ? 8 : undefined,
        transform: 'translateY(-50%)',
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: 'none',
        background: 'rgba(255,255,255,.9)',
        color: '#12201a',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        fontSize: 17,
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {dir === 'left' ? '‹' : '›'}
    </button>
  );
}

const IG_PATHS: Record<string, string> = {
  heart: 'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z',
  comment: 'M21 11.5a8.4 8.4 0 0 1-8.5 8.4 8.6 8.6 0 0 1-3.9-.9L3 21l1.9-5.6a8.4 8.4 0 1 1 16.1-3.9z',
  share: 'M22 2 11 13M22 2l-7 20-4-9-9-4z',
  save: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
};

function IgIcon({ name }: { name: keyof typeof IG_PATHS }) {
  return (
    <svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="#12201a" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={IG_PATHS[name]} />
    </svg>
  );
}

export function InstagramPreview({
  titulo,
  slides,
  legenda,
  hashtags = [],
  marca = 'Lirane Suliano',
  handle = '@liranesuliano',
}: InstagramPreviewProps) {
  const [idx, setIdx] = useState(0);
  const n = slides.length;
  const go = (k: number) => setIdx(Math.max(0, Math.min(n - 1, k)));

  const [dragX, setDragX] = useState<number | null>(null);
  function onPointerUp(clientX: number) {
    if (dragX === null) return;
    const dx = clientX - dragX;
    if (dx < -45) go(idx + 1);
    else if (dx > 45) go(idx - 1);
    setDragX(null);
  }

  // Export PNG 1080×1350: renderiza cada slide em 420×525 (stage off-screen) e
  // escala com pixelRatio (1080/420) — mesma matemática do device_scale_factor.
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [exporting, setExporting] = useState(false);
  const [expErro, setExpErro] = useState<string | null>(null);

  async function exportarPNGs(): Promise<void> {
    setExporting(true);
    setExpErro(null);
    try {
      // libs pesadas (html-to-image + jszip) só carregam ao exportar → bundle inicial leve
      const [{ toPng }, JSZip] = await Promise.all([
        import('html-to-image'),
        import('jszip').then((m) => m.default),
      ]);
      await document.fonts.ready; // garante a serifa carregada antes do print
      const zip = new JSZip();
      for (let i = 0; i < n; i++) {
        const el = exportRefs.current[i];
        if (!el) continue;
        const dataUrl = await toPng(el, { width: 420, height: 525, pixelRatio: 1080 / 420, cacheBust: true });
        zip.file(`slide_${String(i + 1).padStart(2, '0')}.png`, dataUrl.split(',')[1], { base64: true });
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const slug =
        (titulo || 'carrossel')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 50) || 'carrossel';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carrossel-${slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setExpErro(e instanceof Error ? e.message : 'Falha ao gerar as imagens.');
    } finally {
      setExporting(false);
    }
  }

  if (n === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        role="group"
        aria-roledescription="carrossel"
        aria-label={`Prévia do post: ${titulo}`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(idx + 1);
          else if (e.key === 'ArrowLeft') go(idx - 1);
        }}
        tabIndex={0}
        style={{
          width: 400,
          maxWidth: '100%',
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 24px 60px -24px rgba(6,32,24,.5)',
          border: '1px solid #ecefe9',
          fontFamily: "'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif",
        }}
      >
        {/* Header do post */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderBottom: '1px solid #f0f2ee' }}>
          <div
            aria-hidden="true"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${BRAND_BRIGHT}, ${BRAND_DEEP})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontFamily: SERIF,
              fontSize: 17,
              flex: 'none',
            }}
          >
            {marca.charAt(0).toUpperCase()}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#12201a' }}>{marca}</div>
            <div style={{ fontSize: 11, color: '#8a938c' }}>{handle}</div>
          </div>
          <div style={{ marginLeft: 'auto', color: '#c2c9c2', fontWeight: 700, letterSpacing: 1 }} aria-hidden="true">
            •••
          </div>
        </div>

        {/* Carrossel (4:5) */}
        <div
          style={{ position: 'relative', width: '100%', aspectRatio: '4 / 5', overflow: 'hidden', touchAction: 'pan-y', userSelect: 'none', cursor: 'grab' }}
          onPointerDown={(e) => setDragX(e.clientX)}
          onPointerUp={(e) => onPointerUp(e.clientX)}
        >
          <div
            style={{
              display: 'flex',
              height: '100%',
              transform: `translateX(-${idx * 100}%)`,
              transition: 'transform .38s cubic-bezier(.22,.7,.2,1)',
            }}
          >
            {slides.map((s, i) => (
              <SlideCard key={i} slide={s} index={i} total={n} marca={marca} handle={handle} />
            ))}
          </div>

          {idx > 0 && <NavArrow dir="left" onClick={() => go(idx - 1)} />}
          {idx < n - 1 && <NavArrow dir="right" onClick={() => go(idx + 1)} />}

          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(10,20,16,.55)', color: '#fff', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999 }}>
            {idx + 1}/{n}
          </div>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, padding: '10px 0 4px' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir para o slide ${i + 1}`}
              onClick={() => go(i)}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                background: i === idx ? BRAND : '#d3dad3',
                transform: i === idx ? 'scale(1.25)' : 'none',
                transition: 'all .2s',
              }}
            />
          ))}
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, padding: '8px 14px 2px' }}>
          <IgIcon name="heart" />
          <IgIcon name="comment" />
          <IgIcon name="share" />
          <span style={{ marginLeft: 'auto', display: 'inline-flex' }}>
            <IgIcon name="save" />
          </span>
        </div>

        {/* Legenda */}
        <div style={{ padding: '6px 14px 15px', fontSize: 13, lineHeight: 1.45, color: '#2a352e' }}>
          <b style={{ color: '#12201a' }}>{handle.replace('@', '')}</b> {legenda || titulo}
          {hashtags.length > 0 && (
            <div style={{ marginTop: 6, color: BRAND_STRONG }}>
              {hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ')}
            </div>
          )}
          <span style={{ display: 'block', marginTop: 7, fontSize: 10, letterSpacing: '.5px', color: '#9aa39b', textTransform: 'uppercase' }}>Agora</span>
        </div>
      </div>

      <p className="mt-2.5 text-xs text-gray-500">Prévia de feed · arraste, use as setas ou os pontinhos pra navegar</p>

      {/* Baixar como PNG 1080×1350 (pronto pro Instagram) */}
      <button
        type="button"
        onClick={() => void exportarPNGs()}
        disabled={exporting}
        className="mt-3 rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {exporting ? 'Gerando imagens…' : `Baixar ${n} imagens (1080×1350 · .zip)`}
      </button>
      {expErro && <p role="alert" className="mt-2 text-xs text-red-400">{expErro}</p>}

      {/* Stage de export (fora da tela): cada slide em 420×525 pro screenshot */}
      <div aria-hidden="true" style={{ position: 'fixed', left: -99999, top: 0, pointerEvents: 'none' }}>
        {slides.map((s, i) => (
          <div
            key={i}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
            style={{ width: 420, height: 525, overflow: 'hidden' }}
          >
            <SlideCard slide={s} index={i} total={n} marca={marca} handle={handle} />
          </div>
        ))}
      </div>
    </div>
  );
}
