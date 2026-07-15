import { Fragment, useState } from 'react';
import type { ReactNode } from 'react';
import { Menu, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Item de navegação genérico do shell (menu principal ou sub-aba).
 * Dirigido por callback (`onSelect`), NÃO por rota — o chassi é agnóstico de
 * router. Os itens são derivados do manifesto pelo ManifestRouter.
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
   * (`.brand-mark`) no topo da sidebar. Passado como ReactNode para o app decidir
   * a fonte (ex.: <img src={manifest.identity.logoUrl} />) — o shell nunca hardcoda.
   */
  logo?: ReactNode;
  /** Menus principais (itens da sidebar). */
  menus: ShellNavItem[];
  /** Sub-abas do menu ATIVO. Se presentes, aninham sob o item ativo na sidebar. */
  sidebar?: ShellNavItem[];
  /** Texto do rodapé (na base da sidebar). */
  footerText?: string;
  /** Conteúdo opcional no rodapé da sidebar (ex.: toggle de tema, perfil, versão). */
  navFooter?: ReactNode;
  /** Faixa de aviso opcional no topo do conteúdo (ex.: <ErrorBanner />). */
  banner?: ReactNode;
  /**
   * Camada flutuante opcional, renderizada por cima de todo o OS (posição fixa,
   * fora do fluxo). Slot genérico do chassi para copilotos/agentes de IA
   * ancorados numa seção (FAB estilo WhatsApp) — o app decide o conteúdo e o
   * escopo (ex.: mostrar só em certas rotas). O shell só reserva o lugar.
   */
  floating?: ReactNode;
  /** Conteúdo principal. */
  children: ReactNode;
}

/** Item de navegação vertical da sidebar (menu principal ou sub-aba aninhada). */
function NavItem({ item, sub = false, onNavigate }: { item: ShellNavItem; sub?: boolean; onNavigate?: () => void }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={() => {
        item.onSelect?.();
        onNavigate?.();
      }}
      aria-current={item.active ? 'page' : undefined}
      className={`flex items-center gap-2.5 rounded-lg text-left font-medium transition-colors ${
        sub ? 'px-3 py-1.5 text-[13px]' : 'px-3 py-2.5 text-sm'
      } ${
        item.active
          ? 'bg-blue-500/15 text-(color:--os-active-text) ring-1 ring-blue-500/30'
          : 'text-gray-400 hover:bg-(color:--os-hover) hover:text-gray-100'
      }`}
    >
      {Icon && (
        <Icon
          className={`h-4 w-4 shrink-0 transition-colors ${item.active ? 'text-blue-300' : 'text-gray-500'}`}
          strokeWidth={1.75}
        />
      )}
      {item.label}
    </button>
  );
}

/**
 * AppShell — chassi genérico do OS: navegação LATERAL (sidebar) + área de
 * conteúdo, totalmente dirigido por props. Sem textos/menus de cliente.
 *
 * A sidebar concentra a marca, os menus principais (com sub-abas aninhadas sob o
 * item ativo) e o status. Em telas pequenas ela vira um drawer off-canvas aberto
 * por um botão na barra superior. A navegação usa callbacks (`onSelect`), então
 * o chassi não depende de router.
 */
export function AppShell({
  productName,
  brandBadge = 'OS',
  logo,
  menus,
  sidebar,
  footerText,
  navFooter,
  banner,
  floating,
  children,
}: AppShellProps) {
  const [navOpen, setNavOpen] = useState(false);
  const hasSub = Boolean(sidebar && sidebar.length > 0);
  const closeNav = () => setNavOpen(false);

  const brand = (
    <div className="flex items-center gap-2.5 select-none">
      {logo != null ? (
        <span className="inline-flex shrink-0 items-center">{logo}</span>
      ) : (
        <span className="brand-mark" aria-hidden="true" />
      )}
      <div className="flex items-baseline gap-1.5">
        <span className="os-wordmark text-base font-bold uppercase tracking-[0.22em] text-gray-100">{productName}</span>
        {brandBadge && (
          <span className="rounded-md bg-blue-500/15 px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-[0.28em] text-blue-300 ring-1 ring-blue-500/30">
            {brandBadge}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen text-gray-100 antialiased">
      {/* Barra superior — só em telas pequenas: hambúrguer + wordmark */}
      <header className="nav-glass sticky top-0 z-30 flex items-center gap-3 border-b border-(color:--os-hairline) px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setNavOpen(true)}
          aria-label="Abrir menu"
          aria-expanded={navOpen}
          className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-(color:--os-hover)"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        {brand}
      </header>

      {/* Backdrop do drawer (mobile) */}
      {navOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeNav} aria-hidden="true" />}

      {/* SIDEBAR (nav principal) */}
      <aside
        className={`nav-glass fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-(color:--os-hairline) transition-transform duration-200 lg:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Marca */}
        <div className="flex items-center justify-between gap-2 border-b border-(color:--os-hairline) px-4 py-4">
          {brand}
          <button
            type="button"
            onClick={closeNav}
            aria-label="Fechar menu"
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-(color:--os-hover) lg:hidden"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 px-4 pb-1 pt-3 text-[11px] font-medium uppercase tracking-[0.14em] text-gray-500">
          <span className="status-dot" /> Sistema online
        </div>

        {/* Itens */}
        <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2">
          {menus.map((item) => (
            <Fragment key={item.key}>
              <NavItem item={item} onNavigate={closeNav} />
              {item.active && hasSub && (
                <div className="mb-1 ml-4 flex flex-col gap-0.5 border-l border-(color:--os-hairline) pl-2">
                  {sidebar!.map((sub) => (
                    <NavItem key={sub.key} item={sub} sub onNavigate={closeNav} />
                  ))}
                </div>
              )}
            </Fragment>
          ))}
        </nav>

        {/* Rodapé da sidebar (slot do app + status) */}
        <div className="border-t border-(color:--os-hairline) px-3 py-3">
          {navFooter && <div className="mb-2.5 px-1">{navFooter}</div>}
          <div className="px-1 text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5 font-mono uppercase tracking-wide">
              <span className="status-dot" /> Operational
            </span>
            {footerText && <p className="mt-1.5 leading-snug">{footerText}</p>}
          </div>
        </div>
      </aside>

      {/* Conteúdo (deslocado pela largura da sidebar em telas grandes) */}
      <div className="lg:pl-60">
        {banner}
        <main className="mx-auto w-full max-w-7xl animate-rise px-4 py-8">{children}</main>
      </div>

      {/* Camada flutuante (copiloto/agente ancorado). Posição fixa: fora do fluxo. */}
      {floating}
    </div>
  );
}
