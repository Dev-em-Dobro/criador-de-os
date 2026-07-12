/**
 * Contrato de tema do @os/core.
 *
 * O tema é injetado como CSS custom properties (ver ThemeProvider). Todos os
 * campos são opcionais: o que não for informado herda o default definido em
 * `theme/base.css` (:root). Assim cada cliente pinta o OS só com o que muda.
 */
export interface Theme {
  /** Cor de marca principal (--color-brand). Base do acento `blue-500`. */
  brand?: string;
  /** Variante clara/brilhante da marca (--color-brand-bright ≈ `blue-400`). */
  brandBright?: string;
  /** Variante suave/pastel da marca (--color-brand-soft ≈ `blue-300`). */
  brandSoft?: string;
  /** Variante escura da marca (--color-brand-strong ≈ `blue-600`). */
  brandStrong?: string;
  /** Variante mais profunda da marca (--color-brand-deep ≈ `blue-700`). */
  brandDeep?: string;
  /** Cor de "sinal" (status online, sucesso) (--color-signal). */
  signal?: string;
  /** Cor de fundo do OS (--os-bg). */
  background?: string;
}

/**
 * Mapa Theme → nome da CSS custom property.
 * Fonte única da verdade usada pelo ThemeProvider para montar o style inline.
 */
export const THEME_CSS_VARS: Record<keyof Theme, string> = {
  brand: '--color-brand',
  brandBright: '--color-brand-bright',
  brandSoft: '--color-brand-soft',
  brandStrong: '--color-brand-strong',
  brandDeep: '--color-brand-deep',
  signal: '--color-signal',
  background: '--os-bg',
};
