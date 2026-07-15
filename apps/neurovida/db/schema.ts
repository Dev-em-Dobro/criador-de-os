/**
 * apps/neurovida — schema Drizzle.
 *
 * As tabelas são as COMPARTILHADAS da fábrica (@os/server/schema): Better Auth +
 * app_settings (BYOK) + leads + faturas. Um Neon por cliente. Se o neurovida
 * precisar de tabelas de negócio PRÓPRIAS no futuro, defina-as aqui além do
 * re-export. (As migrations 0000–0003 já materializaram estas tabelas na Neon.)
 */

export {
  user,
  session,
  account,
  verification,
  appSettings,
  leadSourceRows,
  leads,
  invoices,
  invoiceItems,
  hotmartMetrics,
} from '@os/server/schema';
