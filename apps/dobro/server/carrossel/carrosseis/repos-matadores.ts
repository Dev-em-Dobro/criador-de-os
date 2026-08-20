/**
 * apps/dobro — carrossel "O matador do Cursor é de graça. E tem mais 4."
 *
 * ORIGEM: referência do board lida slide a slide em 19/08/2026
 * (https://www.instagram.com/p/Db_NfRmDFXd/, @sebastianhardy_): "THESE 7 REPOS
 * FEEL F*CKING ILLEGAL / They kill your AI bills", 12 slides, um repo por slide
 * no formato "The X killer", com as estrelas e o preço do concorrente no rodapé.
 *
 * POR QUE ESTA REFERÊNCIA: é a fórmula do maior post da conta. "7 repos open
 * source que substituem software pago" (10/08/2026) fez 34.796 de alcance, 572
 * comentários, 84,7 salv/1k e 282 SEGUIDORES, o campeão do mês. A referência
 * repete a estrutura e acrescenta duas coisas que o nosso não tinha: nomear o
 * inimigo pago em cada slide e mostrar o que ele cobra.
 *
 * OS DOIS CORTES (decisão do dono, 19/08/2026: cinco, não sete):
 *   · HeyGem (duixcom/Duix-Avatar, o matador do HeyGen) ficou de fora porque o
 *     próprio repositório exige NVIDIA RTX 4070, 32 GB de memória e mais de 130
 *     GB de disco. Não é ferramenta pro notebook de quem está começando.
 *   · harper (Automattic, o matador do Grammarly) ficou de fora porque é
 *     corretor de gramática de INGLÊS (as próprias tags do repo dizem
 *     english-language). Rende pouco pra uma audiência que escreve em português.
 *
 * PRECISÃO — CADA AFIRMAÇÃO, NA FONTE PRIMÁRIA (conferido em 19/08/2026):
 *   · anomalyco/opencode: 199,2 mil estrelas, licença MIT, About literal "The
 *     open source coding agent". Traz dois agentes embutidos, "build" (acesso de
 *     escrita) e "plan" (só leitura). Instala por uma linha de curl.
 *   · Zackriya-Solutions/meetily: 29,5 mil estrelas, MIT, About literal
 *     "Privacy first, AI meeting assistant with 4x faster Parakeet/Whisper live
 *     transcription, speaker diarization, and Ollama summarization built on
 *     Rust. 100% local processing. no cloud required". Tem instalador pronto:
 *     x64-setup.exe no Windows e .dmg no macOS.
 *   · presenton/presenton: 9,7 mil estrelas, Apache 2.0, About literal
 *     "Open-Source AI Presentation Generator and API (Gamma, Canva, Beautiful
 *     AI, Decktopus, Presentations AI Alternative)". Exporta .pptx editável e
 *     PDF. Roda por um comando de Docker ou como aplicativo de desktop, e aceita
 *     tanto chave de API quanto Ollama local. GPU é opcional.
 *   · ItzCrazyKns/Vane (o antigo Perplexica): 36,3 mil estrelas, MIT, About
 *     literal "Vane is an AI-powered answering engine". Precisa do SearxNG (que
 *     vem junto na instalação por Docker) e de um provedor de modelo, que pode
 *     ser o Ollama local. Não exige GPU.
 *   · Fosowl/agenticSeek: 26,9 mil estrelas, GPL-3.0, About literal "Fully Local
 *     Manus AI. No APIs, No $200 monthly bills. Enjoy an autonomous agent that
 *     thinks, browses the web, and code for the sole cost of electricity". A
 *     tabela do próprio README pede 12 GB de VRAM para tarefas simples e 24 GB
 *     ou mais como recomendado.
 *
 * PREÇO, E POR QUE SÓ DOIS APARECEM: a regra da casa é preço conferido na fonte
 * primária, e preço errado é o erro mais caro que a conta pode cometer (foi por
 * isso que o carrossel do Manus não traz preço nenhum).
 *   · CONFERIDOS e usados: cursor.com/pricing diz "$20 / mo." no plano Pro;
 *     otter.ai/pricing diz "$16.99 /user/month" no Pro cobrado mês a mês (com
 *     $8.33 no anual).
 *   · NÃO CONFERIDOS, e por isso NENHUM valor aparece nos slides do presenton,
 *     do Vane e do agenticSeek: gamma.app/pricing e perplexity.ai/pricing estão
 *     atrás do Cloudflare e não abriram nem pelo navegador do agente, e a página
 *     do Manus não entrega os planos. Os terceiros divergem (o Gamma aparece
 *     como US$ 8, US$ 10 e US$ 12 conforme a fonte), então a casa não repassa
 *     nenhum. Onde não há preço conferido, o slide fala do que o pago cobra em
 *     ASSINATURA, sem número.
 *   · A frase "No $200 monthly bills" no slide do agenticSeek NÃO é preço do
 *     Manus afirmado pela casa: é citação literal do About do repositório, e
 *     está marcada como citação.
 *
 * A LACUNA (memória carrossel-lacuna-do-endereco): nenhum comando de instalação
 * aparece em slide. Ensinar o caminho e esconder o endereço rendeu 65,3
 * comentários por mil, contra 7,3 de quem põe o comando na arte.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const reposMatadores: Carrossel = {
  slug: 'repos-matadores',
  // 45 caracteres, o teto do traço "título curto". Nome próprio (Cursor, que
  // está na lista da régua), número e "de graça" na mesma linha: 90/100.
  titulo: 'O matador do Cursor é de graça. E tem mais 4.',
  gancho: 'O matador do Cursor é de graça. E tem mais 4, um pra cada assinatura de IA que você paga.',
  dataProgramada: '2026-08-20',
  refsLinks:
    'https://www.instagram.com/p/Db_NfRmDFXd/ (referência: @sebastianhardy_, 12 slides lidos em 19/08/2026)\n' +
    'https://github.com/anomalyco/opencode (199,2 mil estrelas, MIT, "The open source coding agent")\n' +
    'https://github.com/Zackriya-Solutions/meetily (29,5 mil, MIT, 100% local, instalador .exe e .dmg)\n' +
    'https://github.com/presenton/presenton (9,7 mil, Apache 2.0, exporta .pptx editável)\n' +
    'https://github.com/ItzCrazyKns/Vane (36,3 mil, MIT, o antigo Perplexica)\n' +
    'https://github.com/Fosowl/agenticSeek (26,9 mil, GPL-3.0, pede 12 GB de VRAM no mínimo)\n' +
    'https://cursor.com/pricing (Pro "$20 / mo.", conferido)\n' +
    'https://otter.ai/pricing (Pro "$16.99 /user/month" no mensal, conferido)',
  /**
   * Presente do "comenta REPOS", criado no Notion em 19/08/2026. Entrega as três
   * coisas do CTA, e a PARTE 1 vem antes dos links de propósito: é a régua de
   * qual roda na máquina de quem está lendo. O erro que esse presente evita é a
   * pessoa escolher o mais bonito da lista e perder a tarde num agente que pede
   * 12 GB de placa de vídeo.
   */
  linkPresente: 'https://app.notion.com/p/3c16dd01fb4881c18e17ffd4c0a47f02',
  slides: [
    {
      variant: 'photo',
      cover: true,
      // SEM ARTE ainda: nasce no gradiente de fallback e espera a imagem do dono
      // (memória capa-quem-faz-e-o-dono). Quando ela chegar, sai o `semFundo` e
      // entra a `bgImage` do carrossel.
      semFundo: true,
      tituloMenor: true,
      titulo: 'O matador do **Cursor**\né de graça.\nE tem mais **4**.',
      // Subtítulo é TENSÃO, nunca argumento (memória subtitulo-da-capa-e-tensao),
      // e a tensão aqui é verdadeira: o slide 6 mostra qual é o que não roda.
      subtitulo: 'São 5. E um deles não vai rodar no seu notebook.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: '01 · o matador do Cursor',
      // O slide 2 CONFIRMA o gancho da capa (Fura a Bolha, regra 2).
      titulo: 'Chama **opencode**',
      subtitulo: 'A mesma IA que escreve o código, rodando no seu terminal.',
      corpo:
        'Você escolhe o modelo que ele usa, em vez de aceitar o que vem na assinatura. E ele já vem com **dois modos**: um que só lê e planeja, outro que mexe nos arquivos.',
      calloutLabel: 'A conta',
      callout: 'O Cursor Pro custa US$ 20 por mês, na página deles. O opencode é MIT, com 199 mil estrelas no GitHub.',
      calloutDepois: true,
    },
    {
      variant: 'light',
      eyebrow: '02 · o matador do Otter.ai',
      titulo: 'Chama **meetily**',
      subtitulo: 'Ele fica na sua reunião, transcreve e entrega o resumo.',
      corpo:
        'Separa quem falou o quê e devolve as tarefas no fim. E o áudio **não sai do seu computador**, o que muda tudo quando a reunião é de cliente.',
      calloutLabel: 'A conta',
      callout: 'O Otter Pro custa US$ 16,99 por mês no plano mensal, na página deles. O meetily é MIT, e é o único da lista que instala com dois cliques: tem .exe pro Windows e .dmg pro Mac.',
      calloutDepois: true,
    },
    {
      variant: 'purple',
      // SEM **destaque** em slide roxo: o realce vira lilás e some.
      eyebrow: '03 · o matador do Gamma',
      titulo: 'Chama presenton',
      subtitulo: 'Você digita o tema e ele monta a apresentação inteira.',
      corpo:
        'Escreve os slides, escolhe as imagens e exporta em PowerPoint editável ou PDF. Dá pra ligar numa IA paga ou no Ollama, que roda de graça na sua máquina.',
      calloutLabel: 'A conta',
      callout: 'Ferramenta de apresentação com IA se paga por assinatura mensal. Essa é Apache 2.0, e você usa em quantos slides quiser.',
      calloutDepois: true,
    },
    {
      variant: 'light',
      eyebrow: '04 · o matador do Perplexity',
      titulo: 'Chama **Vane**',
      subtitulo: 'Pergunta qualquer coisa e ele busca na web na hora.',
      corpo:
        'Lê as páginas e responde **com as fontes do lado**, pra você conferir de onde veio. É o antigo Perplexica, com 36 mil estrelas e licença MIT.',
      calloutLabel: 'A diferença que importa',
      callout: 'Ninguém conta quantas perguntas você fez, porque o limite não é de um plano: é do seu computador.',
      calloutDepois: true,
    },
    {
      variant: 'dark',
      topIcon: 'ban',
      eyebrow: '05 · o matador do Manus',
      titulo: 'Chama **agenticSeek**',
      subtitulo: 'Você dá a tarefa e ele abre um navegador de verdade.',
      corpo:
        'Pesquisa sozinho, mexe nos seus arquivos e escreve código. **Esse é o que não roda em qualquer máquina**: o próprio projeto pede 12 GB de placa de vídeo pro básico, e 24 GB pra ficar bom.',
      // A citação vai TRADUZIDA. No original ("Fully Local Manus AI. No APIs, No
      // $200 monthly bills...") ela dá autoridade pra quem lê inglês e vira
      // parede pra quem não lê, que é justamente quem este carrossel quer.
      calloutLabel: 'O que está escrito no repositório',
      callout: '"Manus AI 100% local. Sem API, sem conta de 200 dólares por mês. Um agente autônomo que pensa, navega na web e escreve código pelo custo da eletricidade."',
      calloutDepois: true,
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse slide',
      titulo: 'Por qual **começar**',
      // Bloco de terminal: é a régua de esforço, que é o que separa quem instala
      // de quem só salva. Denso porque são cinco linhas com o nome à esquerda.
      denso: true,
      terminal: [
        'meetily      → instalador pronto, sem terminal',
        'opencode     → 1 linha no terminal',
        'presenton    → 1 comando, ou o app de desktop',
        'Vane         → 1 comando, e ele sobe a busca junto',
        'agenticSeek  → só com placa de vídeo forte',
      ],
      corpo:
        'Se você nunca abriu um terminal, comece pelo **meetily**. Se já usa IA pra programar, o **opencode** é o que muda o seu dia hoje.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer os 5 links\ne o passo a passo?',
      botao: 'Comenta REPOS 👇',
      // Três entregas concretas e diferentes entre si (memória cta-tres-entregas).
      corpo:
        'Te mando os 5 links no GitHub, o comando de instalação de cada um e a régua de qual deles roda no seu computador.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  // Legenda pela METADE e 5 hashtags (memória legenda-curta-e-5-hashtags). A
  // linha "Segue @devemdobro..." NÃO entra aqui: é montada na hora.
  legenda:
    'Comenta REPOS que eu te mando os 5 links. 🧰\n\n' +
    'Tem uma assinatura de IA pra cada coisa hoje: uma pra programar, uma pra transcrever reunião, uma pra montar ' +
    'apresentação, uma pra pesquisar. Cada uma parece barata sozinha, e juntas viram uma conta fixa todo mês.\n\n' +
    'Esses 5 repositórios fazem o mesmo trabalho, são open source e rodam na sua máquina. O opencode é a mesma ' +
    'ideia do Cursor no seu terminal, e o Cursor Pro custa 20 dólares por mês na página deles. O meetily transcreve ' +
    'a reunião sem o áudio sair do seu computador, e o Otter Pro custa 16,99 por mês no mensal.\n\n' +
    'O aviso honesto: um deles, o agenticSeek, pede placa de vídeo forte. Os outros quatro rodam em máquina comum, ' +
    'e o meetily tem até instalador pronto pra Windows e Mac.\n\n' +
    'Comenta REPOS aqui embaixo. 👇',
  // Cinco, uma de cada função: categoria, alcance, nicho, público, marca.
  hashtags: 'opensource inteligenciaartificial ferramentasdeia iaparadev devemdobro',
  ctaFinal:
    'Comenta REPOS que eu te mando os 5 links no GitHub, o comando de instalação de cada um e a régua de qual deles roda no seu computador.',
  briefing:
    'ORIGEM: referência do board (https://www.instagram.com/p/Db_NfRmDFXd/, @sebastianhardy_), 12 slides lidos um a ' +
    'um em 19/08/2026 com o `conteudo:capturar-slides`. A legenda dela não dizia nada disso; o gancho estava na ' +
    'arte ("THESE 7 REPOS FEEL F*CKING ILLEGAL / They kill your AI bills").\n\n' +
    'POR QUE ESTA REFERÊNCIA: é a fórmula do maior post da conta. "7 repos open source que substituem software ' +
    'pago" (10/08/2026) fez 34.796 de alcance, 572 comentários, 84,7 salv/1k e 282 SEGUIDORES. No mesmo período, ' +
    'os posts de ferramenta única ficaram em 1 seguidor (Graphify em 12/08, perfil do GitHub em 16/08). Lista de ' +
    'ferramenta é o que traz gente; ferramenta única, não.\n\n' +
    'O QUE MUDOU EM RELAÇÃO À REFERÊNCIA\n' +
    '1. São CINCO, não sete (decisão do dono). Saíram o HeyGem, que exige NVIDIA RTX 4070 e mais de 130 GB de ' +
    'disco, e o harper, que é corretor de gramática de inglês.\n' +
    '2. Entrou o slide 7, que a referência não tem: a régua de esforço, dizendo por qual começar. É o slide ' +
    'salvável, e é o que responde a pergunta que a lista dela deixa no ar.\n' +
    '3. O aviso da placa de vídeo no agenticSeek é nosso. A referência vende os sete como se fossem iguais.\n\n' +
    'PREÇO: só os dois conferidos na fonte primária entram com número (Cursor Pro "$20 / mo." e Otter Pro "$16.99 ' +
    '/user/month" no mensal). Gamma, Perplexity e Manus estão atrás do Cloudflare e não abriram nem pelo navegador ' +
    'do agente, e os terceiros divergem, então nos slides deles a palavra é "assinatura", sem valor. A frase "No ' +
    '$200 monthly bills" é citação literal do About do agenticSeek, marcada como citação, não é preço afirmado ' +
    'pela casa.\n\n' +
    'LACUNA (memória carrossel-lacuna-do-endereco): nenhum comando de instalação aparece em slide. O que fica de ' +
    'fora e vira o presente é o link de cada repositório, o comando de instalação de cada um e a régua de ' +
    'requisitos por máquina.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): o preço do Cursor contra zero, e o "e tem mais 4".\n' +
    'Regra 2 (o slide 2 confirma): o opencode é o matador do Cursor, com a conta do lado.\n' +
    'Regra 3 (slide sozinho): cada repo se explica sem o anterior.\n' +
    'Regra 4 (salvável): o slide 7, marcado com "salva esse slide".\n' +
    'Regra 5 (CTA único): comenta REPOS.\n\n' +
    'PRESENTE: página criada no Notion em 19/08/2026 (link em linkPresente e no campo do card). A parte 1 é a ' +
    'régua de qual roda em qual máquina, antes dos links, porque é o erro que custa a tarde de quem instala.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: a arte de capa. Hoje está no gradiente de fallback (semFundo), esperando a imagem ' +
    'do dono. Quando ela chegar, tirar o semFundo do slide 1 e apontar a bgImage.',
};
