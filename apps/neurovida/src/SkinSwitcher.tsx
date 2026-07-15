/**
 * Neurovida — alternador de tema Claro/Escuro (segmented control).
 *
 * O Neurovida tem um par de temas na mesma linguagem orgânica: "cream" (claro,
 * padrão) e "dusk" (escuro quente). Este controle troca o `data-skin` no <html>
 * em runtime e persiste a escolha em localStorage. É INLINE (sem posição fixa) —
 * montado no rodapé da sidebar via o slot `navFooter` do AppShell. Usa as classes
 * do design system (herda o skin), então fica legível nos dois temas.
 */

import { useEffect, useState } from 'react';

type Skin = 'cream' | 'dusk';

const STORAGE_KEY = 'neurovida-skin';

const OPTIONS: { id: Skin; label: string; swatch: string }[] = [
  { id: 'cream', label: 'Claro', swatch: '#faf8f3' },
  { id: 'dusk', label: 'Escuro', swatch: '#17130d' },
];

/** Normaliza um valor salvo para um skin válido (default: 'cream'). */
function normalize(value: string | null): Skin {
  return value === 'dusk' ? 'dusk' : 'cream';
}

function applySkin(skin: Skin): void {
  document.documentElement.setAttribute('data-skin', skin);
}

export function SkinSwitcher() {
  const [skin, setSkin] = useState<Skin>('cream');

  useEffect(() => {
    const saved = normalize(localStorage.getItem(STORAGE_KEY));
    setSkin(saved);
    applySkin(saved);
  }, []);

  function choose(next: Skin): void {
    setSkin(next);
    applySkin(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <div>
      <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-500">Tema</span>
      <div className="flex gap-1 rounded-lg border border-(color:--os-hairline) p-0.5">
        {OPTIONS.map((opt) => {
          const active = skin === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => choose(opt.id)}
              aria-pressed={active}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-blue-500/15 text-(color:--os-active-text) ring-1 ring-blue-500/30'
                  : 'text-gray-400 hover:bg-(color:--os-hover) hover:text-gray-200'
              }`}
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: opt.swatch, border: '1px solid rgba(0,0,0,0.2)' }}
              />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
