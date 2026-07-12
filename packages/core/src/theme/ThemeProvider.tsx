import type { CSSProperties, ReactNode } from 'react';
import type { Theme } from './types';
import { THEME_CSS_VARS } from './types';

interface ThemeProviderProps {
  /** Tema do cliente. Campos ausentes herdam o default de `theme/base.css`. */
  theme?: Theme;
  /** Se `true`, aplica os tokens no `:root` (documentElement) além do wrapper.
   *  Útil para que utilities globais (body glow, ::selection) também herdem a
   *  cor do cliente. Default: `false` (escopo apenas no wrapper). */
  applyToRoot?: boolean;
  children: ReactNode;
}

/** Converte um Theme parcial no objeto de style com as CSS custom properties. */
function themeToStyle(theme: Theme | undefined): CSSProperties {
  const style: Record<string, string> = {};
  if (!theme) return style as CSSProperties;

  for (const key of Object.keys(THEME_CSS_VARS) as (keyof Theme)[]) {
    const value = theme[key];
    if (value != null && value !== '') {
      style[THEME_CSS_VARS[key]] = value;
    }
  }
  return style as CSSProperties;
}

/**
 * ThemeProvider — injeta as cores do cliente como CSS custom properties.
 *
 * As utilities do Tailwind (`blue-*`, `text-brand`, gradientes de marca) foram
 * definidas em `base.css` para derivar de `--color-brand` e afins. Ao setar
 * essas variáveis num wrapper, todo o conteúdo abaixo herda a cor do cliente
 * sem precisar recompilar o CSS.
 *
 * Uso típico:
 *   <ThemeProvider theme={{ brand: '#0ea5e9' }} applyToRoot>
 *     <AppShell ... />
 *   </ThemeProvider>
 */
export function ThemeProvider({ theme, applyToRoot = false, children }: ThemeProviderProps) {
  const style = themeToStyle(theme);

  // Quando pedido, propaga os tokens para :root para que efeitos globais
  // (body::before glow, ::selection) também sigam a marca do cliente.
  const rootStyleTag =
    applyToRoot && Object.keys(style).length > 0 ? (
      <style
        // Serializa as custom properties direto em :root. Só as chaves conhecidas
        // (THEME_CSS_VARS) entram, então não há risco de injeção arbitrária.
        dangerouslySetInnerHTML={{
          __html: `:root{${Object.entries(style)
            .map(([prop, val]) => `${prop}:${val}`)
            .join(';')}}`,
        }}
      />
    ) : null;

  return (
    <>
      {rootStyleTag}
      <div style={style} data-os-theme="">
        {children}
      </div>
    </>
  );
}
