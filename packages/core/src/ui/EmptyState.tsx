import type { ReactNode } from 'react';

interface EmptyStateProps {
  message?: string;
  /** Texto de dica secundário (abaixo da mensagem principal). */
  hint?: string;
  /** Ícone/ilustração exibido acima da mensagem. Default: emoji 📊. */
  icon?: ReactNode;
}

/** Estado vazio genérico (sem dados) com ícone, mensagem e dica opcionais. */
export function EmptyState({
  message = 'Sem dados disponíveis para o período selecionado',
  hint = 'Tente selecionar outro período ou verifique a conexão com os dados',
  icon = '📊',
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-800/50 p-12 text-center">
      {icon != null && <div aria-hidden="true" className="text-4xl mb-4 opacity-50">{icon}</div>}
      <p className="text-gray-400 text-sm font-medium">{message}</p>
      {hint && <p className="text-gray-500 text-xs mt-2">{hint}</p>}
    </div>
  );
}
