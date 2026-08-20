/**
 * apps/dobro — os tipos que os DOSSIÊS da aba Estrategista compartilham.
 *
 * Nasceram dentro de `yap-dossie.ts` e saíram daqui em 20/08/2026, quando o
 * dossiê de CARROSSEL passou a existir e os dois precisaram falar a mesma língua
 * (a tela renderiza qualquer `DossieSecao[]` sem saber de qual formato veio).
 * `yap-dossie.ts` continua re-exportando o que já exportava, então nada quebrou.
 *
 * A diferença entre os dois dossiês está na CONFIANÇA, não na forma:
 *   · o de reels é pesquisa de fora (consenso / indício / hipótese);
 *   · o de carrossel é quase todo número da NOSSA conta (medido), com algumas
 *     linhas que são decisão do dono (decisao) e não se discutem com dado.
 */

export type Confianca =
  /** Medido no nosso banco, em post que foi ao ar. É o mais forte que existe aqui. */
  | 'medido'
  /** Regra que o dono determinou. Não é hipótese: é como a casa faz. */
  | 'decisao'
  /** Várias fontes de fora concordam. */
  | 'consenso'
  /** Um sinal só, ou amostra pequena. Aponta direção, não conclui. */
  | 'indicio'
  /** Aposta nossa, ainda sem número que sustente. */
  | 'hipotese';

export interface DossieItem {
  /** Título curto do item (o que fazer / o que é). */
  titulo: string;
  /** Explicação em 1-3 frases. */
  texto: string;
  /** Número ou benchmark que sustenta o item, quando existe. */
  numero?: string;
  /** De onde veio o número (nome curto da fonte). */
  fonte?: string;
  /** Quão firme é a afirmação. */
  confianca?: Confianca;
}

export interface DossieSecao {
  id: string;
  titulo: string;
  icone: string;
  /** Uma frase que resume a seção inteira. */
  resumo: string;
  itens: DossieItem[];
}

export interface Fonte {
  label: string;
  url: string;
}

export const CONFIANCA_LABEL: Record<Confianca, string> = {
  medido: 'medido aqui',
  decisao: 'decisão do dono',
  consenso: 'consenso',
  indicio: 'indício',
  hipotese: 'hipótese nossa',
};
