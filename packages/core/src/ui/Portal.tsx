import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

/**
 * Renderiza os filhos num portal preso ao `<body>`, fora do fluxo e do stacking
 * context da árvore atual. Serve overlays/modais que precisam cobrir TUDO
 * (inclusive a sidebar): escapa de ancestrais com `transform`/`overflow`/`filter`
 * (ex.: o `<main animate-rise>` do AppShell) que, de outra forma, confinariam um
 * elemento `position: fixed` à área de conteúdo. No-op sem DOM (SSR/headless).
 */
export function Portal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}
