/**
 * @os/core — SectionIntro.
 *
 * Banner genérico de ajuda de uma seção: uma breve descrição de "como funciona"
 * + um botão "Ver tutorial" que abre um modal com os passos (ex.: como cadastrar
 * os dados / configurar). Alimentado por `binding.help` do manifesto (config por
 * cliente) e renderizado pelo ManifestRouter acima de qualquer bloco — nenhum
 * bloco precisa saber disso. Usa só o design system (herda o skin).
 */

import { useEffect, useState } from 'react';
import type { SectionHelp } from '../manifest/types';

export interface SectionIntroProps {
  help: SectionHelp;
}

export function SectionIntro({ help }: SectionIntroProps) {
  const [open, setOpen] = useState(false);
  const hasTutorial = !!help.tutorial && help.tutorial.steps.length > 0;

  // Nada a mostrar (nem descrição nem tutorial) → não renderiza o banner.
  if (!help.description && !hasTutorial) return null;

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-800/50 px-4 py-3 backdrop-blur-sm">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-300"
          aria-hidden
        >
          i
        </span>
        {help.description && (
          <p className="flex-1 text-sm leading-relaxed text-gray-300">{help.description}</p>
        )}
        {hasTutorial && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
          >
            Ver tutorial
          </button>
        )}
      </div>

      {open && hasTutorial && help.tutorial && (
        <TutorialModal
          title={help.tutorial.title ?? 'Como usar esta seção'}
          steps={help.tutorial.steps}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function TutorialModal({
  title,
  steps,
  onClose,
}: {
  title: string;
  steps: string[];
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-gray-700/60 bg-gray-800 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="shrink-0 rounded-lg px-2 py-1 text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-gray-100"
          >
            ✕
          </button>
        </div>
        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-300">
                {i + 1}
              </span>
              <p className="flex-1 pt-0.5 text-sm leading-relaxed text-gray-300">{step}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
