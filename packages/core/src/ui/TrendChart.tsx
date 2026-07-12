interface TrendChartProps {
  data: number[];
  /** Cor da linha. Default: token de sinal do tema (--color-signal). */
  color?: string;
  width?: number;
  height?: number;
}

/** Mini gráfico de tendência (sparkline) em SVG a partir de uma série. */
export function TrendChart({
  data,
  color = 'var(--color-signal)',
  width = 80,
  height = 32,
}: TrendChartProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="inline-block" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
