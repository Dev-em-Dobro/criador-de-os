/**
 * @os/core — ManifestRouter.
 *
 * O MOTOR de navegação do chassi. A partir de `manifest.navigation`:
 *  (a) gera as rotas (uma por binding: menu-folha e cada sub-aba);
 *  (b) alimenta o `AppShell` (menus/sub-abas → `ShellNavItem`, navegação via `navigate`);
 *  (c) para cada rota, resolve `binding.block` no `registry`, roda o `DataAdapter`
 *      no `dataSource` e renderiza o bloco passando `config` + `ctx`;
 *  (d) trata `redirectRoot` e o redirect de grupo → primeira sub-aba.
 *
 * Substitui o `parsePathname` + switch hardcoded do Dobro (doc 00, §7): a
 * navegação inteira agora é DADO (o manifesto), não código.
 */

import { Fragment, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from '../shell/AppShell';
import type { ShellNavItem } from '../shell/AppShell';
import { FloatingAgent } from '../assistant/FloatingAgent';
import { EmptyState } from '../ui/EmptyState';
import { SectionHeader } from '../ui/SectionHeader';
import { SectionIntro } from '../ui/SectionIntro';
import { SkeletonCards } from '../ui/Skeleton';
import { useDataSource } from '../data/DataAdapter';
import type { OsClient } from '../data/DataAdapter';
import type { BlockRegistry } from '../registry/registry';
import type { BlockContext } from '../registry/block';
import type {
  ClientManifest,
  MenuItem,
  SubTab,
  BlockBinding,
} from '../manifest/types';
import type { Period } from '../ui/types';
import { resolveIcon } from './icon';

export interface ManifestRouterProps {
  manifest: ClientManifest;
  registry: BlockRegistry;
  /** Cliente de API do app (1C). Opcional nesta fatia. */
  client?: OsClient;
  /** Período atual do shell (injetado no ctx dos blocos). Default: settings/'monthly'. */
  period?: Period;
  /** Logo opcional exibido no shell (topbar/footer). */
  logo?: ReactNode;
  /**
   * Camada flutuante opcional (copiloto/agente de IA ancorado a uma seção).
   * Renderizada dentro do shell E do BrowserRouter — portanto pode usar
   * `useLocation` para se auto-escopar a certas rotas. Repassada ao AppShell.
   */
  floating?: ReactNode;
  /** Conteúdo opcional no rodapé da sidebar (ex.: toggle de tema). Repassado ao AppShell. */
  navFooter?: ReactNode;
}

/** Rota efetiva de uma sub-aba: `${menu.route}/${tab.id}`. */
function tabRoute(menu: MenuItem, tab: SubTab): string {
  return `${menu.route.replace(/\/$/, '')}/${tab.id}`;
}

/**
 * Renderiza um binding: resolve o bloco no registry, roda o DataAdapter no
 * dataSource e injeta `config` + `ctx`. Se o bloco não estiver registrado,
 * mostra um estado de erro claro (em vez de tela branca).
 */
function BindingView({
  binding,
  registry,
  client,
  period,
  clientId,
}: {
  binding: BlockBinding;
  registry: BlockRegistry;
  client?: OsClient;
  period: Period;
  clientId: string;
}) {
  // Hooks SEMPRE no topo (regras dos hooks): resolvemos os dados antes de
  // qualquer early-return baseado no registro do bloco.
  const resolved = useDataSource(binding.dataSource, { period, clientId, client });
  const def = registry.resolve(binding.block);

  // Ajuda da seção (genérica, config-driven): renderizada acima do bloco quando
  // o binding declara `help` — nenhum bloco precisa saber disso.
  const intro = binding.help ? <SectionIntro help={binding.help} /> : null;

  if (!def) {
    return (
      <>
        {intro}
        <SectionHeader
          title={binding.title ?? binding.block}
          subtitle="Bloco não registrado"
        />
        <EmptyState
          icon="🧩"
          message={`O bloco "${binding.block}" não está registrado no registry.`}
          hint="O app precisa chamar registry.register(...) para este tipo de bloco."
        />
      </>
    );
  }

  const ctx: BlockContext = {
    data: resolved.data,
    loading: resolved.loading,
    error: resolved.error,
    period,
    clientId,
    actions: resolved.actions,
  };

  // O bloco pode ser `React.lazy` (code-split por bloco): renderizamos dentro de
  // um <Suspense> cujo fallback reproduz o cabeçalho do binding + skeleton, para
  // não piscar a tela enquanto o chunk do bloco carrega.
  const Block = def.component;
  // Wrapper com `data-block` (display:contents — não cria caixa nem afeta o
  // layout): expõe um gancho de estilo por TIPO de bloco. Um app pode escopar
  // tokens de tema a um bloco específico (ex.: acento diferente numa página) só
  // via CSS (`[data-block='...']`), sem tocar em nenhum componente.
  return (
    <div className="contents" data-block={binding.block}>
      {intro}
      <Suspense fallback={<BlockLoading title={binding.title ?? binding.block} subtitle={binding.subtitle} />}>
        <Block
          title={binding.title}
          subtitle={binding.subtitle}
          config={binding.config}
          ctx={ctx}
        />
      </Suspense>
    </div>
  );
}

/** Fallback do <Suspense> enquanto o chunk de um bloco lazy carrega. */
function BlockLoading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <SectionHeader title={title} subtitle={subtitle} />
      <SkeletonCards count={4} columns={4} />
    </div>
  );
}

/**
 * Deriva o menu ativo a partir do pathname atual (rota base mais longa que casa).
 * Mais longa primeiro para "/operacao/tarefas" casar "/operacao", não "/".
 */
function findActiveMenu(menus: MenuItem[], pathname: string): MenuItem | undefined {
  const byRouteLength = [...menus].sort((a, b) => b.route.length - a.route.length);
  return byRouteLength.find(
    (m) => pathname === m.route || pathname.startsWith(`${m.route.replace(/\/$/, '')}/`),
  );
}

export function ManifestRouter({
  manifest,
  registry,
  client,
  period,
  logo,
  floating,
  navFooter,
}: ManifestRouterProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const clientId = manifest.identity.clientId;
  const effectivePeriod: Period =
    period ?? manifest.settings.period?.default ?? 'monthly';

  const { redirectRoot } = manifest.navigation;
  // Menus com `hidden: true` somem da navegação e das rotas (ocultação reversível).
  const menus = manifest.navigation.menus.filter((m) => !m.hidden);
  const activeMenu = findActiveMenu(menus, location.pathname);

  // Copiloto flutuante: a prop `floating` (escape hatch do app) tem prioridade;
  // senão, se o menu ATIVO declara um `assistant`, montamos o <FloatingAgent>
  // genérico (escopo por seção — some ao navegar para outra seção). `key` força
  // remontar ao trocar de assistente entre seções.
  const floatingNode: ReactNode =
    floating ??
    (activeMenu?.assistant ? (
      <FloatingAgent key={activeMenu.key} config={activeMenu.assistant} />
    ) : undefined);

  // Menus principais (pills da topbar). Um menu-grupo navega para sua primeira aba.
  const shellMenus: ShellNavItem[] = menus.map((menu) => {
    const Icon = resolveIcon(menu.icon);
    const target =
      menu.tabs && menu.tabs.length > 0 ? tabRoute(menu, menu.tabs[0]) : menu.route;
    return {
      key: menu.key,
      label: menu.label,
      icon: Icon,
      active: activeMenu?.key === menu.key,
      onSelect: () => navigate(target),
    };
  });

  // Sidebar: só quando o menu ativo é um grupo com sub-abas.
  const sidebar: ShellNavItem[] | undefined =
    activeMenu?.tabs && activeMenu.tabs.length > 0
      ? activeMenu.tabs.map((tab) => {
          const route = tabRoute(activeMenu, tab);
          return {
            key: tab.id,
            label: tab.label,
            icon: resolveIcon(tab.icon),
            active: location.pathname === route,
            onSelect: () => navigate(route),
          };
        })
      : undefined;

  return (
    <AppShell
      productName={manifest.identity.productName}
      brandBadge={manifest.identity.brandBadge}
      menus={shellMenus}
      sidebar={sidebar}
      footerText={manifest.settings.footerText}
      logo={logo}
      floating={floatingNode}
      navFooter={navFooter}
    >
      <Routes>
        {/* "/" → redirect declarado no manifesto. */}
        <Route path="/" element={<Navigate to={redirectRoot} replace />} />

        {menus.map((menu) => {
          // Menu-folha: uma rota direta com seu binding.
          if (menu.view) {
            return (
              <Route
                key={menu.key}
                path={menu.route}
                element={
                  <BindingView
                    binding={menu.view}
                    registry={registry}
                    client={client}
                    period={effectivePeriod}
                    clientId={clientId}
                  />
                }
              />
            );
          }

          // Menu-grupo: rota base redireciona para a 1ª aba + uma rota por aba.
          // Envolvemos em <Fragment> (não um array cru): o <Routes> do react-router
          // achata Fragments ao montar a árvore de rotas de forma previsível.
          if (menu.tabs && menu.tabs.length > 0) {
            const firstTabRoute = tabRoute(menu, menu.tabs[0]);
            return (
              <Fragment key={menu.key}>
                <Route path={menu.route} element={<Navigate to={firstTabRoute} replace />} />
                {menu.tabs.map((tab) => (
                  <Route
                    key={tab.id}
                    path={tabRoute(menu, tab)}
                    element={
                      <BindingView
                        binding={tab.view}
                        registry={registry}
                        client={client}
                        period={effectivePeriod}
                        clientId={clientId}
                      />
                    }
                  />
                ))}
              </Fragment>
            );
          }

          return null;
        })}

        {/* Rota desconhecida → volta ao redirect declarado. */}
        <Route path="*" element={<Navigate to={redirectRoot} replace />} />
      </Routes>
    </AppShell>
  );
}
