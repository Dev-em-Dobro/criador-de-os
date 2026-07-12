import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  /** Ícone da seção: aceita emoji (string) ou um elemento (ex.: ícone Lucide). */
  icon?: ReactNode;
  subtitle?: string;
  /** Ações à direita (ex.: PeriodFilter). */
  children?: ReactNode;
}

/** Cabeçalho de seção com barra de acento, título, ícone e subtítulo. */
export function SectionHeader({ title, icon, subtitle, children }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex justify-between items-center gap-4 flex-wrap">
      <div className="flex items-stretch gap-3">
        <span
          aria-hidden="true"
          className="w-1 rounded-full bg-gradient-to-b from-blue-400 via-blue-500 to-emerald-500"
        />
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            {icon != null && <span className="text-[1.1em] inline-flex items-center">{icon}</span>}
            {title}
          </h2>
          {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
}
