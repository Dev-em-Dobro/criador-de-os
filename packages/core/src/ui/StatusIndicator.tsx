import { getIndicatorColor, indicatorDotStyles } from './format';

interface StatusIndicatorProps {
  value: number;
  target: number;
}

/** "Dot" colorido (verde/amarelo/vermelho) indicando o progresso vs. meta. */
export function StatusIndicator({ value, target }: StatusIndicatorProps) {
  const status = getIndicatorColor(value, target);
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${indicatorDotStyles[status]}`}
      title={`${((value / target) * 100).toFixed(0)}% da meta`}
    />
  );
}
