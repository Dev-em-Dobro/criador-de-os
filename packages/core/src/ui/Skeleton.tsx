interface SkeletonCardsProps {
  count?: number;
  columns?: number;
}

/** Bloco pulsante genérico usado como placeholder de carregamento. */
function SkeletonPulse({ className }: { className: string }) {
  return <div className={`animate-pulse rounded bg-gray-700/50 ${className}`} />;
}

/** Skeleton de um único card de KPI. */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800 p-5">
      <div className="flex items-center justify-between mb-4">
        <SkeletonPulse className="h-3 w-24" />
        <SkeletonPulse className="h-2.5 w-2.5 rounded-full" />
      </div>
      <SkeletonPulse className="h-7 w-20 mb-2" />
      <SkeletonPulse className="h-2 w-16" />
    </div>
  );
}

/** Grade de skeletons de card (3, 4 ou 5 colunas). */
export function SkeletonCards({ count = 4, columns = 4 }: SkeletonCardsProps) {
  const gridClass =
    columns === 3
      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
      : columns === 5
        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4'
        : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';

  return (
    <div className={gridClass}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
