/**
 * @os/scaffolder — utilidades puras (sem I/O de negócio).
 *
 * String helpers (slug/case), manipulação de hex para derivar a paleta do tema a
 * partir de uma única cor de marca, e serialização de valores JS para código TS
 * legível no arquivo gerado.
 */

/** Normaliza um texto livre para um slug kebab-case seguro (a-z, 0-9, hífen). */
export function toKebab(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** Converte um slug/identificador em snake_case (para nomes de tabela/coluna). */
export function toSnake(input: string): string {
  return toKebab(input).replace(/-/g, '_');
}

/** PascalCase de um texto (para nomes de símbolo, ex.: variável do manifesto). */
export function toPascal(input: string): string {
  return toKebab(input)
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

/** camelCase de um texto (ex.: `neurovidaManifest`). */
export function toCamel(input: string): string {
  const p = toPascal(input);
  return p.charAt(0).toLowerCase() + p.slice(1);
}

/** True se `s` é um slug kebab-case válido (o que o scaffolder aceita como pasta). */
export function isValidSlug(s: string): boolean {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(s);
}

// ============================================================
// Cor — deriva uma paleta coerente a partir de uma única cor de marca
// ============================================================

function clamp(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return null;
  const int = parseInt(m[1], 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function toHex(rgb: [number, number, number]): string {
  return '#' + rgb.map((c) => clamp(c).toString(16).padStart(2, '0')).join('');
}

/** Mistura `rgb` com branco (`amount` 0..1) — clareia. */
function lighten(rgb: [number, number, number], amount: number): [number, number, number] {
  return [
    rgb[0] + (255 - rgb[0]) * amount,
    rgb[1] + (255 - rgb[1]) * amount,
    rgb[2] + (255 - rgb[2]) * amount,
  ];
}

/** Mistura `rgb` com preto (`amount` 0..1) — escurece. */
function darken(rgb: [number, number, number], amount: number): [number, number, number] {
  return [rgb[0] * (1 - amount), rgb[1] * (1 - amount), rgb[2] * (1 - amount)];
}

/**
 * A partir de UMA cor de marca (hex), deriva as 5 variações que o tema do core
 * usa (bright/soft/strong/deep), mais o verde de sinal (default). O operador
 * pode sobrescrever qualquer uma depois. Se `brand` for inválido, devolve só o
 * que der para validar (o ThemeProvider tem defaults neutros).
 */
export function derivePalette(brand: string, signal?: string): {
  brand: string;
  brandBright: string;
  brandSoft: string;
  brandStrong: string;
  brandDeep: string;
  signal: string;
} {
  const rgb = parseHex(brand);
  const safeSignal = signal && parseHex(signal) ? signal : '#22c55e';
  if (!rgb) {
    // Fallback: marca neutra do core (evita gerar tema quebrado).
    return {
      brand: '#4f46e5',
      brandBright: '#6366f1',
      brandSoft: '#a5b4fc',
      brandStrong: '#4338ca',
      brandDeep: '#3730a3',
      signal: safeSignal,
    };
  }
  return {
    brand: toHex(rgb),
    brandBright: toHex(lighten(rgb, 0.18)),
    brandSoft: toHex(lighten(rgb, 0.45)),
    brandStrong: toHex(darken(rgb, 0.14)),
    brandDeep: toHex(darken(rgb, 0.28)),
    signal: safeSignal,
  };
}

// ============================================================
// Serialização para código-fonte gerado
// ============================================================

/**
 * Serializa um valor JS para um literal de objeto TS legível.
 *
 * Usa JSON como base (garantidamente válido como literal TS) e depois remove as
 * aspas das CHAVES que são identificadores simples, para o arquivo gerado ficar
 * idiomático (`brand:` em vez de `"brand":`). Valores (strings, refs) preservam
 * suas aspas. Determinístico — não usa Date/random.
 */
export function serializeToTs(value: unknown, indent = 2): string {
  const json = JSON.stringify(value, null, indent);
  // Desaspar apenas chaves que são identificadores JS válidos.
  return json.replace(/^(\s*)"([A-Za-z_$][A-Za-z0-9_$]*)":/gm, '$1$2:');
}
