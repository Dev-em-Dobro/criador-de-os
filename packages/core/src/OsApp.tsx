import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeProvider';
import { ManifestRouter } from './router/ManifestRouter';
import { AuthGate } from './auth/AuthGate';
import { validateManifest } from './manifest/schema';
import type { ClientManifest } from './manifest/types';
import type { BlockRegistry } from './registry/registry';
import type { OsClient } from './data/DataAdapter';
import type { Period } from './ui/types';

/**
 * OsApp — ponto de entrada do chassi ("core").
 *
 * Dirigido pelo MANIFESTO do cliente:
 *  1. valida o manifesto (zod, fail-fast) — manifesto malformado falha CEDO e
 *     com mensagem clara, não com tela branca;
 *  2. injeta o tema do cliente (`identity.theme`) via <ThemeProvider>;
 *  3. AuthGate: se `settings.auth.enabled`, exige sessão (login email+senha via
 *     Better Auth) ANTES de renderizar o app; senão passa direto (demo);
 *  4. monta <BrowserRouter> + <ManifestRouter>, que gera a navegação/rotas a
 *     partir de `manifest.navigation` e renderiza os blocos do `registry`, com
 *     o `OsClient` injetado para resolver dataSources `query`/`rest`.
 *
 * O core NÃO conhece nenhum cliente: recebe o manifesto (dados) + o registry
 * (implementações de bloco montadas pelo app) + o client (cliente de API).
 */
export interface OsAppProps {
  /** Manifesto do cliente (fonte de verdade de marca, navegação e dados). */
  manifest: ClientManifest;
  /** Registry de blocos montado pelo app (inversão de controle). */
  registry: BlockRegistry;
  /** Cliente de API do app (1C). Opcional nesta fatia. */
  client?: OsClient;
  /** Período inicial do shell. Default: `manifest.settings.period.default`. */
  period?: Period;
  /**
   * Logo do cliente exibido no shell (opcional). Passado como ReactNode para o
   * app escolher a fonte (ex.: <img src={manifest.identity.logoUrl} />).
   */
  logo?: ReactNode;
  /**
   * Camada flutuante opcional (copiloto/agente de IA ancorado a uma seção).
   * O app passa o componente (ex.: <FinanceAgent />); ele é renderizado dentro
   * do router e pode se auto-escopar por rota. Slot genérico da fábrica.
   */
  floating?: ReactNode;
  /**
   * Conteúdo opcional no rodapé da sidebar (ex.: um toggle de tema, avatar do
   * usuário, versão). Slot genérico da fábrica — repassado ao AppShell.
   */
  navFooter?: ReactNode;
}

export function OsApp({ manifest, registry, client, period, logo, floating, navFooter }: OsAppProps) {
  // Fail-fast: valida antes de renderizar qualquer coisa. Se o manifesto for
  // inválido, a exceção sobe com a lista de campos problemáticos (path legível).
  const validated = validateManifest(manifest);

  return (
    <ThemeProvider theme={validated.identity.theme} applyToRoot>
      <AuthGate
        enabled={validated.settings.auth.enabled}
        client={client}
        productName={validated.identity.productName}
        logo={logo}
      >
        <BrowserRouter>
          <ManifestRouter
            manifest={validated}
            registry={registry}
            client={client}
            period={period}
            logo={logo}
            floating={floating}
            navFooter={navFooter}
          />
        </BrowserRouter>
      </AuthGate>
    </ThemeProvider>
  );
}
