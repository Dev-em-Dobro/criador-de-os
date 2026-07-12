import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Item de navegação genérico do shell (menu principal ou sub-aba).
 * Dirigido por callback (`onSelect`), NÃO por rota — o chassi é agnóstico de
 * router. Na fatia 1B, estes itens passarão a ser derivados do manifesto.
 */
export interface ShellNavItem {
  /** Chave estável (usada como key e para marcar o item ativo). */
  key: string;
  /** Rótulo exibido. */
  label: string;
  /** Ícone Lucide opcional. */
  icon?: LucideIcon;
  /** Se este item está ativo/selecionado. */
  active?: boolean;
  /** Callback ao clicar. */
  onSelect?: () => void;
}

export interface AppShellProps {
  /** Nome do produto exibido no wordmark (vem por prop, nunca hardcoded). */
  productName: string;
  /** Texto do badge ao lado do wordmark. Default: 'OS'. */
  brandBadge?: string;
  /**
   * Logo do cliente (opcional). Quando presente, substitui o emblema genérico
   * (`.brand-mark`) na topbar. Passado como ReactNode para o app decidir a fonte
   * (ex.: <img src={manifest.identity.logoUrl} />) — o shell nunca hardcoda logo.
   */
  logo?: ReactNode;
  /** Menus principais (pills na topbar). */
  menus: ShellNavItem[];
  /** Sub-abas verticais (sidebar). Se ausente/vazio, a sidebar não é renderizada. */
  sidebar?: ShellNavItem[];
  /** Texto do rodapé (à direita). */
  footerText?: string;
  /** Faixa de aviso opcional no topo (ex.: <ErrorBanner />). */
  banner?: ReactNode;
  /** Conteúdo principal. */
  children: ReactNode;
}

/** Botão de pill do menu principal (topbar). */
function MenuPill({ item }: { item: ShellNavItem }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={item.onSelect}
      aria-current={item.active ? 'page' : undefined}
      className={`group px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
        item.active
          ? 'bg-blue-500/15 text-white ring-1 ring-blue-500/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
          : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.05]'
      }`}
    >
      {Icon && (
        <Icon
          className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
            item.active ? 'text-blue-300' : 'text-gray-500 group-hover:text-gray-300'
          }`}
          strokeWidth={1.75}
        />
      )}
      {item.label}
    </button>
  );
}

/** Botão de sub-aba vertical (sidebar). */
function SidebarItem({ item }: { item: ShellNavItem }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={item.onSelect}
      aria-current={item.active ? 'page' : undefined}
      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg text-left transition-colors cursor-pointer border-l-2 ${
        item.active
          ? 'border-blue-400 text-blue-200 bg-blue-500/10 shadow-[inset_0_0_0_1px_rgba(101,40,211,0.18)]'
          : 'border-transparent text-gray-400 hover:text-gray-100 hover:bg-white/[0.04]'
      }`}
    >
      {Icon && <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />}
      {item.label}
    </button>
  );
}

/**
 * AppShell — chassi genérico do OS (topbar + nav em pills + sidebar opcional +
 * footer), totalmente dirigido por props. Sem textos/menus de cliente.
 *
 * Generalizado a partir do shell de referência: a navegação usa callbacks
 * (`onSelect`) em vez de rotas, para o chassi não depender de router.
 */
export function AppShell({
  productName,
  brandBadge = 'OS',
  logo,
  menus,
  sidebar,
  footerText,
  banner,
  children,
}: AppShellProps) {
  const hasSidebar = Boolean(sidebar && sidebar.length > 0);

  return (
    <div className="relative min-h-screen text-gray-100 antialiased">
      {banner}

      {/* Topbar: wordmark (esquerda) | menus (direita) */}
      <nav className="nav-glass border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between flex-wrap gap-x-6 gap-y-3">
            {/* Wordmark: logo do cliente (se houver) OU emblema genérico + nome + badge */}
            <div className="flex items-center gap-2.5 select-none">
              {logo != null ? (
                <span className="inline-flex items-center shrink-0">{logo}</span>
              ) : (
                <span className="brand-mark" aria-hidden="true" />
              )}
              <div className="flex items-baseline gap-1.5">
                <span className="font-mono text-base font-bold tracking-[0.22em] text-gray-100 uppercase">
                  {productName}
                </span>
                {brandBadge && (
                  <span className="font-mono text-[11px] font-bold tracking-[0.28em] text-blue-300 px-1.5 py-0.5 rounded-md bg-blue-500/15 ring-1 ring-blue-500/30">
                    {brandBadge}
                  </span>
                )}
              </div>
              <span className="status-dot ml-1" title="Sistema online" />
            </div>

            {/* Pills do menu principal */}
            <div className="flex items-center gap-1 flex-wrap">
              {menus.map((item) => (
                <MenuPill key={item.key} item={item} />
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Conteúdo: sidebar vertical opcional + área principal */}
      <div className="flex flex-1 min-h-0">
        {hasSidebar && (
          <aside className="w-52 shrink-0 nav-glass border-r border-white/5 py-5 sticky top-[57px] self-start max-h-[calc(100vh-57px)] overflow-y-auto">
            <nav className="flex flex-col gap-0.5 px-3">
              {sidebar!.map((item) => (
                <SidebarItem key={item.key} item={item} />
              ))}
            </nav>
          </aside>
        )}

        <main className="flex-1 min-w-0 max-w-7xl mx-auto px-4 py-8 w-full animate-rise">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-5 mt-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
          <span className="flex items-center gap-2 font-mono tracking-wide uppercase">
            <span className="brand-mark" aria-hidden="true" />
            {productName}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="status-dot" /> Operational
            {footerText && (
              <>
                <span className="text-gray-600 mx-1.5">·</span>
                {footerText}
              </>
            )}
          </span>
        </div>
      </footer>
    </div>
  );
}
