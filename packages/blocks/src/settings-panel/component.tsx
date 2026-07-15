/**
 * @os/blocks — componente do `settings-panel` (BYOK), carregado sob demanda.
 *
 * O cliente cola a própria chave de API; ela vai ao backend (@os/server) e é
 * guardada CIFRADA no Neon do cliente — nunca volta ao browser (só um hint).
 * Renderiza com o design system do @os/core (herda o skin).
 */

import { useEffect, useState } from 'react';
import { SectionHeader } from '@os/core';
import type { BlockProps } from '@os/core';

interface SettingStatus {
  key: string;
  label: string;
  help: string | null;
  configured: boolean;
  hint: string | null;
}

export default function SettingsPanel({ title, subtitle }: BlockProps) {
  const [items, setItems] = useState<SettingStatus[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ key: string; kind: 'ok' | 'err'; msg: string } | null>(null);

  async function load(): Promise<void> {
    setLoadError(null);
    try {
      const res = await fetch('/api/settings');
      const data = (await res.json()) as { settings?: SettingStatus[]; error?: string };
      if (!res.ok) throw new Error(data.error || 'Falha ao carregar configurações.');
      setItems(data.settings ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function save(key: string): Promise<void> {
    const value = (drafts[key] ?? '').trim();
    if (value.length < 8) {
      setFeedback({ key, kind: 'err', msg: 'Valor muito curto.' });
      return;
    }
    setBusyKey(key);
    setFeedback(null);
    try {
      const res = await fetch(`/api/settings/${key}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ value }),
      });
      const data = (await res.json()) as { configured?: boolean; hint?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar.');
      setDrafts((d) => ({ ...d, [key]: '' }));
      setFeedback({ key, kind: 'ok', msg: 'Chave salva com segurança.' });
      await load();
    } catch (e) {
      setFeedback({ key, kind: 'err', msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusyKey(null);
    }
  }

  async function remove(key: string): Promise<void> {
    setBusyKey(key);
    setFeedback(null);
    try {
      const res = await fetch(`/api/settings/${key}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || 'Falha ao remover.');
      setFeedback({ key, kind: 'ok', msg: 'Chave removida.' });
      await load();
    } catch (e) {
      setFeedback({ key, kind: 'err', msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div>
      <SectionHeader
        title={title ?? 'Configurações'}
        subtitle={subtitle ?? 'Suas chaves e integrações (modelo BYOK — você usa a sua própria conta)'}
        icon="🔑"
      />

      {loadError && (
        <div role="alert" className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {loadError}
        </div>
      )}

      {!items && !loadError && (
        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/40 p-8 text-center text-sm text-gray-400">Carregando…</div>
      )}

      <div className="space-y-4">
        {items?.map((s) => (
          <div key={s.key} className="rounded-2xl border border-gray-700/50 bg-gray-800/60 p-5 backdrop-blur-sm">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-gray-100">{s.label}</h3>
              {s.configured ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-300">
                  Configurada {s.hint ?? ''}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-600/30 px-2.5 py-0.5 text-xs font-medium text-gray-400">
                  Não configurada
                </span>
              )}
            </div>
            {s.help && <p className="mb-3 text-xs leading-relaxed text-gray-500">{s.help}</p>}

            <div className="flex flex-wrap gap-2">
              <input
                type="password"
                autoComplete="off"
                value={drafts[s.key] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                placeholder={s.configured ? 'Colar nova chave para substituir…' : 'Colar a sua chave…'}
                disabled={busyKey === s.key}
                className="min-w-[280px] flex-1 rounded-xl border border-gray-600 bg-gray-900/40 px-4 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => save(s.key)}
                disabled={busyKey === s.key || (drafts[s.key] ?? '').trim().length < 8}
                className="rounded-xl bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busyKey === s.key ? 'Salvando…' : 'Salvar'}
              </button>
              {s.configured && (
                <button
                  type="button"
                  onClick={() => remove(s.key)}
                  disabled={busyKey === s.key}
                  className="rounded-xl border border-gray-600 px-4 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:border-red-500/50 hover:text-red-300 disabled:opacity-40"
                >
                  Remover
                </button>
              )}
            </div>

            {feedback?.key === s.key && (
              <p role="status" aria-live="polite" className={`mt-2 text-xs ${feedback.kind === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                {feedback.msg}
              </p>
            )}
          </div>
        ))}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-gray-500">
        <span aria-hidden="true">🔒</span>
        Suas chaves ficam cifradas no seu banco — nunca voltam ao navegador.
      </p>
    </div>
  );
}
