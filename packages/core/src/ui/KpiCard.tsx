import { useState } from 'react';
import type { KpiCardData } from './types';
import {
  getIndicatorColor,
  indicatorStyles,
  progressBarStyles,
  getTrendColor,
  formatValue,
} from './format';
import { StatusIndicator } from './StatusIndicator';

interface KpiCardProps {
  data: KpiCardData;
}

/** Variação percentual (atual vs. anterior) com seta e cor semântica. */
function PercentChange({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const isPositive = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        isPositive ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      <span>{isPositive ? '▲' : '▼'}</span>
      {Math.abs(change).toFixed(1)}%
    </span>
  );
}

/** Card de KPI com valor, variação, barra de progresso e meta. */
export function KpiCard({ data }: KpiCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const status = getIndicatorColor(data.value, data.target);
  const trendColor = getTrendColor(data.value, data.previousValue);
  const progressPct = Math.min((data.value / data.target) * 100, 100);

  return (
    <div
      className={`group relative rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:shadow-[0_16px_40px_-22px_rgba(5,5,12,0.9)] hover:border-blue-500/25 overflow-visible bg-gray-800/60 backdrop-blur-sm ${indicatorStyles[status]}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wide flex items-center gap-1">
          {data.label}
          {data.tooltip && (
            <button
              type="button"
              className="relative inline-flex items-center justify-center w-5 h-5 -m-1 rounded-full cursor-help"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              onClick={() => setShowTooltip((v) => !v)}
              aria-label={`Mais informações: ${data.tooltip}`}
              aria-expanded={showTooltip}
            >
              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-600 text-gray-300 text-[10px] font-bold hover:bg-gray-500"
              >
                i
              </span>
              {showTooltip && (
                <span
                  className="absolute left-0 bottom-full mb-1.5 z-50 px-3 py-2 text-xs text-gray-200 bg-gray-900 border border-gray-600 rounded-lg shadow-xl max-w-[260px] whitespace-normal font-normal normal-case tracking-normal text-left"
                  role="tooltip"
                >
                  {data.tooltip}
                </span>
              )}
            </button>
          )}
        </span>
        <StatusIndicator value={data.value} target={data.target} />
      </div>

      {/* Valor + variação */}
      <div className="flex items-baseline gap-2 mb-3">
        <p className="font-mono tnum text-[26px] leading-none font-bold tracking-tight">
          {formatValue(data.value, data.unit)}
        </p>
        <PercentChange current={data.value} previous={data.previousValue} />
      </div>

      {/* Barra de progresso */}
      <div className="w-full bg-gray-700/50 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${progressBarStyles[status]}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Meta + anterior */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Meta: {formatValue(data.target, data.unit)}</span>
        {data.previousValue !== undefined && (
          <span className={trendColor}>Ant: {formatValue(data.previousValue, data.unit)}</span>
        )}
      </div>
    </div>
  );
}
