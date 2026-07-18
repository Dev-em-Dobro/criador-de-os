/**
 * @os/core — FloatingAgent: copiloto de IA flutuante, GENÉRICO e config-driven.
 *
 * Primitivo da fábrica: um FAB no canto inferior direito (estilo WhatsApp) que
 * abre um painel. Ao abrir, dispara uma ANÁLISE automática da seção; abaixo, um
 * CHAT para follow-up. Tudo dirigido por `AssistantConfig` (do manifesto):
 *  - `contextKey` define o endpoint (`/api/assistant/:key/analyze` e `/chat`);
 *  - `inputs` viram campos opcionais (persistidos em localStorage por seção);
 *  - `starters` viram sugestões de pergunta.
 *
 * O `ManifestRouter` monta este componente enquanto o menu com `assistant` está
 * ativo (escopo por seção). Dado e chave BYOK vivem no servidor — aqui só chega
 * o resultado. Herda o skin (escalas gray/blue remapeadas pelo tema).
 */

import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Send, RotateCcw } from 'lucide-react';
import type { AssistantConfig } from '../manifest/types';
import type { AssistantAnalysis } from './types';
import { resolveIcon } from '../router/icon';
import { Markdown } from './Markdown';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

export interface FloatingAgentProps {
  /** Config do assistente (do menu ativo). */
  config: AssistantConfig;
}

const storageKey = (contextKey: string, inputKey: string) => `os-assistant-${contextKey}-${inputKey}`;

/**
 * Chave da conversa persistida POR contexto (financeiro ≠ simulador ≠ leads…).
 * Vive em sessionStorage: sobrevive à navegação entre seções e ao F5, mas some
 * quando o navegador fecha — mais conservador pra dados de negócio no chat.
 */
const convKey = (contextKey: string) => `os-assistant-conv-${contextKey}`;

/** Forma do snapshot de conversa gravado em sessionStorage (só o restaurável). */
interface ConvSnapshot {
  messages: ChatMsg[];
  analise: AssistantAnalysis | null;
  vazio: boolean;
}

/** Só as últimas N mensagens são persistidas, pra a chave não crescer sem limite. */
const MAX_PERSISTED_MSGS = 30;

/** Um valor é uma ChatMsg válida? (usado ao restaurar dado possivelmente corrompido). */
function isChatMsg(v: unknown): v is ChatMsg {
  if (typeof v !== 'object' || v === null) return false;
  const m = v as Record<string, unknown>;
  return (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string';
}

/**
 * Shape mínimo de AssistantAnalysis exigido pelo render (resumo + secoes[] +
 * acoes[]). Um snapshot corrompido sem esses campos deve ser tratado como
 * "sem análise", nunca renderizado — senão `.secoes.map` quebraria a UI.
 */
function isAnalysis(v: unknown): v is AssistantAnalysis {
  if (typeof v !== 'object' || v === null) return false;
  const a = v as Record<string, unknown>;
  return typeof a.resumo === 'string' && Array.isArray(a.secoes) && Array.isArray(a.acoes);
}

/**
 * Lê o snapshot da conversa do sessionStorage, validando o shape. Dado ausente,
 * corrompido, ou storage indisponível (modo privado/quota) → snapshot vazio.
 * Nunca lança: é chamada em lazy initializers de useState.
 */
function readConv(contextKey: string): ConvSnapshot {
  const empty: ConvSnapshot = { messages: [], analise: null, vazio: false };
  try {
    const raw = sessionStorage.getItem(convKey(contextKey));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== 'object' || parsed === null) return empty;
    const obj = parsed as Record<string, unknown>;
    const messages = Array.isArray(obj.messages) ? obj.messages.filter(isChatMsg) : [];
    const analise = isAnalysis(obj.analise) ? obj.analise : null;
    const vazio = obj.vazio === true;
    return { messages, analise, vazio };
  } catch {
    return empty;
  }
}

/** Frases que se alternam durante a análise, pra a espera parecer viva. */
const FRASES_ANALISE = ['Reunindo os dados…', 'Analisando os números…', 'Cruzando as informações…', 'Montando as recomendações…'];

export function FloatingAgent({ config }: FloatingAgentProps) {
  const { contextKey, title, subtitle, starters, inputs, analyzeLabel } = config;
  const Icon = config.icon ? resolveIcon(config.icon) : Sparkles;

  // Restaura a conversa desta seção (se houver) uma única vez, na montagem.
  // Ao trocar de seção o componente desmonta e este initializer roda de novo ao
  // voltar — recuperando messages/analise/vazio de onde a pessoa parou.
  const restored = useState(() => readConv(contextKey))[0];

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [vazio, setVazio] = useState(restored.vazio);
  const [analise, setAnalise] = useState<AssistantAnalysis | null>(restored.analise);
  const [messages, setMessages] = useState<ChatMsg[]>(restored.messages);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [fraseIdx, setFraseIdx] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of inputs ?? []) init[f.key] = localStorage.getItem(storageKey(contextKey, f.key)) ?? '';
    return init;
  });
  const bodyRef = useRef<HTMLDivElement>(null);

  /** Campos preenchidos → objeto enviado ao backend (só as chaves não vazias). */
  function currentInputs(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(fields)) if (v.trim()) out[k] = v.trim();
    return out;
  }

  async function runAnalysis(): Promise<void> {
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
      const data = (await res.json()) as { vazio?: boolean; analise?: AssistantAnalysis; error?: string };
      if (!res.ok) throw new Error(data.error || 'Falha ao gerar a análise.');
      if (data.vazio) setVazio(true);
      else if (data.analise) setAnalise(data.analise);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // Ao abrir, o balão fica LEVE: só saudação + sugestões (nenhuma chamada de IA
  // automática). A análise pesada (diagnóstico) roda sob demanda, pelo botão.

  // Persiste a conversa (por contexto) sempre que o conteúdo restaurável muda.
  // Só grava o histórico recente (últimas MAX_PERSISTED_MSGS) pra não crescer sem
  // limite. Sem nada a persistir (estado inicial / "Nova conversa"), REMOVE a chave
  // em vez de gravar um objeto vazio — não deixa resíduo no storage. Silencioso:
  // storage cheio/indisponível não pode quebrar o chat.
  useEffect(() => {
    try {
      const nadaAPersistir = messages.length === 0 && analise === null && !vazio;
      if (nadaAPersistir) {
        sessionStorage.removeItem(convKey(contextKey));
        return;
      }
      const snapshot: ConvSnapshot = { messages: messages.slice(-MAX_PERSISTED_MSGS), analise, vazio };
      sessionStorage.setItem(convKey(contextKey), JSON.stringify(snapshot));
    } catch {
      /* modo privado, quota estourada, storage indisponível: ignora. */
    }
  }, [messages, analise, vazio, contextKey]);

  /**
   * "Nova conversa": volta ao estado inicial leve (saudação + sugestões +
   * diagnóstico sob demanda) e apaga o snapshot desta seção do sessionStorage.
   * Não dispara IA. Estados transitórios (loading/erro) também são zerados.
   */
  function novaConversa(): void {
    setMessages([]);
    setAnalise(null);
    setErro(null);
    setVazio(false);
    setLoading(false);
    setInput('');
    try {
      sessionStorage.removeItem(convKey(contextKey));
    } catch {
      /* remover é best-effort; se falhar, o effect acima regrava o estado vazio. */
    }
  }

  const temConversa = messages.length > 0 || analise !== null || vazio;

  // Esc fecha.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Auto-scroll do corpo. Inclui `open` nas deps para que, ao abrir o painel com
  // uma conversa restaurada (deps de conteúdo inalteradas desde a montagem), o
  // corpo role até a última mensagem — e não fique parado no topo.
  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [open, messages, analise, loading, chatLoading]);

  // Enquanto analisa, alterna as frases pra a espera parecer viva.
  useEffect(() => {
    if (!loading) {
      setFraseIdx(0);
      return;
    }
    const t = setInterval(() => setFraseIdx((i) => (i + 1) % FRASES_ANALISE.length), 1600);
    return () => clearInterval(t);
  }, [loading]);

  function aplicarCampos(): void {
    for (const f of inputs ?? []) localStorage.setItem(storageKey(contextKey, f.key), fields[f.key] ?? '');
    void runAnalysis();
  }

  async function perguntar(texto: string): Promise<void> {
    const pergunta = texto.trim();
    if (pergunta.length < 2 || chatLoading) return;
    const historico = messages.slice();
    setMessages((m) => [...m, { role: 'user', content: pergunta }]);
    setInput('');
    setChatLoading(true);
    try {
      const res = await fetch(`/api/assistant/${contextKey}/chat`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ pergunta, historico, inputs: currentInputs() }),
      });
      const data = (await res.json()) as { resposta?: string; error?: string };
      if (!res.ok) throw new Error(data.error || 'Falha ao responder.');
      setMessages((m) => [...m, { role: 'assistant', content: data.resposta || '—' }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-50 flex max-h-[70vh] w-[380px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-gray-700/60 bg-gray-900/95 shadow-2xl backdrop-blur-md">
          {/* Cabeçalho */}
          <div className="flex items-center justify-between gap-3 border-b border-gray-700/60 bg-gray-800/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-300">
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-100">{title}</p>
                {subtitle && <p className="text-[11px] text-gray-400">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {temConversa && (
                <button
                  type="button"
                  onClick={novaConversa}
                  title="Nova conversa"
                  aria-label="Nova conversa"
                  className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700/60 hover:text-gray-200"
                >
                  <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                title="Fechar"
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-700/60 hover:text-gray-200"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Corpo */}
          <div ref={bodyRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {/* Campos opcionais (ex.: faturamento) */}
            {inputs && inputs.length > 0 && (
              <div className="space-y-2 rounded-xl border border-gray-700/40 bg-gray-800/30 px-3 py-2">
                {inputs.map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`asst-${contextKey}-${f.key}`} className="mb-1 block text-[11px] text-gray-400">
                      {f.label} {f.hint && <span className="text-gray-500">({f.hint})</span>}
                    </label>
                    <input
                      id={`asst-${contextKey}-${f.key}`}
                      type="text"
                      value={fields[f.key] ?? ''}
                      onChange={(e) => setFields((s) => ({ ...s, [f.key]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') aplicarCampos();
                      }}
                      placeholder={f.placeholder}
                      className="w-full rounded-lg border border-gray-600 bg-gray-900/50 px-2.5 py-1.5 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500/60 focus:outline-none"
                    />
                    {f.source && <p className="mt-1 text-[10px] leading-snug text-blue-400">⟳ {f.source}</p>}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={aplicarCampos}
                  disabled={loading}
                  className="rounded-lg border border-gray-600 px-3 py-1.5 text-xs font-medium text-gray-200 transition-colors hover:border-blue-500/40 hover:text-white disabled:opacity-40"
                >
                  Aplicar
                </button>
              </div>
            )}

            {/* Estado inicial LEVE: saudação + sugestões em destaque + diagnóstico sob demanda.
                Aparece enquanto não há chat, análise, loading nem erro/vazio. */}
            {messages.length === 0 && !analise && !loading && !erro && !vazio && (
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-gray-300">Escolha uma pergunta ou digite a sua.</p>

                {starters && starters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {starters.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => perguntar(s)}
                        className="rounded-full border border-gray-600 px-3 py-1.5 text-xs text-gray-300 transition-colors hover:border-blue-500/40 hover:text-gray-100"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => void runAnalysis()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2.5 text-sm font-medium text-blue-200 transition-colors hover:border-blue-500/50 hover:bg-blue-500/15"
                >
                  {analyzeLabel ?? '📊 Diagnóstico completo'}
                </button>
              </div>
            )}

            {loading && (
              <div role="status" aria-live="polite" className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-5">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15">
                    <span aria-hidden="true" className="os-agent-halo absolute inset-0 rounded-full bg-blue-500/25" />
                    <Icon className="relative h-5 w-5 animate-pulse text-blue-300" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200">Analisando…</p>
                    <p className="mt-0.5 text-xs text-blue-300/90">{FRASES_ANALISE[fraseIdx]}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2.5" aria-hidden="true">
                  <div className="os-shimmer h-3 w-4/5 rounded bg-gray-700/50" />
                  <div className="os-shimmer h-3 w-3/5 rounded bg-gray-700/40" />
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="os-shimmer h-16 rounded-xl bg-gray-700/40" />
                    <div className="os-shimmer h-16 rounded-xl bg-gray-700/30" />
                  </div>
                </div>
              </div>
            )}

            {erro && !loading && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                <p className="text-sm text-red-300">⚠️ {erro}</p>
                <p className="mt-1 text-xs text-gray-400">Confira se a chave de API está em Configurações e se já há dados nesta seção.</p>
              </div>
            )}

            {vazio && !loading && (
              <div className="rounded-xl border border-gray-700/50 bg-gray-800/40 p-5 text-center">
                <div aria-hidden="true" className="mb-2 text-2xl">📄</div>
                <p className="text-sm font-medium text-gray-300">Ainda não há dados para analisar</p>
                <p className="mt-1 text-xs text-gray-500">Cadastre/suba os dados desta seção e reabra este balão.</p>
              </div>
            )}

            {analise && !loading && (
              <div className="space-y-4">
                <Markdown text={analise.resumo} className="text-sm leading-relaxed text-gray-200" />

                {analise.secoes.map((s, i) => (
                  <div key={i}>
                    <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">{s.titulo}</h4>
                    <ul className="space-y-1">
                      {s.itens.map((it, j) => (
                        <li key={j} className="flex gap-2 text-sm leading-snug text-gray-300">
                          <span aria-hidden="true" className="text-blue-400">•</span>
                          <Markdown text={it} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {analise.acoes.length > 0 && (
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Recomendações</h4>
                    <ul className="space-y-2">
                      {analise.acoes.map((a, i) => (
                        <li key={i} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                          <Markdown text={a.titulo} className="text-sm font-medium text-gray-100" />
                          <Markdown text={a.detalhe} className="mt-1 text-[11px] leading-snug text-gray-400" />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Chat */}
            {messages.length > 0 && (
              <div className="space-y-2 border-t border-gray-700/40 pt-3">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-blue-500/20 text-gray-100'
                          : 'border border-gray-700/50 bg-gray-800/50 text-gray-200'
                      }`}
                    >
                      <Markdown text={m.content} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {chatLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-gray-700/50 bg-gray-800/50 px-3 py-2 text-sm text-gray-400">digitando…</div>
              </div>
            )}
          </div>

          {/* Campo de pergunta */}
          <div className="border-t border-gray-700/60 bg-gray-800/40 p-3">
            <div className="flex items-end gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void perguntar(input);
                }}
                placeholder="Pergunte algo…"
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-gray-600 bg-gray-900/50 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-blue-500/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => void perguntar(input)}
                disabled={chatLoading || input.trim().length < 2}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                title="Enviar"
              >
                <Send className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB — halo pulsante quando fechado, pra chamar atenção */}
      <div className="fixed bottom-6 right-6 z-50">
        {!open && <span aria-hidden="true" className="os-agent-halo pointer-events-none absolute inset-0 rounded-full bg-blue-500" />}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? `Fechar ${title}` : `Abrir ${title} — assistente de IA`}
          className="relative flex h-14 w-14 flex-col items-center justify-center gap-[3px] rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/10 transition-transform hover:scale-105 active:scale-95"
        >
          {open ? (
            <X className="h-6 w-6" strokeWidth={2} />
          ) : (
            <>
              <Icon className="h-5 w-5" strokeWidth={2} />
              {/* Rótulo suave indicando que é um agente de IA (disclosure) */}
              <span aria-hidden="true" className="text-[9px] font-semibold uppercase leading-none tracking-[0.14em] text-white/85">
                IA
              </span>
            </>
          )}
        </button>
      </div>
    </>
  );
}
