/**
 * apps/dobro — carrossel do Whisper (transcrever áudio e vídeo de graça, rodando
 * na própria máquina).
 *
 * Encaixe no veredito: ferramenta grátis de IA, open source, que roda no SEU PC.
 * Mesma fórmula do post campeão (JARVIS).
 *
 * Precisão (Article IV, conferido em github.com/openai/whisper em 05/08/2026):
 * licença MIT, código e modelos abertos; é reconhecimento de fala de propósito
 * geral, multilíngue, com tradução de fala e identificação de idioma; roda
 * localmente; tamanhos tiny, base, small, medium, large e turbo; instala com
 * `pip install -U openai-whisper` e precisa do FFmpeg; uso: `whisper audio.mp3
 * --model turbo`. NÃO afirmamos requisito de GPU/RAM nem velocidade, que não
 * foram verificados. SEM travessão.
 */
import type { Carrossel } from '../types';

export const whisperLocal: Carrossel = {
  slug: 'whisper-local',
  titulo: 'Transcreva qualquer áudio de graça no seu PC',
  gancho: 'Você paga por transcrição e tem isso de graça rodando no seu PC. Para de gastar com o que é aberto.',
  refsLinks: 'https://github.com/openai/whisper',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Você paga por\ntranscrição e tem\nisso **de graça** no\nseu próprio PC.\nPara de gastar\ncom o que é aberto.',
      corpo: 'Passa pro lado que eu te mostro o comando 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O que é',
      titulo: 'Chama **Whisper**,\ne é código aberto',
      steps: [
        { n: '01', titulo: 'Licença MIT', sub: 'O código e os modelos são abertos, sem plano e sem limite de minuto' },
        { n: '02', titulo: 'Roda na sua máquina', sub: 'O áudio não sobe pra lugar nenhum, fica tudo no seu PC' },
        { n: '03', titulo: 'Entende vários idiomas', sub: 'Transcreve, identifica o idioma e ainda traduz a fala pro inglês' },
        { n: '04', titulo: 'Tem vários tamanhos', sub: 'De tiny a large, você escolhe entre ser rápido e ser preciso' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu mostro ferramenta de IA aberta que roda no seu PC, de graça. Segue pra não perder as próximas.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'Do zero à primeira\n**transcrição**',
      terminal: [
        '$ pip install -U openai-whisper',
        '→ instala (precisa do FFmpeg no PC)',
        '$ whisper audio.mp3 --model turbo',
        '→ transcreve e salva o texto ali do lado',
      ],
      corpo: 'São dois comandos. O modelo baixa na primeira vez e depois roda direto na sua máquina.',
    },
    {
      variant: 'purple',
      eyebrow: 'Qual modelo escolher',
      titulo: 'Rápido ou preciso,\nvocê decide',
      itens: [
        { icone: 'laptop', titulo: 'tiny e base', sub: 'Leves e rápidos, bons pra rascunho e pra máquina mais fraca' },
        { icone: 'ai', titulo: 'small e medium', sub: 'O meio termo que resolve a maioria dos casos' },
        { icone: 'eye', titulo: 'large e turbo', sub: 'Quando você precisa da transcrição mais fiel possível' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O pulo do gato',
      titulo: 'Ele também vira\n**legenda** pronta',
      corpo:
        'A saída não é só o texto corrido. Dá pra gerar arquivo de legenda pro seu vídeo, com os tempos já marcados. É o mesmo comando, mudando o formato de saída.',
    },
    {
      variant: 'dark',
      eyebrow: 'Pra que serve na prática',
      titulo: 'O que dá pra fazer\ncom isso **hoje**',
      itens: [
        { icone: 'film', titulo: 'Legenda dos seus vídeos', sub: 'Reels e aula com legenda, sem pagar ferramenta por minuto' },
        { icone: 'loop', titulo: 'Reunião virando resumo', sub: 'Transcreve a gravação e joga o texto numa IA pra resumir' },
        { icone: 'code', titulo: 'Automação no n8n', sub: 'Fluxo que recebe o áudio, transcreve e devolve o texto sozinho' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Áudio ruim continua\nsendo **áudio ruim**',
      corpo:
        'Com muito ruído de fundo, sotaque carregado ou várias pessoas falando junto, ele erra. E quanto maior o modelo, mais demorado. Testa com o menor primeiro e sobe só se precisar.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o passo a passo\ne o fluxo pronto?',
      botao: 'Comente AUDIO 👇',
      corpo: 'Comenta AUDIO que eu te mando o guia de instalação e o fluxo do n8n que transcreve sozinho.',
    },
  ],
  legenda:
    'Transcrição virou assinatura. E existe há anos uma ferramenta aberta que faz isso de graça, rodando no seu ' +
    'próprio computador: o Whisper.\n\n' +
    'Ele é open source com licença MIT, entende vários idiomas, identifica sozinho qual é o idioma do áudio e ainda ' +
    'traduz a fala pro inglês. Como roda local, o áudio não sobe pra lugar nenhum.\n\n' +
    'Como começar: instala com "pip install -U openai-whisper" (o FFmpeg precisa estar no PC) e roda ' +
    '"whisper audio.mp3 --model turbo". O modelo baixa na primeira vez e depois é só usar.\n\n' +
    'Tem vários tamanhos, de tiny a large. Os menores são rápidos e leves, os maiores são mais fiéis e mais lentos. ' +
    'Começa pelo menor e só sobe se precisar.\n\n' +
    'O que dá pra fazer com isso: legenda dos seus vídeos com os tempos já marcados, gravação de reunião virando ' +
    'resumo, e fluxo no n8n que recebe o áudio, transcreve e devolve o texto sozinho.\n\n' +
    'Um aviso honesto: áudio com muito ruído ou várias pessoas falando junto ainda gera erro.\n\n' +
    'Comenta AUDIO aqui embaixo que eu te mando o guia de instalação e o fluxo do n8n que transcreve sozinho. 👇',
  hashtags: 'whisper iagratis inteligenciaartificial transcricao n8n automacao opensource programacao devemdobro devweb',
  ctaFinal: 'Comenta AUDIO que eu te mando o guia de instalação e o fluxo do n8n que transcreve sozinho.',
  briefing:
    'FÓRMULA: ferramenta grátis de IA, open source, que roda no SEU PC, com CTA de automação (a categoria campeã).\n\n' +
    'FATOS CONFERIDOS em 05/08/2026 (github.com/openai/whisper)\n' +
    'Licença MIT, código e modelos abertos. Reconhecimento de fala de propósito geral, multilíngue, com tradução de ' +
    'fala e identificação de idioma. Roda local. Tamanhos tiny, base, small, medium, large e turbo. Instalação: ' +
    'pip install -U openai-whisper, e precisa do FFmpeg. Uso: whisper audio.mp3 --model turbo.\n' +
    'NÃO afirmamos requisito de GPU/RAM nem tempo de processamento, que não foram verificados.\n\n' +
    'PENDENTE: arte de capa. O ideal é um print do terminal transcrevendo.',
};
