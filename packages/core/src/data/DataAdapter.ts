/**
 * @os/core — Data-Source Adapter (doc 03, §4).
 *
 * O padrão central que substitui os ~50 hooks de dados do Dobro OS
 * (`useYouTubeData`, `useBoardTasks`, ...) por UM mecanismo dirigido por config.
 * Resolve um `DataSourceBinding` em `{ data, loading, error, actions }`, que o
 * `ManifestRouter` injeta no `ctx` do bloco. O bloco não sabe de onde o dado veio.
 *
 * Fatia 1C (esta): liga a API de verdade.
 *  - `kind: 'static'` → devolve os dados embutidos no binding (inalterado).
 *  - `kind: 'query'`  → `client.query(binding, vars)` → POST /api/query (com
 *                       loading/erro/reload; refetch por intervalo opcional).
 *  - `kind: 'rest'`   → `client.rest(binding.url)` (rota custom do app).
 * Sem `client` injetado (demo sem backend), `query`/`rest` avisam UMA vez e
 * devolvem vazio — não quebram a tela.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataSourceBinding } from '../manifest/types';
import type { Period } from '../ui/types';
import type { BlockActions } from '../registry/block';

/** Resultado da resolução de um dataSource — o que alimenta o `BlockContext`. */
export interface ResolvedData {
  data: unknown;
  loading: boolean;
  error: string | null;
  actions: BlockActions;
}

/** Sessão mínima que o core conhece (o resto é opaco ao core). */
export interface OsClientSession {
  user: { id: string; email?: string; name?: string };
}

/**
 * Cliente de API do app (doc 03, §4.1). O core recebe uma implementação
 * concreta (wrapper de `fetch` que fala com `manifest.dataApi.baseUrl`) via
 * `createOsClient`. NENHUM segredo aqui — só a base URL pública.
 */
export interface OsClient {
  /** Envia o dataSource declarativo a `POST {baseUrl}{queryPath}` (kind: 'query'). */
  query(binding: DataSourceBinding, vars: DataSourceVars): Promise<unknown>;
  /** Faz fetch numa rota custom do app (kind: 'rest'). */
  rest(url: string, init?: RequestInit): Promise<unknown>;
  /** Sessão atual (Better Auth) — usada pelo AuthGate. Opcional na interface base. */
  getSession?(): Promise<OsClientSession | null>;
  /** Login email+senha (Better Auth). Usado pela tela de login do AuthGate. */
  signInEmail?(email: string, password: string): Promise<void>;
  /** Logout (Better Auth). */
  signOut?(): Promise<void>;
}

/** Estado do shell resolvido em runtime, usado para preencher refs (`{ ref: 'period' }`). */
export interface DataSourceVars {
  period: Period;
  clientId: string;
}

/** Contexto passado ao adapter: estado do shell + (na 1C) o cliente de API. */
export interface DataAdapterContext extends DataSourceVars {
  /** Cliente de API do app. Opcional nesta fatia (1C o injeta). */
  client?: OsClient;
}

/** Estado "vazio, sem carregar, sem erro" (binding ausente / demo sem client). */
const EMPTY: Pick<ResolvedData, 'data' | 'loading' | 'error'> = {
  data: [],
  loading: false,
  error: null,
};

// Aviso ÚNICO por kind quando não há `client` injetado (modo demo sem backend).
const warnedKinds = new Set<string>();
function warnNoClientOnce(kind: 'query' | 'rest'): void {
  if (warnedKinds.has(kind)) return;
  warnedKinds.add(kind);
  console.warn(
    `[@os/core] DataAdapter: dataSource kind '${kind}' precisa de um OsClient injetado ` +
      `(OsApp client={createOsClient(manifest.dataApi)}). Sem client, este bloco recebe ` +
      `dados vazios (modo demo).`,
  );
}

/** Normaliza qualquer valor de erro em uma string legível para o bloco. */
function toErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Hook que resolve um `DataSourceBinding` em `ResolvedData`.
 *
 * - `static` → devolve `binding.data` (síncrono, sem loading nem erro).
 * - `query`  → `client.query(binding, vars)` (POST /api/query). loading/erro/reload.
 * - `rest`   → `client.rest(binding.url)` (rota custom do app).
 * - binding ausente → sem dados (blocos puramente de config).
 *
 * Refetch: `binding.refetch.mode === 'interval'` agenda recarga a cada `ms`
 * (não há realtime no Postgres — doc 05, §8). `reload()` força recarga manual.
 */
export function useDataSource(
  binding: DataSourceBinding | undefined,
  ctx: DataAdapterContext,
): ResolvedData {
  const { period, clientId, client } = ctx;

  // `reloadToken` redispara o efeito de fetch quando o bloco chama `reload()`.
  const [reloadToken, setReloadToken] = useState(0);
  const reload = useCallback(() => setReloadToken((n) => n + 1), []);
  const actions = useMemo<BlockActions>(() => ({ reload }), [reload]);

  const isAsync = binding?.kind === 'query' || binding?.kind === 'rest';

  const [state, setState] = useState<Pick<ResolvedData, 'data' | 'loading' | 'error'>>(
    // Começa em loading para query/rest (há um fetch a caminho); vazio p/ o resto.
    isAsync ? { data: [], loading: true, error: null } : EMPTY,
  );

  // Evita setState depois de desmontar / de um fetch obsoleto (corrida).
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!binding || (binding.kind !== 'query' && binding.kind !== 'rest')) return;

    if (!client) {
      warnNoClientOnce(binding.kind);
      setState({ ...EMPTY });
      return;
    }

    const reqId = ++reqIdRef.current;
    let cancelled = false;

    async function run(showLoading: boolean): Promise<void> {
      if (showLoading) setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const data =
          binding!.kind === 'query'
            ? await client!.query(binding!, { period, clientId })
            : await client!.rest(binding!.url ?? '');
        if (cancelled || reqId !== reqIdRef.current) return;
        setState({ data, loading: false, error: null });
      } catch (err) {
        if (cancelled || reqId !== reqIdRef.current) return;
        setState({ data: [], loading: false, error: toErrorMessage(err) });
      }
    }

    void run(true);

    // Refetch por intervalo (opcional). Sem realtime → polling declarativo.
    let timer: ReturnType<typeof setInterval> | undefined;
    if (binding.refetch?.mode === 'interval' && binding.refetch.ms && binding.refetch.ms > 0) {
      timer = setInterval(() => void run(false), binding.refetch.ms);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
    // `binding` é estável entre renders (vem do manifesto); as vars do shell e o
    // reloadToken disparam recarga quando mudam.
  }, [binding, client, period, clientId, reloadToken]);

  return useMemo<ResolvedData>(() => {
    if (!binding) return { ...EMPTY, actions };

    if (binding.kind === 'static') {
      // Dados embutidos no binding (telas sem backend). Síncrono.
      return { data: binding.data ?? [], loading: false, error: null, actions };
    }

    // query / rest → estado gerido pelo efeito acima.
    return { ...state, actions };
  }, [binding, state, actions]);
}
