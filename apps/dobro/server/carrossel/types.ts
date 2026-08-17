/**
 * apps/dobro — tipos do renderizador de carrossel (padrão "JARVIS").
 *
 * Um carrossel é definido UMA vez em `carrosseis/<slug>.ts` e o script
 * `carrossel:render <slug>` gera os 8 slides como PNG (1080×1350) e grava o card
 * no board com `img+full` (o preview mostra a arte pronta). Fonte da verdade da
 * arte = os PNGs; o texto/estrutura vivem aqui.
 */

/** Tema de fundo do slide (define a paleta e o comportamento). */
/**
 * `grafite` é cinza escuro NEUTRO, diferente do `dark`, que puxa para o roxo
 * (#191426). Serve quando o slide precisa recuar e deixar a foto e o botão
 * brancos na frente, sem a cor da marca competindo.
 */
export type Variant = 'photo' | 'dark' | 'light' | 'purple' | 'grafite';

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

/**
 * Uma coluna do bloco COMPARATIVO (`versus`). O `rotulo` é o nome do lado
 * ("Eterno estudante" × "Dev contratável") e as `linhas` são frases curtas, uma
 * por comportamento. As duas colunas devem ter o MESMO número de linhas: elas
 * são lidas em pares, e desalinhar quebra a comparação.
 */
export interface VersusLado {
  rotulo: string;
  linhas: string[];
}

/** Bloco comparativo: dois lados, um ruim e um bom, lado a lado. */
export interface Versus {
  /** Coluna da esquerda: o comportamento que NÃO leva a lugar nenhum. */
  ruim: VersusLado;
  /** Coluna da direita: o que muda o jogo (fica com o realce roxo). */
  bom: VersusLado;
}

/** Um slide do carrossel. `titulo` aceita **destaque** (vira roxo) e \n (quebra de linha). */
export interface Slide {
  variant: Variant;
  /** Label roxo em caixa alta acima do título. */
  eyebrow?: string;
  /**
   * SÓ na capa: pinta o selo do `eyebrow` de VERMELHO, no lugar do roxo da marca.
   * É o plantão de telejornal, pro carrossel que nasce de notícia ("URGENTE -
   * SAIU NO SBT"). Fora da capa não tem efeito.
   */
  seloUrgente?: boolean;
  titulo: string;
  corpo?: string;
  /** Caixa de destaque (citação). */
  callout?: string;
  calloutLabel?: string;
  /**
   * Põe o callout DEPOIS do corpo, em vez de entre o título e o corpo. Serve
   * quando o callout é um exemplo de uso: a pessoa precisa entender pra que a
   * coisa serve antes de ver o exemplo. Opt-in por slide, pra não reordenar os
   * carrosséis que já foram aprovados com o callout em cima.
   */
  calloutDepois?: boolean;
  /** Lista com ícones. */
  itens?: Item[];
  /** Passos numerados. */
  steps?: Step[];
  /** Bloco comparativo em duas colunas (ruim × bom). */
  versus?: Versus;
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
   * Selo/logo solto embaixo do texto (caminho relativo a apps/dobro): a imagem
   * inteira, centralizada, SEM a moldura de navegador que a `imagem` desenha.
   * Serve pra marca e arte de identidade, onde a barrinha com três bolinhas
   * mentiria dizendo que aquilo é uma tela de site.
   *
   * Arte com fundo transparente exige `seloFundo` junto, senão um logo branco
   * some no slide claro.
   */
  selo?: string;
  /** Cor de fundo do bloco do `selo` (ex.: '#2D00F0', o azul da Nous). */
  seloFundo?: string;
  /**
   * Vídeo que ocupa a janelinha deste slide, no lugar do print parado (caminho
   * relativo a apps/dobro). O carrossel continua saindo em PNG; ALÉM disso, o
   * render gera `slide-N.mp4` com o slide inteiro e o vídeo encaixado, que é o
   * arquivo que sobe no Instagram (carrossel misto aceita foto + vídeo).
   *
   * Exige `imagem` junto: ela é o quadro parado que aparece no preview do board e
   * serve de fallback em qualquer lugar que não toque vídeo.
   *
   * EXCEÇÃO, a capa: num slide `cover` o vídeo não vai pra janelinha, vai pro
   * FUNDO. Aí `imagem` não é usada, quem manda no enquadramento é `videoCaixa`, e
   * a `bgImage` do carrossel deve ser um quadro desse mesmo vídeo no mesmo
   * enquadramento (é ela que vira o PNG parado do board).
   */
  videoArquivo?: string;
  /**
   * SÓ para capa com vídeo: onde o vídeo entra, em pixels do PNG final
   * (1080×1350), com origem no canto superior esquerdo do slide.
   *
   * Existe porque na capa o texto ocupa a metade de baixo: jogar o vídeo em tela
   * cheia esconde justamente o que interessa dele atrás do título. Com a caixa
   * dá pra encolher e subir o vídeo até o assunto ficar acima do texto, e o que
   * sobra fica preto, que é o próprio fundo desse tipo de arte.
   *
   * Todos os valores precisam ser PARES: o h264 não aceita dimensão ímpar.
   */
  videoCaixa?: { x: number; y: number; w: number; h: number };
  /**
   * Foto no rodapé de um slide de CTA (caminho relativo a apps/dobro): a nossa
   * cara junto do pedido, como a polaroid que a referência do @cindiezhu usa no
   * slide de comentário. Prefira arquivo com fundo transparente (webp/png), que
   * recorta em cima do roxo; um JPG com fundo entra como retângulo.
   */
  foto?: string;
  /** Ícone central (nome no mapa) — usado no layout center. */
  icone?: string;
  /** Ícone decorativo grande no topo de um slide de texto (ex.: caveira). */
  topIcon?: string;
  /** Slide de CTA (logo + título + botão). */
  tipo?: 'cta';
  logo?: string;
  /** CTA "rico" (estilo @devemdobro): @ abaixo do nome no logo. Ex.: '@devemdobro'. */
  handle?: string;
  /**
   * CTA com a foto como AVATAR no topo, ao lado do nome e do @, em vez do disco
   * grande no rodapé. Fica bem menor, e em troca o título, o botão e a promessa
   * ganham o slide inteiro — o layout vira "perfil falando", não "cartaz com foto".
   */
  fotoTopo?: boolean;
  /** Botão pill branco. Se presente num CTA, ativa o layout rico (centralizado). */
  botao?: string;
  /**
   * CTA em DUAS COLUNAS: o texto à esquerda e a nossa foto à direita, em vez de
   * tudo centralizado com a foto no rodapé. Sem botão pill: o pedido vira o
   * próprio título, grande, e o `corpo` fica embaixo dele.
   *
   * Serve pra testar se o CTA rende mais parecendo alguém falando com você do que
   * parecendo um cartaz. Ignora `botao`, `fotoTopo` e `layout`, e exige `foto`.
   */
  ctaLado?: boolean;
  /** Capa: imagem de fundo cheia (usa a `bgImage` do carrossel). */
  cover?: boolean;
  /** Capa com título 30% menor — deixa mais arte à mostra quando o gancho é longo. */
  tituloMenor?: boolean;
  /**
   * Ajuste fino do título, multiplicando o tamanho vigente: na capa, 36.8px (ou
   * 25.8px com `tituloMenor`); no slide de conteúdo, 25px. Ex.: 1.15 = 15% maior.
   * Vale só pro slide onde é declarado, então dá pra calibrar um carrossel sem
   * mexer no tamanho dos que já foram aprovados.
   */
  tituloEscala?: number;
  /**
   * Linha entre o título e o corpo (maior que o texto, menor que o título).
   * Na capa, é o gancho de apoio. No slide de conteúdo, serve pro slide cujo
   * título é um NOME (uma ferramenta, um comando): o nome fica grande e o que
   * ele faz vem aqui, em uma frase.
   */
  subtitulo?: string;
  /** Capa: dica de swipe no canto direito (ex.: 'Deslize e veja ›'). */
  swipe?: string;
  /** Encosta o bloco de texto no rodapé, deixando a arte inteira à mostra em cima. */
  gruda?: boolean;
  /**
   * Capa: como escurecer a arte por baixo do texto.
   *   padrão (ausente) — rampa longa, do meio pro rodapé; serve pra arte que
   *     sangra até embaixo e precisa de contraste em quase metade do slide.
   *   'curto' — o preto só entra no último terço, deixando mais desenho à mostra.
   *   'bloco' — faixa escura atrás só do título e do rodapé, com virada rápida.
   *     O texto segue branco; o que muda é o preto não subir feito véu pela arte.
   *   'claro' — nenhum preto: o texto vira escuro e cai na área vazia da arte.
   *     É o certo pra arte de fundo claro, onde a rampa preta vira uma faixa suja.
   */
  scrim?: 'curto' | 'bloco' | 'claro' | 'faixa';
  /**
   * Capa: desce o bloco de texto, encostando mais no rodapé. Serve quando o
   * desenho ocupa quase toda a altura e o título precisa sair de cima dele.
   */
  baixo?: boolean;
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
