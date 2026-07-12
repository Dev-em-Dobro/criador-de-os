/**
 * @os/core — Contrato de bloco (doc 03).
 *
 * Um BLOCO é um componente React genérico que:
 *  - não conhece nenhum cliente, coleção, view ou texto de negócio;
 *  - recebe CONFIG (de `binding.config`) e DADOS (resolvidos pelo core a partir
 *    de `binding.dataSource`) via `ctx`;
 *  - renderiza usando o design system do `@os/core`.
 *
 * O core conhece SÓ esta interface. As implementações vêm de fora (o app registra
 * os blocos no registry), preservando a dependência unidirecional apps → blocks → core.
 */

import type { ReactElement } from 'react';
import type { BlockType } from '../manifest/types';
import type { Period } from '../ui/types';

/**
 * Estado global do shell + dados resolvidos, injetados pelo core em todo bloco.
 * O bloco NÃO sabe de onde o dado veio (query/rest/static) — só o consome.
 */
export interface BlockContext {
  /** Dados já resolvidos pelo core a partir do dataSource. Formato depende do adapter/mapper. */
  data: unknown;
  loading: boolean;
  error: string | null;
  /** Período atual do shell (para blocos que exibem contexto de período). */
  period: Period;
  /** Cliente atual (multi-tenant). */
  clientId: string;
  /** Ações opcionais expostas pelo adapter (ex.: escrever de volta, recarregar). */
  actions: BlockActions;
}

export interface BlockActions {
  /** Atualiza um documento/linha (quando o adapter suportar escrita). */
  updateDoc?: (id: string, patch: Record<string, unknown>) => Promise<void>;
  /** Força um refetch dos dados. */
  reload?: () => void;
}

/** Props que TODO bloco recebe. `TConfig` é a forma do `binding.config` daquele bloco. */
export interface BlockProps<TConfig = Record<string, unknown>> {
  title?: string;
  subtitle?: string;
  /** Vem de `binding.config` (tipado por bloco). */
  config: TConfig;
  /** Dados + estado + ações, injetados pelo core. */
  ctx: BlockContext;
}

/** Um bloco é só um componente com essa assinatura. */
export type Block<TConfig = Record<string, unknown>> = (
  props: BlockProps<TConfig>,
) => ReactElement | null;

/**
 * Definição registrável (o que o app registra no registry).
 * `configSchema` é opcional (um ZodSchema) para validar o config vindo do
 * manifesto — fail-fast no lado do bloco quando quiser garantir a forma.
 */
export interface BlockDefinition<TConfig = Record<string, unknown>> {
  /** Ex.: "kpi-dashboard", "custom:scudo-students". */
  type: BlockType;
  component: Block<TConfig>;
  /** ZodSchema<TConfig> (opcional) para validar o config no load. */
  configSchema?: unknown;
  /** Forma default esperada dos dados por este bloco. */
  defaultDataShape?: 'collection' | 'doc' | 'raw';
}
