import { useState, useCallback } from 'react';
import type { Period } from '../ui/types';

/** Chave default de persistência do período (genérica, sem menção a cliente). */
export const DEFAULT_PERIOD_STORAGE_KEY = 'os-dashboard-period';

interface UsePeriodFilterOptions {
  /** Chave do localStorage. Default: DEFAULT_PERIOD_STORAGE_KEY. */
  storageKey?: string;
  /** Período inicial caso nada esteja persistido. Default: 'weekly'. */
  defaultPeriod?: Period;
}

function isPeriod(value: unknown): value is Period {
  return value === 'weekly' || value === 'monthly' || value === 'quarterly';
}

function getInitialPeriod(storageKey: string, defaultPeriod: Period): Period {
  try {
    const stored = localStorage.getItem(storageKey);
    if (isPeriod(stored)) return stored;
  } catch {
    // localStorage indisponível (SSR, modo privado, etc.) — usa o default.
  }
  return defaultPeriod;
}

/**
 * Hook de filtro de período com persistência em localStorage.
 * A chave é parametrizável para que cada OS/cliente use seu próprio namespace.
 */
export function usePeriodFilter(options: UsePeriodFilterOptions = {}) {
  const { storageKey = DEFAULT_PERIOD_STORAGE_KEY, defaultPeriod = 'weekly' } = options;

  const [period, setPeriodState] = useState<Period>(() =>
    getInitialPeriod(storageKey, defaultPeriod),
  );

  const setPeriod = useCallback(
    (newPeriod: Period) => {
      setPeriodState(newPeriod);
      try {
        localStorage.setItem(storageKey, newPeriod);
      } catch {
        // localStorage indisponível — segue apenas com o estado em memória.
      }
    },
    [storageKey],
  );

  return { period, setPeriod };
}
