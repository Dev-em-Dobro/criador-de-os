import { TriangleAlert } from 'lucide-react';

interface ErrorBannerProps {
  message?: string;
  visible: boolean;
}

/** Faixa de aviso (ex.: modo offline) exibida no topo do shell. */
export function ErrorBanner({
  message = 'Modo offline — exibindo últimos dados disponíveis',
  visible,
}: ErrorBannerProps) {
  if (!visible) return null;

  return (
    <div className="bg-yellow-500/10 border-b border-yellow-500/30 text-yellow-300 px-4 py-2 text-sm flex items-center justify-center gap-2">
      <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
      {message}
    </div>
  );
}
