/**
 * apps/dobro — carrossel "Design nível APPLE nos seus projetos com uma Skill".
 *
 * ORIGEM: referência @marianatorre.s (3.156 comentários / 1.539 curtidas),
 * capturada pelo Telegram em 10/08/2026. A legenda dela: "São 17 regras de
 * movimento e espaçamento tiradas dos próprios vídeos de design da Apple, num
 * arquivo que o Claude lê antes de codar." O CTA dela é "comenta DESIGN".
 *
 * A REFERÊNCIA ACERTOU O NÚMERO. Conferido no repositório em 12/08/2026: são 17
 * regras numeradas mesmo. O que ela simplificou: as 17 não são "de movimento e
 * espaçamento", são de INTERFACE (como a tela responde ao dedo, movimento,
 * materiais, tipografia, acessibilidade). Espaçamento aparece dentro da regra 15,
 * de tipografia. Por isso este carrossel diz "17 regras" sem o "de movimento e
 * espaçamento".
 *
 * PRECISÃO (Article IV) — tudo lido em 12/08/2026 no repo emilkowalski/skills,
 * arquivo `skills/apple-design/SKILL.md`:
 *   · autor: Emil Kowalski (o mesmo do Sonner, a lib de toast);
 *   · licença MIT, "Copyright (c) 2026 Emil Kowalski";
 *   · instalação: `npx skills@latest add emilkowalski/skills`;
 *   · a skill se descreve como os princípios da Apple "distilled from their WWDC
 *     design talks and translated for the web" — daí "vídeos de design da Apple";
 *   · 17 regras numeradas. As QUATRO deste carrossel foram trocadas em 12/08 a
 *     pedido do dono: as primeiras (Resposta, 1 pra 1, Interrupção, Mola) eram
 *     todas de gesto, e ele achou vago pra quem faz site. Entraram as visuais, e
 *     cada slide passou a trazer o CSS verbatim do arquivo:
 *       15. Typography: `line-height: 1.05; letter-spacing: -0.02em;` no display,
 *           e o corpo perto de zero;
 *       12. Materials & depth: `background: rgba(255,255,255,.6);
 *           backdrop-filter: blur(20px) saturate(180%);`
 *        1. Response: `.button:active { transform: scale(0.97);
 *           transition: transform 100ms ease-out; }`
 *        4. Behavior over animation (springs): damping 1.0 = sem quique,
 *           response 0.3–0.4s pra maioria da UI; gaveta em 0.8/0.3. Esta é a
 *           única sem CSS, porque mola não existe como propriedade do CSS.
 *     FORA ficaram "1 pra 1" e "Interrupção": valem, mas só aparecem em coisa que
 *     se arrasta, e o público do post faz site e landing.
 *   · o repo tem 10 skills, e as outras de design são `pick-ui-library` e
 *     `prototype` (a referência fala em "outras duas de design").
 * NÃO afirmamos número de estrelas, nem que a Apple endossa, nem que a skill
 * "faz o design sozinho". SEM travessão.
 *
 * CAPA: pendente. Ver o briefing.
 * PRESENTE: pronto (Notion, em `linkPresente`). Traz as 17 regras em português,
 * agrupadas em três blocos, o comando, as outras skills do pacote e o aviso de
 * que várias regras só aparecem em coisa que se arrasta.
 */
import type { Carrossel } from '../types';

export const designApple: Carrossel = {
  slug: 'design-apple',
  // Igual ao título do card que a captura do Telegram já criou (13/08): é o que
  // faz o render ATUALIZAR aquele card em vez de gravar um segundo.
  titulo: 'Design nível APPLE nos seus projetos com uma Skill',
  gancho: 'Design nível Apple nos seus projetos com uma Skill: 17 regras num arquivo que o Claude lê antes de codar.',
  dataProgramada: '2026-08-15',
  refsLinks: 'https://www.instagram.com/reel/Dbqc5N3RZU4/ (referência: @marianatorre.s)',
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb4881b8b879f973b4d32e15',
  /**
   * Capa: a foto do Steve Jobs apontando, escolhida pelo dono. O dedo furando a
   * quarta parede é o que para o scroll. Montada por
   * `node server/scripts/arte-design-apple-capa.cjs`, que amplia a foto, sobe o
   * enquadramento pra tirar o dedo da faixa do texto e dissolve o rodapé em preto.
   * A arte já sai com o rodapé preto chapado, por isso `scrim: 'bloco'`: a rampa
   * longa padrão subiria um véu cinza por cima do rosto sem precisar.
   */
  bgImage: 'server/carrossel/assets/design-apple/capa.png',
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      // A capa repete o TÍTULO do post, não inventa outro gancho. O que era o
      // título anterior ("seu site tem cara de IA") desceu pro subtítulo, que é
      // onde mora a tensão (ver memória subtitulo-da-capa-e-tensao).
      tituloMenor: true,
      // 1.05 × 1.2: o dono pediu a capa 20% maior que a calibragem padrão de 3 linhas.
      tituloEscala: 1.26,
      titulo: 'Design nível **APPLE**\nnos seus projetos\ncom uma Skill',
      subtitulo: 'Seus sites com cara de caros.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'A diferença',
      titulo: 'A mesma tela,\n**sem e com**',
      corpo:
        'Não é talento que falta pra IA: é instrução. À esquerda, o que ela entrega quando ninguém disse nada. À direita, a mesma tela depois das regras.',
      // As duas telas são ilustração nossa, geradas por
      // `node server/scripts/arte-design-apple.cjs`. O lado direito aplica de
      // verdade o que o carrossel ensina, pra o slide não se contradizer.
      imagem: 'server/carrossel/assets/design-apple/antes-depois.png',
    },
    {
      variant: 'light',
      topIcon: 'bookmark',
      eyebrow: 'O que é',
      titulo: 'Um arquivo que ele lê\n**antes de codar**',
      // O repositório em caixa própria, logo abaixo do título: diluído no meio do
      // parágrafo, ninguém saía sabendo qual repo era. O caminho da skill vem
      // junto porque o repo tem 10 e só uma é a de design da Apple.
      // O crédito e a licença moraram no corpo até estourarem o slide: com a
      // caixa + 6 linhas de texto + callout, o rodapé era cortado. Foram pra
      // caixa, que é onde se lê em 1 segundo.
      terminal: [
        '→ github.com/emilkowalski/skills',
        '✓ skills/apple-design',
        '✓ MIT, por Emil Kowalski (Sonner)',
      ],
      corpo:
        'Skill é uma pasta com um arquivo de regras que o Claude abre sozinho quando o assunto aparece. Esta tem **17 regras de interface** tiradas das palestras de design da Apple.',
      // O callout ("a IA não erra o design por falta de talento") saiu daqui: com
      // a caixa de 3 linhas o slide passava dos 450px e comia o rodapé. A frase
      // continua viva, é a abertura da legenda.
    },
    {
      variant: 'purple',
      topIcon: 'code',
      eyebrow: 'Regra 15 de 17',
      titulo: 'Tipografia',
      tituloEscala: 1.36,
      subtitulo: 'Título grande pede letra mais junta',
      // Sem destaque no corpo: neste slide o fundo é roxo, e o realce vira roxo
      // claro sobre roxo e some.
      corpo:
        'É o ajuste que mais muda a cara de uma tela, e quase ninguém faz. Título grande com as letras mais próximas e a entrelinha curta. O texto corrido fica no natural.',
      terminal: [
        '.titulo {',
        '  line-height: 1.05;',
        '  letter-spacing: -0.02em;',
        '}',
      ],
    },
    {
      variant: 'dark',
      topIcon: 'layers',
      eyebrow: 'Regra 12 de 17',
      titulo: 'Profundidade',
      tituloEscala: 1.36,
      subtitulo: 'Vidro fosco no lugar de sombra pesada',
      corpo:
        'O que está na frente não precisa de uma sombra preta embaixo. Precisa deixar o que está atrás aparecer **borrado**, como vidro.',
      terminal: [
        '.barra {',
        '  background: rgba(255,255,255,.6);',
        '  backdrop-filter: blur(20px)',
        '    saturate(180%);',
        '}',
      ],
    },
    {
      variant: 'light',
      topIcon: 'mouse',
      eyebrow: 'Regra 1 de 17',
      titulo: 'Resposta',
      tituloEscala: 1.36,
      subtitulo: 'A tela reage no toque, não ao soltar',
      corpo:
        'Duas linhas que separam **travado** de **vivo**: o botão encolhe no instante em que o dedo encosta, e não depois que você solta.',
      terminal: [
        '.botao:active {',
        '  transform: scale(0.97);',
        '  transition: transform',
        '    100ms ease-out;',
        '}',
      ],
    },
    {
      variant: 'dark',
      topIcon: 'loop',
      eyebrow: 'Regra 4 de 17',
      titulo: 'Mola',
      tituloEscala: 1.36,
      subtitulo: 'Movimento com física, não com cronômetro',
      corpo:
        'Em vez de mandar durar meio segundo, você diz **como a coisa se comporta**: quão rápido ela chega e se ela quica ao chegar.',
      calloutDepois: true,
      calloutLabel: 'Os números:',
      callout: '"Sem quique e chegando em 0,3 a 0,4 segundo serve pra quase tudo. Um quique leve fica pra gaveta que você joga com o dedo."',
    },
    {
      variant: 'light',
      eyebrow: 'Como instalar',
      titulo: 'Instalar é\n**um comando**',
      // A 2ª linha do bloco NÃO é um comando de listagem: não existe `/skills` no
      // Claude Code (conferido na doc oficial em 12/08/2026). O que existe é
      // chamar a skill pelo nome dela, `/apple-design`, e é isso que está ali.
      terminal: [
        '$ npx skills@latest add \\',
        '    emilkowalski/skills',
        '✓ /apple-design',
      ],
      corpo:
        'O repositório é o **emilkowalski/skills**, no GitHub, e vêm 10 skills na mesma instalação: a de design da Apple é uma delas. Depois o Claude abre o arquivo sozinho quando o assunto for tela, e você também pode chamar na mão digitando **/apple-design**.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer as 17 na mão?',
      botao: 'Comente DESIGN 👇',
      corpo:
        'Comenta DESIGN que eu te mando as 17 regras em português, o comando pra instalar e as outras duas skills de design que vêm junto no mesmo repositório.',
    },
  ],
  legenda:
    'Seu site não tem cara de IA por falta de talento da IA.\n\n' +
    'Tem porque ninguém disse pra ela como uma tela boa se comporta. Skill é uma pasta com um arquivo de regras que o Claude abre sozinho quando o assunto aparece, e existe uma com 17 regras de interface tiradas das palestras de design da Apple.\n\n' +
    'O repositório é o emilkowalski/skills, no GitHub. De graça, código aberto (MIT), e quem montou foi Emil Kowalski, o mesmo do Sonner.\n\n' +
    'Quatro delas, com o código que você cola hoje:\n\n' +
    '1. Tipografia. É o ajuste que mais muda a cara de uma tela: título grande com as letras mais próximas e a ' +
    'entrelinha curta. O texto corrido fica no natural.\n' +
    'line-height: 1.05; letter-spacing: -0.02em;\n\n' +
    '2. Profundidade. O que está na frente não precisa de sombra preta embaixo: precisa deixar o que está atrás ' +
    'aparecer borrado, como vidro.\n' +
    'background: rgba(255,255,255,.6); backdrop-filter: blur(20px) saturate(180%);\n\n' +
    '3. Resposta. O botão encolhe no instante em que o dedo encosta, não depois que você solta. São duas linhas, e é ' +
    'a diferença entre parecer travado e parecer vivo.\n' +
    '.botao:active { transform: scale(0.97); transition: transform 100ms ease-out; }\n\n' +
    '4. Mola. Em vez de mandar durar meio segundo, você diz como a coisa se comporta. Sem quique e chegando em 0,3 a ' +
    '0,4 segundo serve pra quase tudo.\n\n' +
    'Instala assim, e vêm 10 skills junto:\n' +
    'npx skills@latest add emilkowalski/skills\n\n' +
    'Aviso honesto: isso não faz o design sozinho, e a Apple não tem nada a ver com o repositório. É o guia de comportamento que faltava pra IA parar de entregar tela que parece template.\n\n' +
    'Comenta DESIGN aqui embaixo que eu te mando as 17 em português e o passo a passo. 👇',
  hashtags:
    'design uidesign claudecode programacao devweb frontend inteligenciaartificial vibecoding devemdobro aprenderprogramar',
  ctaFinal:
    'Comenta DESIGN que eu te mando as 17 regras em português, o comando pra instalar e as outras duas skills de design do mesmo repositório.',
  briefing:
    'ORIGEM: reel do @marianatorre.s (1.539 curtidas, 3.156 comentários), capturado pelo Telegram em 10/08/2026. ' +
    'Mais comentário que curtida, puxado pelo CTA de palavra gatilho ("comenta DESIGN"). Mantivemos a mesma palavra: ' +
    'é a que a audiência dela já digitou, e o tema é idêntico.\n\n' +
    'O QUE MUDOU EM RELAÇÃO À REFERÊNCIA\n' +
    'Ela diz "17 regras de movimento e espaçamento". O número está certo (conferido no repo), mas as 17 são de ' +
    'INTERFACE: resposta ao toque, movimento, materiais, tipografia, acessibilidade, processo. Espaçamento é uma ' +
    'parte da regra 15. Aqui falamos "17 regras" e mostramos quatro pela ordem do próprio arquivo.\n' +
    'Ela é reels e entrega a promessa; o nosso é carrossel e entrega quatro regras de verdade antes do CTA.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 capa: uma tensão só (seu site tem cara de IA).\n' +
    'Regra 2: o slide 2 explica o que é Skill em uma frase e diz de onde vêm as regras.\n' +
    'Regra 3: cada regra funciona printada sozinha (nome grande + o que é + exemplo).\n' +
    'Regra 4 slide salvável: três dos quatro slides de regra trazem o CSS pronto pra colar, e o da Mola traz os ' +
    'números (sem quique, 0,3 a 0,4 s). A 1ª versão trazia as regras de gesto e o dono cortou: eram vagas pra quem ' +
    'faz site, porque só se sente em coisa que se arrasta.\n' +
    'Regra 5: CTA único, comenta DESIGN.\n\n' +
    'PENDENTE 1 (capa): a arte ainda não existe. O slide 1 está no gradiente JARVIS. Ideia do prompt: a mesma tela ' +
    'lado a lado, a da esquerda com cara de template de IA e a da direita com acabamento de produto, terço de baixo ' +
    'vazio pro texto.\n' +
    'PRESENTE: pronto (Notion, em linkPresente). As 17 em português, o comando, as outras duas skills de design e um ' +
    'aviso honesto que o carrossel não tem espaço pra dar: várias regras (mola, entrega de velocidade, projeção de ' +
    'impulso) só aparecem de verdade em coisa que se arrasta. Em site de conteúdo o que muda é a 1, a 11 e a 15.',
};
