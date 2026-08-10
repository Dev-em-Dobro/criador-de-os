/**
 * apps/dobro — tipos do renderizador de carrossel (padrão "JARVIS").
 *
 * Um carrossel é definido UMA vez em `carrosseis/<slug>.ts` e o script
 * `carrossel:render <slug>` gera os 8 slides como PNG (1080×1350) e grava o card
 * no board com `img+full` (o preview mostra a arte pronta). Fonte da verdade da
 * arte = os PNGs; o texto/estrutura vivem aqui.
 */

/** Tema de fundo do slide (define a paleta e o comportamento). */
export type Variant = 'photo' | 'dark' | 'light' | 'purple';

/** Item de lista (ícone SVG + título + subtítulo). `icone` = nome no mapa de ícones. */
export interface Item {
  icone: string;
  titulo: string;
  sub: string;
}

/** Passo numerado (01-05). */
export interface Step {
  n: string;
  titulo: string;
  sub: string;
}

/** Um slide do carrossel. `titulo` aceita **destaque** (vira roxo) e \n (quebra de linha). */
export interface Slide {
  variant: Variant;
  /** Label roxo em caixa alta acima do título. */
  eyebrow?: string;
  titulo: string;
  corpo?: string;
  /** Caixa de destaque (citação). */
  callout?: string;
  calloutLabel?: string;
  /** Lista com ícones. */
  itens?: Item[];
  /** Passos numerados. */
  steps?: Step[];
  /** Linhas do bloco de terminal (prefixo →/$/✓ é colorido). */
  terminal?: string[];
  /** Layout centralizado (ex.: slide "salva esse post"). */
  layout?: 'center';
  /** Texto do bloco em corpo menor, pra caber um prompt/roteiro longo por inteiro. */
  denso?: boolean;
  /**
   * Print SÓ deste slide (caminho relativo a apps/dobro), renderizado como uma
   * janelinha de navegador embaixo do texto. É o jeito de MOSTRAR a ferramenta
   * em vez de só descrever: ver memória capas-carrossel-padrao.
   */
  imagem?: string;
  /**
   * Vídeo que ocupa a janelinha deste slide, no lugar do print parado (caminho
   * relativo a apps/dobro). O carrossel continua saindo em PNG; ALÉM disso, o
   * render gera `slide-N.mp4` com o slide inteiro e o vídeo encaixado, que é o
   * arquivo que sobe no Instagram (carrossel misto aceita foto + vídeo).
   *
   * Exige `imagem` junto: ela é o quadro parado que aparece no preview do board e
   * serve de fallback em qualquer lugar que não toque vídeo.
   */
  videoArquivo?: string;
  /** Ícone central (nome no mapa) — usado no layout center. */
  icone?: string;
  /** Ícone decorativo grande no topo de um slide de texto (ex.: caveira). */
  topIcon?: string;
  /** Slide de CTA (logo + título + botão). */
  tipo?: 'cta';
  logo?: string;
  /** CTA "rico" (estilo @devemdobro): @ abaixo do nome no logo. Ex.: '@devemdobro'. */
  handle?: string;
  /** Botão pill branco. Se presente num CTA, ativa o layout rico (centralizado). */
  botao?: string;
  /** Capa: imagem de fundo cheia (usa a `bgImage` do carrossel). */
  cover?: boolean;
  /** Capa com título 30% menor — deixa mais arte à mostra quando o gancho é longo. */
  tituloMenor?: boolean;
  /**
   * Ajuste fino do título da CAPA, multiplicando o tamanho vigente (com ou sem
   * `tituloMenor`). Ex.: 1.15 = 15% maior. Vale só pra esta capa, então dá pra
   * calibrar um carrossel sem mexer no tamanho dos que já foram aprovados.
   */
  tituloEscala?: number;
  /** Capa: linha entre o título e o corpo (maior que o texto, menor que o gancho). */
  subtitulo?: string;
  /** Capa: dica de swipe no canto direito (ex.: 'Deslize e veja ›'). */
  swipe?: string;
  /** Encosta o bloco de texto no rodapé, deixando a arte inteira à mostra em cima. */
  gruda?: boolean;
  /** Capa: `background-size` da arte (ex.: '100% auto' pra arte quadrada). */
  bgSize?: string;
  /** Capa: `background-position` da arte (ex.: 'center top'). */
  bgPos?: string;
  /** Capa sem imagem: ignora a `bgImage` e usa o gradiente JARVIS de fallback. */
  semFundo?: boolean;
  /** Sangria de imagem desfocada no topo (slides escuros). */
  topbleed?: boolean;
  /** Placeholder de vídeo (fundo escuro + selo). */
  video?: boolean;
  videoLabel?: string;
  /** Logo de marca colorido no rodapé do slide (chave no mapa BRANDS, ex.: 'git'). */
  brandLogo?: string;
}

/** Definição completa de um carrossel. */
export interface Carrossel {
  slug: string;
  /** Título do card no board. */
  titulo: string;
  gancho: string;
  legenda: string;
  hashtags: string;
  ctaFinal: string;
  briefing?: string;
  refsLinks?: string;
  /** Caminho (relativo a apps/dobro) da imagem de capa/sangria. */
  bgImage?: string;
  /** Data programada (ISO) — default: hoje. */
  dataProgramada?: string;
  /**
   * Link do presente (página do Notion) — vai pro campo "Link do presente" do card.
   * Fica aqui e não só na tela porque `carrossel:render` recria o card do zero:
   * o que não estiver na definição some no próximo render.
   */
  linkPresente?: string;
  slides: Slide[];
}
