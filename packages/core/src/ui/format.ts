import type { IndicatorStatus } from './types';

/**
 * Utilitários de formatação e cores de indicador do design system.
 * Portado de forma genérica (sem nada específico de cliente).
 */

/** Deriva o status (verde/amarelo/vermelho) a partir de valor vs. meta. */
export function getIndicatorColor(value: number, target: number): IndicatorStatus {
  if (target === 0) return 'green';
  const ratio = value / target;
  if (ratio >= 1) return 'green';
  if (ratio >= 0.7) return 'yellow';
  return 'red';
}

/** Classes do card por status (fundo/texto/borda). */
export const indicatorStyles: Record<IndicatorStatus, string> = {
  green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  yellow: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  red: 'bg-red-500/10 text-red-400 border-red-500/30',
};

/** Cor do "dot" de status por status. */
export const indicatorDotStyles: Record<IndicatorStatus, string> = {
  green: 'bg-emerald-400',
  yellow: 'bg-yellow-400',
  red: 'bg-red-400',
};

/** Cor da barra de progresso por status. */
export const progressBarStyles: Record<IndicatorStatus, string> = {
  green: 'bg-emerald-500',
  yellow: 'bg-yellow-500',
  red: 'bg-red-500',
};

/** Ícone textual de tendência (↑ ↓ →) comparando atual vs. anterior. */
export function getTrendIcon(current: number, previous?: number): string {
  if (previous === undefined) return '→';
  if (current > previous) return '↑';
  if (current < previous) return '↓';
  return '→';
}

/** Classe de cor de tendência comparando atual vs. anterior. */
export function getTrendColor(current: number, previous?: number): string {
  if (previous === undefined) return 'text-gray-400';
  if (current > previous) return 'text-emerald-400';
  if (current < previous) return 'text-red-400';
  return 'text-gray-400';
}

/**
 * Formata um valor numérico conforme a unidade.
 * Unidades suportadas: '%', 'x', 'R$', 'count' (senão, retorna o número cru).
 * Observação: usa locale pt-BR para milhares/decimais (padrão do produto).
 */
export function formatValue(value: number, unit: string): string {
  switch (unit) {
    case '%': {
      const decimals = Math.abs(value) < 1 ? 2 : 1;
      return `${value.toFixed(decimals)}%`;
    }
    case 'x':
      return `${value.toFixed(1)}x`;
    case 'R$':
      return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    case 'count':
      return value.toLocaleString('pt-BR');
    default:
      return value.toString();
  }
}
