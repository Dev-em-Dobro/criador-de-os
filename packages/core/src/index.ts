/**
 * @os/core — barrel de exports públicos do chassi.
 * Só o que é exportado aqui é "API pública" do core para blocks e apps.
 */

/* Ponto de entrada — OsApp (manifesto + registry) */
export { OsApp } from './OsApp';
export type { OsAppProps } from './OsApp';

/* Manifesto — tipos + validação (zod, fail-fast) */
export { validateManifest, clientManifestSchema, ManifestValidationError } from './manifest/schema';
export type {
  ClientManifest,
  ManifestIdentity,
  ManifestDataApi,
  ManifestNavigation,
  MenuItem,
  SubTab,
  BlockBinding,
  DataSourceBinding,
  FilterClause,
  FilterOp,
  FilterRef,
  OrderByClause,
  AggregateClause,
  RefetchPolicy,
  ManifestSettings,
  ManifestAuthSettings,
  ManifestPeriodSettings,
  BlockType,
  IconName,
  ThemeTokenName,
} from './manifest/types';

/* Registry de blocos (inversão de controle) */
export { createRegistry } from './registry/registry';
export type { BlockRegistry } from './registry/registry';

/* Contrato de bloco */
export type {
  Block,
  BlockDefinition,
  BlockProps,
  BlockContext,
  BlockActions,
} from './registry/block';

/* Data adapter (resolvedor de dataSource) */
export { useDataSource } from './data/DataAdapter';
export type {
  ResolvedData,
  OsClient,
  OsClientSession,
  DataSourceVars,
  DataAdapterContext,
} from './data/DataAdapter';

/* Cliente de API concreto (fetch → /api/query + /api/auth/*) */
export { createOsClient } from './data/createOsClient';
export type { OsClientConfig, OsSession } from './data/createOsClient';

/* AuthGate (exige sessão Better Auth quando settings.auth.enabled) */
export { AuthGate } from './auth/AuthGate';
export type { AuthGateProps } from './auth/AuthGate';

/* Router do manifesto */
export { ManifestRouter } from './router/ManifestRouter';
export type { ManifestRouterProps } from './router/ManifestRouter';
export { resolveIcon } from './router/icon';

/* Tema */
export { ThemeProvider } from './theme/ThemeProvider';
export type { Theme } from './theme/types';
export { THEME_CSS_VARS } from './theme/types';

/* Shell */
export { AppShell } from './shell/AppShell';
export type { AppShellProps, ShellNavItem } from './shell/AppShell';

/* UI — componentes */
export { KpiCard } from './ui/KpiCard';
export { SectionHeader } from './ui/SectionHeader';
export { EmptyState } from './ui/EmptyState';
export { TrendChart } from './ui/TrendChart';
export { SkeletonCard, SkeletonCards } from './ui/Skeleton';
export { StatusIndicator } from './ui/StatusIndicator';
export { ErrorBanner } from './ui/ErrorBanner';

/* UI — tipos */
export type { KpiCardData, IndicatorStatus, Period } from './ui/types';

/* UI — formatação e tokens */
export {
  getIndicatorColor,
  getTrendIcon,
  getTrendColor,
  formatValue,
  indicatorStyles,
  indicatorDotStyles,
  progressBarStyles,
} from './ui/format';

/* Período */
export { PeriodFilter } from './period/PeriodFilter';
export { usePeriodFilter, DEFAULT_PERIOD_STORAGE_KEY } from './period/usePeriodFilter';

/** Versão do contrato do core (usada para migração de manifesto no futuro). */
export const CORE_VERSION = '0.0.0';
