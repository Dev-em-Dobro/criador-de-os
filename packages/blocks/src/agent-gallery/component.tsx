/**
 * @os/blocks — componente do `agent-gallery`, carregado sob demanda.
 *
 * GALERIA (grid de cards) → clique num agente "pronto" → RELATÓRIO (a análise
 * estruturada resumo/seções/ações + chat). Reaproveita o primitivo de copiloto:
 * chama `/api/assistant/:contextKey/{analyze,chat}` (auth-first + BYOK no backend).
 *
 * Config-driven: os agentes vêm de `config.agents` no manifesto. Token-driven
 * (classes gray/blue/emerald/amber remapeadas pelo skin) — serve creme E dusk.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { SectionHeader, EmptyState } from '@os/core';
import type { BlockProps, AssistantAnalysis } from '@os/core';

const DISPLAY = { fontFamily: 'var(--font-display, inherit)' } as const;

interface AgentInput {
  key: string;
  label: string;
  placeholder?: string;
  hint?: string;
}
interface AgentCard {
  /** contextKey do provider no backend (ex.: 'financas'). */
  contextKey: string;
  name: string;
  expertise: string;
  /** Emoji do avatar (default 🤖). */
  icon?: string;
  /** 'ready' (default) = clicável e chama o backend; 'soon' = card apagado. */
  status?: 'ready' | 'soon';
  /** Linha de rodapé (dado teaser). */
  teaser?: string;
  /** Campos opcionais que o usuário informa (ex.: faturamento) — como no copiloto. */
  inputs?: AgentInput[];
}
interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

// localStorage compartilhado com o copiloto flutuante: informar a receita no
// balão reflete aqui e vice-versa.
const skey = (ctx: string, k: string) => `os-assistant-${ctx}-${k}`;

function normalizeAgents(config: Record<string, unknown> | undefined): AgentCard[] {
  const raw = Array.isArray(config?.agents) ? (config!.agents as unknown[]) : [];
  return raw.filter(
    (a): a is AgentCard =>
      !!a && typeof a === 'object' && typeof (a as AgentCard).contextKey === 'string' && typeof (a as AgentCard).name === 'string',
  );
}

export default function AgentGallery({ title, subtitle, config }: BlockProps) {
  const agents = useMemo(() => normalizeAgents(config), [config]);
  const [selected, setSelected] = useState<AgentCard | null>(null);

  if (selected) return <AgentReport agent={selected} onBack={() => setSelected(null)} />;

  return (
    <div>
      <SectionHeader
        title={title ?? 'Agentes'}
        subtitle={subtitle ?? 'Sua equipe de especialistas de IA — clique num card para ver o relatório dele.'}
        icon="✨"
      />

      {agents.length === 0 ? (
        <EmptyState icon="🤖" message="Nenhum agente configurado." hint="Adicione `config.agents` no manifesto desta seção." />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => {
            const ready = a.status !== 'soon';
            return (
              <button
                key={a.contextKey}
                type="button"
                disabled={!ready}
                onClick={() => ready && setSelected(a)}
                className={`group relative flex flex-col gap-4 overflow-hidden rounded-2xl border p-5 text-left shadow-sm transition-transform ${
                  ready ? 'border-gray-700/50 bg-gray-800/60 hover:-translate-y-0.5' : 'cursor-default border-gray-700/40 bg-gray-800/40 opacity-70'
                }`}
              >
                <span className={`absolute inset-x-0 top-0 h-1 ${ready ? 'bg-gradient-to-r from-blue-400 to-blue-500' : 'bg-gray-600/40'}`} />
                <div className="flex items-start justify-between">
                  <span
                    className={`grid shrink-0 place-items-center rounded-2xl text-2xl ${
                      ready ? 'bg-gradient-to-br from-blue-400 to-blue-700 text-white shadow-lg shadow-blue-500/25' : 'bg-blue-500/10 text-blue-400'
                    }`}
                    style={{ width: 52, height: 52 }}
                    aria-hidden
                  >
                    {a.icon ?? '🤖'}
                  </span>
                  {ready ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" /> Pronto
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-700/50 bg-gray-900/40 px-2.5 py-1 text-[11px] font-semibold text-gray-500">
                      em breve
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-100" style={DISPLAY}>{a.name}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-400">{a.expertise}</p>
                </div>
                <div className="mt-auto flex items-center justify-between border-t border-gray-700/40 pt-3.5">
                  <span className="truncate text-[11px] text-gray-500">{a.teaser ?? ''}</span>
                  <span className={`shrink-0 text-sm font-semibold ${ready ? 'text-blue-400' : 'text-gray-500'}`}>
                    {ready ? 'Ver relatório →' : ''}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Mensagens que giram enquanto o agente gera o relatório (dão sensação de trabalho). */
const LOAD_MSGS = ['Lendo os seus dados…', 'Cruzando os números…', 'Achando o que importa…', 'Escrevendo o relatório…'];

/** Detecta o tom de uma seção pelo título (alertas = âmbar; resto = acento). */
function secTone(titulo: string): 'amber' | 'brand' {
  return /alerta|risco|aten[cç]/i.test(titulo) ? 'amber' : 'brand';
}

function AgentReport({ agent, onBack }: { agent: AgentCard; onBack: () => void }) {
  const { contextKey } = agent;
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [vazio, setVazio] = useState(false);
  const [analise, setAnalise] = useState<AssistantAnalysis | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const f of agent.inputs ?? []) o[f.key] = localStorage.getItem(skey(contextKey, f.key)) ?? '';
    return o;
  });
  const chatEnd = useRef<HTMLDivElement>(null);
  const [loadMsg, setLoadMsg] = useState(0);

  function currentInputs(): Record<string, string> {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) if (v.trim()) o[k] = v.trim();
    return o;
  }

  async function run(): Promise<void> {
    setLoading(true);
    setErro(null);
    setVazio(false);
    setAnalise(null);
    try {
      const res = await fetch(`/api/assistant/${contextKey}/analyze`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inputs: currentInputs() }),
      });
      const d = (await res.json()) as { vazio?: boolean; analise?: AssistantAnalysis; error?: string };
      if (!res.ok) throw new Error(d.error || 'Falha ao gerar o relatório.');
      if (d.vazio) setVazio(true);
      else if (d.analise) setAnalise(d.analise);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // Gera o relatório ao abrir o agente.
  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextKey]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Gira a mensagem do loader enquanto gera o relatório.
  useEffect(() => {
    if (!loading) {
      setLoadMsg(0);
      return;
    }
    const t = setInterval(() => setLoadMsg((i) => (i + 1) % LOAD_MSGS.length), 1500);
    return () => clearInterval(t);
  }, [loading]);

  function aplicarCampos(): void {
    for (const f of agent.inputs ?? []) localStorage.setItem(skey(contextKey, f.key), fields[f.key] ?? '');
    void run();
  }

  async function perguntar(texto: string): Promise<void> {
    const p = texto.trim();
    if (p.length < 2 || chatLoading) return;
    const historico = messages.slice();
    setMessages((m) => [...m, { role: 'user', content: p }]);
    setInput('');
    setChatLoading(true);
    try {
      const res = await fetch(`/api/assistant/${contextKey}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pergunta: p, historico, inputs: currentInputs() }),
      });
      const d = (await res.json()) as { resposta?: string; error?: string };
      if (!res.ok) throw new Error(d.error || 'Falha ao responder.');
      setMessages((m) => [...m, { role: 'assistant', content: d.resposta || '—' }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${e instanceof Error ? e.message : String(e)}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-gray-100"
      >
        ← Agentes
      </button>

      <div className="overflow-hidden rounded-2xl border border-gray-700/50 bg-gray-800/60 shadow-sm">
        {/* Cabeçalho do agente */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/50 bg-gray-900/30 px-6 py-5">
          <div className="flex items-center gap-3.5">
            <span
              className="grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 text-2xl text-white shadow-lg shadow-blue-500/25"
              style={{ width: 52, height: 52 }}
              aria-hidden
            >
              {agent.icon ?? '🤖'}
            </span>
            <div>
              <h2 className="text-xl font-semibold text-gray-100" style={DISPLAY}>{agent.name}</h2>
              <p className="mt-0.5 text-xs text-gray-500">{agent.expertise}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="rounded-xl border border-gray-700/60 bg-gray-800/60 px-3.5 py-2 text-xs font-semibold text-blue-400 transition-colors hover:border-blue-500/40 disabled:opacity-40"
          >
            {loading ? 'Gerando…' : '↻ Atualizar relatório'}
          </button>
        </div>

        {/* Campos opcionais (ex.: faturamento) */}
        {agent.inputs && agent.inputs.length > 0 && (
          <div className="flex flex-wrap items-end gap-3 border-b border-gray-700/40 bg-gray-800/40 px-6 py-4">
            {agent.inputs.map((f) => (
              <div key={f.key} className="min-w-[180px] flex-1">
                <label htmlFor={`ag-${contextKey}-${f.key}`} className="mb-1 block text-[11px] text-gray-400">
                  {f.label} {f.hint && <span className="text-gray-500">({f.hint})</span>}
                </label>
                <input
                  id={`ag-${contextKey}-${f.key}`}
                  type="text"
                  value={fields[f.key] ?? ''}
                  onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') aplicarCampos();
                  }}
                  placeholder={f.placeholder}
                  className="w-full rounded-lg border border-gray-600 bg-gray-900/40 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500/60 focus:outline-none"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={aplicarCampos}
              disabled={loading}
              className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Aplicar
            </button>
          </div>
        )}

        {/* Corpo do relatório */}
        <div className="px-6 py-6">
          {loading && (
            <div role="status" aria-live="polite" className="flex flex-col items-center gap-6 py-14">
              {/* Avatar do agente pulsando — "radar" de que ele está trabalhando */}
              <div className="relative" style={{ width: 60, height: 60 }}>
                <span className="absolute inset-0 animate-ping rounded-2xl bg-blue-500/25" />
                <span className="absolute inset-0 animate-pulse rounded-2xl bg-blue-500/15" />
                <span
                  className="relative grid h-full w-full place-items-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 text-2xl text-white shadow-lg shadow-blue-500/40"
                  aria-hidden
                >
                  {agent.icon ?? '🤖'}
                </span>
              </div>
              {/* Mensagem que gira + três pontinhos saltando */}
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-200">{LOAD_MSGS[loadMsg]}</p>
                <div className="mt-2.5 flex items-center justify-center gap-1.5" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-400"
                      style={{ animationDelay: `${i * 160}ms` }}
                    />
                  ))}
                </div>
              </div>
              {/* Shimmer prevendo o formato do relatório */}
              <div className="mt-1 w-full max-w-sm space-y-2.5" aria-hidden>
                <div className="h-3 w-full animate-pulse rounded-full bg-gray-700/40" />
                <div className="h-3 w-11/12 animate-pulse rounded-full bg-gray-700/40" style={{ animationDelay: '120ms' }} />
                <div className="h-3 w-4/6 animate-pulse rounded-full bg-gray-700/40" style={{ animationDelay: '240ms' }} />
              </div>
            </div>
          )}

          {erro && !loading && (
            <EmptyState icon="⚠️" message={erro} hint="Confira se a sua chave está em Configurações e se já há dados nesta frente." />
          )}

          {vazio && !loading && (
            <EmptyState icon="📄" message="Ainda não há dados para este agente analisar." hint="Cadastre/suba os dados da frente dele e gere o relatório de novo." />
          )}

          {analise && !loading && (
            <div className="space-y-6">
              <p className="text-[15px] leading-relaxed text-gray-200">{analise.resumo}</p>

              {analise.secoes.length > 0 && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {analise.secoes.map((s, i) => {
                    const amber = secTone(s.titulo) === 'amber';
                    return (
                      <div key={i}>
                        <h4 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{s.titulo}</h4>
                        <ul className="space-y-2">
                          {s.itens.map((it, j) => (
                            <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-gray-300">
                              <span aria-hidden className={amber ? 'text-amber-400' : 'text-blue-400'}>
                                {amber ? '▲' : '◆'}
                              </span>
                              <span>{it}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}

              {analise.acoes.length > 0 && (
                <div>
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Recomendações</h4>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {analise.acoes.map((a, i) => (
                      <div key={i} className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.04] p-4">
                        <p className="text-sm font-semibold text-gray-100">{a.titulo}</p>
                        <p className="mt-1.5 text-xs leading-relaxed text-gray-400">{a.detalhe}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Chat */}
          {(messages.length > 0 || chatLoading) && (
            <div className="mt-6 space-y-2 border-t border-gray-700/40 pt-5">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user' ? 'bg-blue-500/20 text-gray-100' : 'border border-gray-700/50 bg-gray-800/50 text-gray-200'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-gray-700/50 bg-gray-800/50 px-3.5 py-2.5 text-sm text-gray-400">digitando…</div>
                </div>
              )}
              <div ref={chatEnd} />
            </div>
          )}
        </div>

        {/* Campo de pergunta */}
        <div className="flex items-center gap-2.5 border-t border-gray-700/50 bg-gray-900/30 px-6 py-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void perguntar(input);
            }}
            placeholder={`Pergunte ao ${agent.name}…`}
            className="min-w-0 flex-1 rounded-xl border border-gray-600 bg-gray-800/60 px-3.5 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
          />
          <button
            type="button"
            onClick={() => void perguntar(input)}
            disabled={chatLoading || input.trim().length < 2}
            className="rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
