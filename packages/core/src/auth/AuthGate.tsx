/**
 * @os/core — AuthGate (doc 05, §5).
 *
 * Quando `manifest.settings.auth.enabled` é true, o AuthGate exige uma sessão
 * (Better Auth) ANTES de renderizar o app: verifica a sessão via o `OsClient`
 * injetado e, sem ela, mostra uma tela de login genérica (email + senha). Com
 * `auth.enabled` false (demo local), passa direto.
 *
 * O core NÃO tem texto de negócio nem cor de cliente aqui: a tela de login usa
 * o design system neutro. As utilities `blue-*` do design system são remapeadas
 * para a cor de marca do cliente (ver theme/base.css), então o botão `bg-blue-500`
 * herda a cor do cliente automaticamente. O `productName` exibido vem do
 * manifesto (dado), não hardcoded.
 */

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { OsClient } from '../data/DataAdapter';

type AuthStatus = 'checking' | 'anonymous' | 'authenticated';

export interface AuthGateProps {
  /** Se false, renderiza `children` direto (demo). Se true, exige sessão. */
  enabled: boolean;
  /** Cliente de API do app (Better Auth via /api/auth/*). Necessário se `enabled`. */
  client?: OsClient;
  /** Nome do produto exibido na tela de login (do manifesto). */
  productName: string;
  /** Logo opcional exibido na tela de login. */
  logo?: ReactNode;
  /** O app protegido. */
  children: ReactNode;
}

export function AuthGate({ enabled, client, productName, logo, children }: AuthGateProps) {
  const [status, setStatus] = useState<AuthStatus>(enabled ? 'checking' : 'authenticated');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canCheck = enabled && typeof client?.getSession === 'function';

  const checkSession = useCallback(async () => {
    if (!canCheck) {
      // enabled sem client capaz → não dá para autenticar; falha fechada.
      setStatus('anonymous');
      return;
    }
    try {
      const session = await client!.getSession!();
      setStatus(session ? 'authenticated' : 'anonymous');
    } catch {
      setStatus('anonymous');
    }
  }, [canCheck, client]);

  useEffect(() => {
    if (!enabled) return;
    void checkSession();
  }, [enabled, checkSession]);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!client?.signInEmail) {
        setError('Login indisponível: cliente de API sem suporte a auth.');
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        await client.signInEmail(email, password);
        await checkSession();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Falha no login.');
      } finally {
        setSubmitting(false);
      }
    },
    [client, email, password, checkSession],
  );

  if (!enabled || status === 'authenticated') {
    return <>{children}</>;
  }

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <span className="text-sm">Verificando sessão…</span>
      </div>
    );
  }

  // status === 'anonymous' → tela de login.
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-700/50 bg-gray-800/70 backdrop-blur-sm p-6 shadow-xl">
        <div className="flex flex-col items-center gap-2 mb-6">
          {logo}
          <h1 className="text-lg font-bold text-gray-100">{productName}</h1>
          <p className="text-xs text-gray-400">Entre para acessar o painel</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="os-auth-email" className="block text-xs font-medium text-gray-400 mb-1">
              Email
            </label>
            <input
              id="os-auth-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label htmlFor="os-auth-password" className="block text-xs font-medium text-gray-400 mb-1">
              Senha
            </label>
            <input
              id="os-auth-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-gray-100 outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
