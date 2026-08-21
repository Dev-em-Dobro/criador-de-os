/**
 * apps/dobro — os tipos que os DOSSIÊS da aba Estrategista compartilham.
 *
 * Nasceram dentro de `yap-dossie.ts` e saíram daqui em 20/08/2026, quando o
 * dossiê de CARROSSEL passou a existir e os dois precisaram falar a mesma língua
 * (a tela renderiza qualquer `DossieSecao[]` sem saber de qual formato veio).
 * `yap-dossie.ts` continua re-exportando o que já exportava, então nada quebrou.
 *
 * MORA EM `shared/` porque tem DOIS consumidores com regras diferentes: a tela
 * (`src/blocks/`, empacotada pelo Vite) e o prompt do gerador (`server/`, que na
 * Vercel builda como ESM nodenext e por isso importa com extensão `.js`
 * explícita). Os dois tsconfigs incluem `shared`. Se este arquivo voltasse para
 * `src/`, o servidor passaria a depender do front, que é a direção errada: o
 * fato é do núcleo, a tela é só uma das vistas dele.
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
  /** Explicação em 1-3 frases. É o que a PESSOA lê na tela. */
  texto: string;
  /** Número ou benchmark que sustenta o item, quando existe. */
  numero?: string;
  /** De onde veio o número (nome curto da fonte). */
  fonte?: string;
  /** Quão firme é a afirmação. */
  confianca?: Confianca;
  /**
   * A mesma ideia como ORDEM curta e imperativa, que é o que vai no prompt do
   * gerador. Existe separada do `texto` de propósito: a tela quer explicação com
   * contexto ("o contra-exemplo está no mesmo banco..."), e o prompt quer
   * instrução ("nunca ponha o comando de instalação num slide").
   *
   * ITEM SEM `regra` NÃO ENTRA NO PROMPT. É assim que se marca o que é leitura
   * humana (como interpretar as métricas) e o que é ordem para quem escreve.
   * Escrever prosa demais no prompt dilui as regras que importam.
   */
  regra?: string;
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
