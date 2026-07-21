/**
 * apps/dobro — rodapé do usuário na sidebar (identidade + botão "Sair").
 *
 * Ocupa o slot `navFooter` do shell (rodapé da sidebar). Mostra quem está
 * logado (nome/e-mail via a sessão do Better Auth) e um botão de deslogar.
 *
 * O logout chama `client.signOut()` (limpa o cookie de sessão HttpOnly) e então
 * recarrega a página: o AuthGate re-verifica a sessão no mount e, sem ela, volta
 * para a tela de login. Nenhum segredo aqui — só a API pública do OsClient.
 */

import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import type { OsClient, OsClientSession } from '@os/core';

export function UserFooter({ client }: { client: OsClient }) {
  const [session, setSession] = useState<OsClientSession | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let active = true;
    void client
      .getSession?.()
      .then((s) => {
        if (active) setSession(s);
      })
      .catch(() => {
        /* sem sessão legível — só mostra o botão de sair */
      });
    return () => {
      active = false;
    };
  }, [client]);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await client.signOut?.();
    } catch {
      /* mesmo se a chamada falhar, recarregamos e o AuthGate re-verifica */
    } finally {
      window.location.reload();
    }
  }

  const email = session?.user?.email;
  const name = session?.user?.name;
  const initial = (name || email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-500/15 text-xs font-bold text-blue-300 ring-1 ring-blue-500/30">
          {initial}
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs font-semibold text-gray-200">{name || 'Conta'}</div>
          {email && <div className="truncate text-[11px] text-gray-500">{email}</div>}
        </div>
      </div>
      <button
        type="button"
        onClick={handleLogout}
        disabled={signingOut}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-700/60 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
      >
        <LogOut className="h-3.5 w-3.5" strokeWidth={1.75} />
        {signingOut ? 'Saindo…' : 'Sair'}
      </button>
    </div>
  );
}
