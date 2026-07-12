/**
 * @os/core — BlockRegistry (inversão de controle).
 *
 * O core NÃO importa blocos. O APP monta o registry e registra as implementações;
 * o `ManifestRouter` só faz `resolve(binding.block)`. Assim `@os/core` conhece
 * apenas a INTERFACE `BlockDefinition`, e a dependência unidirecional
 * (apps → blocks → core) é preservada.
 */

import type { BlockType } from '../manifest/types';
import type { BlockDefinition } from './block';

export interface BlockRegistry {
  /**
   * Registra (ou sobrescreve) a definição de um bloco pelo seu `type`.
   *
   * Aceita `BlockDefinition<TConfig>` de QUALQUER config: o registry é um store
   * heterogêneo (blocos com configs diferentes convivem). A config é apagada na
   * fronteira do registry — o router passa `binding.config` (não-tipado) ao
   * bloco. Por isso o parâmetro é genérico e a definição é guardada como base.
   */
  register<TConfig>(def: BlockDefinition<TConfig>): void;
  /** Resolve a definição de um bloco pelo `type`; `undefined` se não registrado. */
  resolve(type: BlockType): BlockDefinition | undefined;
  /** Lista os `type`s registrados (útil para diagnósticos e mensagens de erro). */
  types(): BlockType[];
}

/**
 * Cria um registry vazio baseado em Map (chave = `type` do bloco).
 *
 * Uso (no app):
 *   const registry = createRegistry();
 *   registry.register(kpiDashboard);
 *   render(<OsApp manifest={manifest} registry={registry} />);
 */
export function createRegistry(): BlockRegistry {
  const blocks = new Map<BlockType, BlockDefinition>();

  return {
    register<TConfig>(def: BlockDefinition<TConfig>): void {
      // Registro é idempotente por `type`: o último a registrar vence.
      // (Permite o app sobrescrever um bloco do catálogo por uma variante custom.)
      //
      // Cast na fronteira do registry: um `BlockDefinition<TConfig>` específico
      // não é assignable ao `BlockDefinition` base (o componente é contravariante
      // no config). É seguro porque o router só entrega `binding.config` opaco ao
      // bloco; a validação da forma do config é responsabilidade do próprio bloco
      // (via `configSchema`), não do registry. Único ponto onde a config é apagada.
      blocks.set(def.type, def as unknown as BlockDefinition);
    },

    resolve(type: BlockType): BlockDefinition | undefined {
      return blocks.get(type);
    },

    types(): BlockType[] {
      return Array.from(blocks.keys());
    },
  };
}
