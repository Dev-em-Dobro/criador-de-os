/**
 * Neurovida — alternador de tema Claro/Escuro.
 *
 * O Neurovida tem um par de temas na mesma linguagem orgânica: "cream" (claro,
 * padrão) e "dusk" (escuro quente). Este controle troca o `data-skin` no <html>
 * em runtime e persiste a escolha em localStorage. Estilizado com inline styles
 * fixos (independentes do tema) para ficar sempre legível.
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
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '10px 12px',
        borderRadius: 16,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 12px 32px -12px rgba(0,0,0,0.35)',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#8a8175',
        }}
      >
        Tema
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        {OPTIONS.map((opt) => {
          const active = skin === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => choose(opt.id)}
              aria-pressed={active}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                color: active ? '#2b2620' : '#6b6459',
                background: active ? 'rgba(0,0,0,0.05)' : 'transparent',
                border: active ? '1px solid rgba(0,0,0,0.14)' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 4,
                  background: opt.swatch,
                  border: '1px solid rgba(0,0,0,0.15)',
                }}
              />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
