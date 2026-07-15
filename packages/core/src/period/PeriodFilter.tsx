import type { Period } from '../ui/types';

interface PeriodFilterProps {
  period: Period;
  onChange: (period: Period) => void;
  /** Se informado, mostra só essas opções (ex.: só Mensal e Trimestral). */
  only?: Period[];
}

const allPeriods: { value: Period; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
];

/** Filtro de período em pills (Semanal / Mensal / Trimestral). */
export function PeriodFilter({ period, onChange, only }: PeriodFilterProps) {
  const periods = only?.length ? allPeriods.filter((p) => only.includes(p.value)) : allPeriods;
  const effectivePeriod = only?.length && !only.includes(period) ? (only[0] as Period) : period;

  return (
    <div className="flex gap-2">
      {periods.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => onChange(p.value)}
          aria-pressed={effectivePeriod === p.value}
          className={`px-4 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${
            effectivePeriod === p.value
              ? 'bg-blue-500 border-blue-500 text-white'
              : 'border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
