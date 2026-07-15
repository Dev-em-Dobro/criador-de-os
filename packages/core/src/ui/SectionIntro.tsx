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
  const [open, setOpen] = useState(false); // modal do tutorial
  const [expanded, setExpanded] = useState(false); // descrição inline
  const hasTutorial = !!help.tutorial && help.tutorial.steps.length > 0;

  // Nada a mostrar (nem descrição nem tutorial) → não renderiza o banner.
  if (!help.description && !hasTutorial) return null;

  // Progressive disclosure: por padrão só uma linha discreta "Como funciona".
  // A descrição fica escondida até o usuário pedir — menos texto na tela.
  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-1">
        {help.description && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 transition-colors hover:bg-(color:--os-hover) hover:text-gray-200"
          >
            <span className="grid h-4 w-4 place-items-center rounded-full bg-blue-500/15 text-[10px] font-bold text-blue-300" aria-hidden>
              i
            </span>
            Como funciona
            <span className="text-gray-500" aria-hidden>{expanded ? '▾' : '▸'}</span>
          </button>
        )}
        {hasTutorial && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-blue-400 transition-colors hover:bg-(color:--os-hover) hover:text-blue-300"
          >
            Ver tutorial
          </button>
        )}
      </div>

      {expanded && help.description && (
        <p className="mt-2 rounded-2xl border border-gray-700/50 bg-gray-800/50 px-4 py-3 text-sm leading-relaxed text-gray-300 backdrop-blur-sm">
          {help.description}
        </p>
      )}

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
