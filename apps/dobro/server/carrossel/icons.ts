/**
 * apps/dobro — ícones SVG (linha) do carrossel. Emoji NÃO renderiza no headless,
 * então listas/ícones usam sempre SVG. Cada entrada é o INTERIOR de um
 * `<svg viewBox="0 0 24 24">…</svg>`. `.f` = preenchido; o resto é stroke.
 */
export const ICONS: Record<string, string> = {
  bookmark: '<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>',
  video: '<circle cx="12" cy="12" r="9"/><path class="f" d="M10 8l6 4-6 4z"/>',
  mouse: '<rect x="6" y="3" width="12" height="18" rx="6"/><line x1="12" y1="7" x2="12" y2="10.5"/>',
  code: '<path d="M8 6l-5 6 5 6"/><path d="M16 6l5 6-5 6"/>',
  // Branch de git em traço. O `git` colorido vive em BRANDS (rodapé de marca) e
  // NÃO serve pra lista de itens, que usa currentColor — sem esta entrada o
  // primeiro ícone do slide saía vazio.
  git: '<line x1="6" y1="4" x2="6" y2="14"/><circle cx="6" cy="18" r="2.6"/><circle cx="17" cy="6" r="2.6"/><path d="M17 8.6a8 8 0 0 1-8 8"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  laptop: '<rect x="4" y="5" width="16" height="11" rx="1.5"/><path d="M2 20h20"/>',
  ai: '<path class="f" d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>',
  film: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9h16M4 15h16M9 4v16M15 4v16"/>',
  cloudrain: '<line x1="16" y1="17" x2="16" y2="21"/><line x1="8" y1="17" x2="8" y2="21"/><line x1="12" y1="19" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>',
  ghost: '<path d="M5 21V10a7 7 0 0 1 14 0v11l-2.5-2-2.5 2-2-2-2 2z"/><circle class="f" cx="9.5" cy="10.5" r="1"/><circle class="f" cx="14.5" cy="10.5" r="1"/>',
  camera: '<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  layers: '<path d="M12 2l10 5-10 5L2 7z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  follow: '<circle cx="12" cy="12" r="9"/><path d="M12 8.5v7"/><path d="M8.5 12h7"/>',
  ban: '<circle cx="12" cy="12" r="9"/><line x1="5.6" y1="5.6" x2="18.4" y2="18.4"/>',
  car: '<path d="M5 13l1.5-4A2 2 0 0 1 8.4 8h7.2a2 2 0 0 1 1.9 1.3L19 13v4H5z"/><circle cx="8" cy="17" r="1.3"/><circle cx="16" cy="17" r="1.3"/>',
  map: '<path d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4z"/><path d="M9 4v13M15 6.5v13"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle class="f" cx="17.2" cy="6.8" r="1.2"/>',
  skull: '<path d="M12 3a7 7 0 0 0-7 7v3a2 2 0 0 0 1.2 1.8l.8.4V18a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-2.8l.8-.4A2 2 0 0 0 19 13v-3a7 7 0 0 0-7-7z"/><circle class="f" cx="9.3" cy="11.2" r="1.6"/><circle class="f" cx="14.7" cy="11.2" r="1.6"/><path class="f" d="M12 13.8l-.9 1.8h1.8z"/>',
  robot: '<rect x="4" y="8" width="16" height="12" rx="2"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1.3"/><circle class="f" cx="9.2" cy="13" r="1.3"/><circle class="f" cx="14.8" cy="13" r="1.3"/><path d="M2 12v3M22 12v3"/>',
  loop: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/>',
  puzzle: '<path d="M9 4.5a1.8 1.8 0 0 1 3.6 0c0 .3-.1.6-.2.9h2.6a1 1 0 0 1 1 1v2.6c.3-.1.6-.2.9-.2a1.8 1.8 0 0 1 0 3.6c-.3 0-.6-.1-.9-.2v3.3a1 1 0 0 1-1 1h-3.3c.1.3.2.6.2.9a1.8 1.8 0 0 1-3.6 0c0-.3.1-.6.2-.9H6.5a1 1 0 0 1-1-1v-2.6c-.3.1-.6.2-.9.2a1.8 1.8 0 0 1 0-3.6c.3 0 .6.1.9.2V6.4a1 1 0 0 1 1-1h2.6c-.1-.3-.2-.6-.2-.9z"/>',
};

/** Monta o `<div class="ico">…</div>` de um ícone (fallback: quadrado vazio). */
export function svgIcon(nome: string): string {
  const inner = ICONS[nome] ?? '';
  return `<div class="ico"><svg viewBox="0 0 24 24">${inner}</svg></div>`;
}

/**
 * Logos de marca (colorido, com fill próprio) para o rodapé de um slide. Diferente
 * de ICONS (monocromático via currentColor): cada marca traz sua própria cor.
 * `path` = interior do `<svg viewBox="0 0 24 24">`; `label` = wordmark opcional.
 */
export const BRANDS: Record<string, { path: string; color: string; label?: string }> = {
  // Git logo (Jason Long, simple-icons), fill único na laranja oficial.
  git: {
    path:
      '<path d="M23.546 10.93L13.067.452c-.604-.603-1.582-.603-2.188 0L8.708 2.627l2.76 2.76c.645-.215 1.379-.07 1.889.441.516.515.658 1.258.438 1.9l2.658 2.66c.645-.223 1.387-.078 1.9.435.721.72.721 1.884 0 2.604-.719.719-1.881.719-2.6 0-.539-.541-.674-1.337-.404-1.996L12.86 8.955v6.525c.176.086.342.203.488.348.713.721.713 1.883 0 2.6-.719.721-1.889.721-2.609 0-.719-.719-.719-1.879 0-2.598.177-.176.383-.309.602-.396V8.882c-.219-.086-.425-.221-.602-.398-.543-.545-.674-1.342-.4-2.002L7.636 3.767 1.05 10.353c-.603.604-.603 1.582 0 2.187l10.48 10.477c.604.604 1.582.604 2.186 0l10.43-10.43c.605-.603.605-1.582 0-2.187"/>',
    color: '#F05032',
    label: 'git',
  },
};
