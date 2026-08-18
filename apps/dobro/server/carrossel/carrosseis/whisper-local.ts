/**
 * apps/dobro — carrossel do Whisper (transcrever áudio de graça na própria
 * máquina), com o eixo VIRADO PARA SERVIÇO VENDÁVEL: quem paga por transcrição,
 * quanto paga, e por que rodar local é argumento de venda e não só economia.
 *
 * MUDANÇA DE EIXO (pedido do dono, 15/08/2026): a versão anterior era "para de
 * gastar com o que é aberto", falava só de economia pessoal. O dono pediu
 * exemplos práticos de uso e de quanto a pessoa poderia cobrar. Aqui o virar de
 * chave é o mesmo do n8n: a ferramenta é de graça pra você e o serviço é pago
 * pelo cliente.
 *
 * ⚠️ PREÇO É AFIRMAÇÃO VERIFICÁVEL. Faixas praticadas no Brasil em 2026,
 * conferidas em 15/08/2026 (vozparatexto.com.br, guia de preços 2026, e
 * auditorioibirapuera.com.br):
 *   · transcrição padrão (entrevista, podcast simples): R$ 3,00 a R$ 5,00 por
 *     minuto de áudio
 *   · técnica ou acadêmica: R$ 5,00 a R$ 7,50 por minuto
 *   · jurídica ou forense: R$ 8,00 a R$ 12,00 por minuto
 *   · a HORA transcrita, com áudio bem gravado e até dois interlocutores:
 *     R$ 225,00, o equivalente a cerca de R$ 3,75 por minuto
 *   · em plataformas de freelancer, a hora transcrita fica entre R$ 90 e R$ 180
 *   · urgência (entrega no mesmo dia) acrescenta de 50% a 100%
 *   · as faixas consideram prazo de 48 a 72 horas
 *
 * FATOS DA FERRAMENTA, NA FONTE PRIMÁRIA (github.com/openai/whisper, 15/08/2026):
 *   · openai/whisper, licença MIT, Python, 107.322 estrelas
 *   · reconhecimento de fala multilíngue, com identificação de idioma e tradução
 *     da fala para o inglês
 *   · modelos tiny, base, small, medium, large e turbo
 *   · instala com `pip install -U openai-whisper` e exige FFmpeg; uso:
 *     `whisper audio.mp3 --model turbo`
 *   · ggml-org/whisper.cpp (MIT, 52.920 estrelas) é a porta de entrada pra
 *     máquina fraca, porque roda em CPU. Fica no presente, não no slide.
 *   · NÃO afirmamos requisito de GPU, consumo de RAM nem velocidade: não foram
 *     medidos aqui.
 *
 * A LACUNA: o comando de instalação não entra em slide (memória
 * carrossel-lacuna-do-endereco). Vai no presente.
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

export const whisperLocal: Carrossel = {
  slug: 'whisper-local',
  titulo: 'Transcrição custa R$ 225 a hora e o seu PC faz de graça',
  gancho: 'Transcrição custa R$ 225 a hora no mercado, e o seu computador faz isso de graça.',
  dataProgramada: '2026-08-19',
  refsLinks:
    'https://github.com/openai/whisper (fonte primária: README e API do GitHub, 15/08/2026)\n' +
    'https://github.com/ggml-org/whisper.cpp (versão que roda em CPU, pra máquina fraca)\n' +
    'https://www.vozparatexto.com.br/blog/quanto-custa-uma-transcricao-de-audio-em-2026-guia-completo-de-precos-e-modelos (faixas de preço)\n' +
    'https://www.auditorioibirapuera.com.br/quanto-devo-cobrar-por-transcricao/ (faixas de preço)',
  /**
   * Presente do "comenta AUDIO" (Notion, 15/08/2026): o comando de instalação,
   * qual modelo escolher pra cada máquina, o caminho do whisper.cpp pra PC fraco,
   * a tabela de preço por nicho e o roteiro de como oferecer pro primeiro cliente.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   * PENDENTE: colar o link de inscrição do DevQuest no lugar do placeholder.
   */
  linkPresente: 'https://app.notion.com/p/3bd6dd01fb48818ead0ad49680e2e233',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      baixo: true,
      // 25.8 × 1.15 = 29,7px, ~21 caracteres por linha nos 308px úteis. As três
      // linhas têm 17, 14 e 20. A 1ª versão, no tamanho cheio, quebrava sozinha
      // em cinco linhas e deixava "225" e "PC" órfãos (conferido no PNG).
      tituloMenor: true,
      tituloEscala: 1.15,
      titulo: 'Transcrição custa\n**R$ 225 a hora**.\nSeu PC faz de graça.',
      subtitulo: 'Advogado, jornalista e podcaster pagam isso todo mês.',
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'ai',
      eyebrow: 'A ferramenta',
      titulo: 'Chama **Whisper**,\ne é da OpenAI',
      corpo:
        'Licença **MIT**, código e modelos abertos, **107 mil estrelas** no GitHub. Ele transcreve áudio e vídeo **na sua máquina**, entende português e ainda identifica o idioma sozinho.',
    },
    {
      variant: 'dark',
      layout: 'center',
      icone: 'bookmark',
      titulo: 'Salva esse post\npra usar depois',
      corpo: 'A tabela de preço e o argumento que fecha o cliente vêm nos próximos slides.',
    },
    {
      variant: 'purple',
      eyebrow: 'Quem paga por isso',
      titulo: 'Quatro clientes que\njá procuram isso',
      itens: [
        { icone: 'skull', titulo: 'Advogado', sub: 'Audiência e depoimento, a faixa mais bem paga' },
        { icone: 'camera', titulo: 'Podcaster e criador', sub: 'Legenda, corte e post nascem do texto' },
        { icone: 'map', titulo: 'Pesquisador', sub: 'Entrevista de campo que precisa virar texto' },
        { icone: 'follow', titulo: 'Clínica e consultório', sub: 'Reunião e atendimento que viram registro' },
      ],
    },
    {
      variant: 'light',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'Quanto **cobrar**',
      terminal: [
        'ENTREVISTA   R$ 3,00 a 5,00 por minuto de áudio',
        'TÉCNICA      R$ 5,00 a 7,50 por minuto',
        'JURÍDICA     R$ 8,00 a 12,00 por minuto',
        'A HORA       R$ 225,00 com áudio bom',
        'URGÊNCIA     de 50% a 100% em cima',
      ],
      corpo:
        'Faixas praticadas no Brasil em 2026, com prazo de 48 a 72 horas. **Uma hora de áudio jurídico passa de R$ 500**, e a máquina faz o trabalho pesado enquanto você almoça.',
    },
    {
      variant: 'dark',
      eyebrow: 'O argumento que fecha',
      titulo: 'O áudio **não sai\nda sua máquina**',
      corpo:
        'Serviço em nuvem exige subir o arquivo pro servidor de outra empresa. Audiência, consulta e reunião de sócio **não podem sair andando por aí**.\n\n' +
        'Rodando local, você olha o cliente e diz: **o arquivo nunca sai daqui**. Esse é o argumento que a concorrência barata não tem.',
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'A máquina transcreve.\nQuem **entrega é você**',
      corpo:
        'O texto cru sai com nome errado, pontuação torta e sigla estranha. O que o cliente paga é o arquivo **revisado, com falante marcado e horário**.\n\n' +
        'Se o seu PC for fraco, começa pelo modelo pequeno: demora mais e erra mais, mas roda.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o comando e a\ntabela de preço?',
      botao: 'Comenta AUDIO 👇',
      corpo:
        'Te mando o comando de instalação, qual modelo escolher pro seu computador e a tabela de quanto cobrar em cada tipo de transcrição.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta AUDIO que eu te mando o comando e a tabela de preço. 🎙️\n\n' +
    'Uma hora de áudio transcrita custa em média R$ 225 no Brasil, quando o áudio é bem gravado e tem até dois interlocutores. Se for audiência de advogado, o minuto vai de R$ 8 a R$ 12, e a hora passa de R$ 500.\n\n' +
    'E o seu computador faz esse trabalho de graça.\n\n' +
    'A ferramenta chama Whisper, é da OpenAI, tem licença MIT e mais de 107 mil estrelas no GitHub. Código e modelos abertos, rodando na sua máquina, entendendo português e identificando o idioma sozinho.\n\n' +
    'Quem já procura isso hoje: advogado (audiência e depoimento), podcaster e criador de conteúdo (legenda, corte e post nascem do texto), pesquisador (entrevista de campo) e clínica (reunião e atendimento que viram registro).\n\n' +
    'As faixas praticadas em 2026, com prazo de 48 a 72 horas:\n\n' +
    'Entrevista e podcast: R$ 3,00 a R$ 5,00 por minuto de áudio.\n' +
    'Técnica ou acadêmica: R$ 5,00 a R$ 7,50 por minuto.\n' +
    'Jurídica ou forense: R$ 8,00 a R$ 12,00 por minuto.\n' +
    'Urgência no mesmo dia: de 50% a 100% em cima do valor.\n\n' +
    'E tem um argumento de venda que a concorrência barata não tem: rodando na sua máquina, o áudio não sobe pra servidor de ninguém. Audiência, consulta e reunião de sócio não podem sair andando por aí, e você pode olhar o cliente e dizer que o arquivo nunca sai dali.\n\n' +
    'O aviso honesto: a máquina transcreve, quem entrega é você. O texto cru sai com nome errado e pontuação torta. O que o cliente paga é o arquivo revisado, com falante marcado e horário. E se o seu PC for fraco, começa pelo modelo pequeno.\n\n' +
    'Comenta AUDIO aqui embaixo que eu te mando o comando de instalação, qual modelo escolher pro seu computador e a tabela de quanto cobrar em cada tipo de transcrição. 👇',
  hashtags:
    'whisper transcricao inteligenciaartificial opensource freelancer rendaextra programacao devbr devemdobro produtividade',
  ctaFinal:
    'Comenta AUDIO que eu te mando o comando de instalação, qual modelo escolher pro seu computador e a tabela de quanto cobrar em cada tipo de transcrição.',
  briefing:
    'EIXO NOVO (pedido do dono, 15/08/2026): sai "para de gastar com o que é aberto", entra "o serviço que o seu PC ' +
    'faz de graça e o cliente paga". Mesma virada do n8n de terça: a ferramenta é gratuita pra você, o serviço é ' +
    'pago pelo cliente.\n\n' +
    'PREÇOS CONFERIDOS (15/08/2026), porque preço é afirmação verificável. Fontes: vozparatexto.com.br (guia de ' +
    'preços 2026) e auditorioibirapuera.com.br.\n' +
    '  · padrão (entrevista, podcast): R$ 3,00 a R$ 5,00 por minuto de áudio\n' +
    '  · técnica ou acadêmica: R$ 5,00 a R$ 7,50 por minuto\n' +
    '  · jurídica ou forense: R$ 8,00 a R$ 12,00 por minuto\n' +
    '  · hora transcrita com áudio bom e até dois interlocutores: R$ 225,00 (cerca de R$ 3,75 por minuto)\n' +
    '  · em plataformas de freelancer: R$ 90 a R$ 180 a hora transcrita\n' +
    '  · urgência no mesmo dia: 50% a 100% em cima; as faixas assumem prazo de 48 a 72 horas\n' +
    'O número da capa (R$ 225 a hora) é o mais defensável dos que existem, porque vem com a condição junto (áudio ' +
    'bem gravado, até dois interlocutores).\n\n' +
    'SERVIÇOS VENDÁVEIS COM A MESMA FERRAMENTA (estão no presente e servem de pauta pra outros posts):\n' +
    '  1. Transcrição jurídica: audiência e depoimento, a faixa mais bem paga, e a que mais precisa de sigilo.\n' +
    '  2. Ata de reunião automática: transcreve e a IA resume em decisões e responsáveis. Aqui casa com o n8n de ' +
    'terça: o áudio cai numa pasta, o fluxo transcreve, resume e manda no WhatsApp.\n' +
    '  3. Legenda e corte pra criador de conteúdo: o texto vira legenda, e os trechos viram post.\n' +
    '  4. Entrevista de pesquisa acadêmica: volume grande, prazo folgado, cliente que volta.\n' +
    '  5. Registro de atendimento pra clínica e consultório.\n\n' +
    'FERRAMENTA, NA FONTE PRIMÁRIA: openai/whisper, MIT, 107.322 estrelas, modelos tiny a large mais o turbo, ' +
    'instala com pip e exige FFmpeg. Pra máquina fraca, o caminho é o ggml-org/whisper.cpp (MIT, 52.920 estrelas), ' +
    'que roda em CPU, e isso fica no presente. NÃO afirmamos requisito de GPU, consumo de RAM nem velocidade, que ' +
    'não foram medidos aqui.\n\n' +
    'O DIFERENCIAL QUE VIROU SLIDE: rodar local não é só economia, é argumento de venda. Audiência, consulta e ' +
    'reunião de sócio não podem subir pro servidor de outra empresa. É o que a concorrência barata não oferece.\n\n' +
    'A LACUNA: o comando de instalação não aparece em slide nenhum, só no presente.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): um preço concreto e a promessa de que a máquina faz de graça.\n' +
    'Regra 2 (o slide 2 confirma): o que é a ferramenta, com licença e tamanho.\n' +
    'Regra 3 (slide sozinho): quem paga, quanto paga, o argumento do sigilo, o aviso.\n' +
    'Regra 4 (salvável): a tabela de preço por minuto.\n' +
    'Regra 5 (CTA único): comenta AUDIO.\n\n' +
    'SEMANA DE CARRINHO DO DEVQUEST (17 a 21/08): o carrossel não vende curso. A matrícula aparece só no presente, ' +
    'sem o GIF do GTA 6.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: arte de capa (hoje é o gradiente de fallback) e o link de inscrição do DevQuest.',
};
