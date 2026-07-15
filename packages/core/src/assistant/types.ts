/**
 * @os/core — tipos do resultado do copiloto flutuante (assistente de IA).
 *
 * Formato GENÉRICO de análise (independente de domínio): um resumo + seções
 * temáticas + ações recomendadas. O backend (@os/server) força esta forma via
 * tool; o `<FloatingAgent>` a renderiza. Domínios específicos (finanças, leads…)
 * expressam seu conteúdo nesta mesma estrutura.
 */

/** Um bloco temático da análise (ex.: "Destaques", "Saúde financeira", "Alertas"). */
export interface AssistantSection {
  titulo: string;
  itens: string[];
}

/** Uma recomendação prática priorizada (ex.: um corte, uma próxima ação). */
export interface AssistantAction {
  titulo: string;
  detalhe: string;
}

/** Análise estruturada devolvida pelo assistente. */
export interface AssistantAnalysis {
  /** Visão geral em 1-2 frases. */
  resumo: string;
  /** Seções temáticas (0+). */
  secoes: AssistantSection[];
  /** Ações recomendadas (0+). */
  acoes: AssistantAction[];
}
