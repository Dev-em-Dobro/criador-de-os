/**
 * Tipos genéricos do design system (@os/core/ui).
 * SÓ tipos genéricos — nada específico de domínio ou de cliente.
 */

/** Status de um indicador em relação à sua meta. */
export type IndicatorStatus = 'green' | 'yellow' | 'red';

/** Período de agregação usado pelo filtro de período. */
export type Period = 'weekly' | 'monthly' | 'quarterly';

/**
 * Dados de um card de KPI. Genérico: descreve valor, meta, unidade e tendência,
 * sem acoplar a nenhuma métrica ou domínio de cliente.
 */
export interface KpiCardData {
  /** Identificador estável do card (usado como key). */
  id: string;
  /** Rótulo curto exibido no topo do card. */
  label: string;
  /** Valor atual. */
  value: number;
  /** Meta/target de referência. */
  target: number;
  /** Unidade para formatação ('%', 'x', 'R$', 'count' ou custom). */
  unit: string;
  /** Valor do período anterior (para variação % e tendência). */
  previousValue?: number;
  /** Série para o mini-gráfico de tendência (opcional). */
  trendData?: number[];
  /** Plataforma/origem (rótulo livre, opcional). */
  platform?: string;
  /** Texto do tooltip do ícone (i) ao lado do rótulo. */
  tooltip?: string;
}
