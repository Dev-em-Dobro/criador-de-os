/**
 * apps/dobro — definição do carrossel "Como o GTA clássico sabotava quem pirateava".
 * Única fonte de verdade do conteúdo; `carrossel:render gta-antipirataria` gera a
 * arte + card. SEM travessão. Estrutura copiando a referência (JARVIS), 8 slides,
 * AIDA. História real de anti-pirataria do GTA virando aula de lógica + convite
 * pra construir o projeto do zero, ao vivo, num evento.
 *
 * Fatos conferidos (Article IV, nada inventado): Vice City (25% de chance de chuva
 * eterna por missão, cidade sem pedestres aos ~40 min, proteção em 2 camadas em que
 * a 2ª vigia se a 1ª foi removida); GTA IV ("drunk cam", a tela balança sem parar).
 * Fontes: Softonic, Sportskeeda, GamesRadar+, Steam Community.
 */
import type { Carrossel } from '../types';

export const gtaAntipirataria: Carrossel = {
  slug: 'gta-antipirataria',
  titulo: 'Como o GTA clássico sabotava quem tentava piratear',
  gancho: 'Como o GTA clássico sabotava quem tentava piratear',
  // Sem imagem de capa por ora (a arte do GTA clássico entra depois). Sem bgImage,
  // a capa fica preta e os slides escuros ficam sem a sangria de imagem no topo.
  dataProgramada: '2026-07-30T00:00:00.000Z',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Como o GTA clássico\n**sabotava** quem pirateava',
      corpo: 'Passa pro lado: tem uma aula de programação escondida nesse truque',
    },
    {
      variant: 'dark',
      topbleed: true,
      topIcon: 'skull',
      eyebrow: 'A ideia',
      titulo: 'Ele não bloqueava.\n**Sabotava por dentro**',
      corpo:
        'Quando o jogo percebia que a cópia era pirata, ele **não travava nem mostrava erro**. Em vez disso, começava a falhar de leve: coisas paravam de funcionar do nada, parecendo **bug aleatório**. O pirata culpava o PC ou o download, tentava de tudo e desistia sozinho, sem descobrir que era uma **proteção agindo**.',
    },
    {
      variant: 'purple',
      eyebrow: 'Na prática',
      titulo: 'O que o jogo fazia',
      itens: [
        { icone: 'cloudrain', titulo: 'Chuva eterna', sub: '25% de chance a cada missão no Vice City, e não parava mais' },
        { icone: 'ghost', titulo: 'Cidade fantasma', sub: 'Depois de 40 minutos, os pedestres sumiam das ruas' },
        { icone: 'camera', titulo: 'Câmera bêbada', sub: 'No GTA IV, a tela balançava sem parar até dar enjoo' },
        { icone: 'layers', titulo: 'Proteção em 2 camadas', sub: 'A segunda, escondida, vigiava se a primeira foi removida' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Por que desse jeito?',
      titulo: 'Sabotar em vez\nde **travar**',
      itens: [
        { icone: 'globe', titulo: 'Não dava pra checar online', sub: 'Naquela época não tinha internet o tempo todo, a proteção morava dentro do jogo' },
        { icone: 'eye', titulo: 'Travar entregava o segredo', sub: 'Com erro na tela, o pirata via que era proteção e ia removê-la' },
        { icone: 'ban', titulo: 'O pirata desistia sozinho', sub: 'Achando que era o PC dele, ele cansava e comprava o original' },
      ],
      corpo: 'No fim, mais psicologia do que bloqueio.',
    },
    {
      variant: 'dark',
      topbleed: true,
      topIcon: 'code',
      eyebrow: 'A real da programação',
      titulo: 'Bom dev não reclama.\n**Ele resolve**',
      corpo:
        'Em programação sempre existe um jeito criativo de chegar na solução. O bom dev não fica preso reclamando que "não dá pra fazer": ele usa **todas as ferramentas** que tem à disposição e entrega o resultado. Foi o que a Rockstar fez aqui.',
    },
    {
      variant: 'light',
      eyebrow: 'É aí que a gente entra',
      titulo: 'A gente te ensina\nessas **ferramentas**',
      itens: [
        { icone: 'map', titulo: 'Um mapa passo a passo', sub: 'O caminho pra entrar na área de tecnologia' },
        { icone: 'ai', titulo: 'As ferramentas de IA', sub: 'Pra acelerar de verdade, sem travar em nada' },
        { icone: 'code', titulo: 'Um projeto real', sub: 'Você clona o site do GTA 6 do zero' },
      ],
      corpo: 'Aprendendo fazendo, não decorando.',
    },
    {
      variant: 'photo',
      video: true,
      tipo: 'cta',
      logo: 'DEV EM DOBRO',
      titulo: 'Comenta **MANDA** e a gente\nconstrói isso ao vivo',
    },
  ],
  legenda:
    'A Rockstar não bloqueava o pirata. Ela deixava jogar e ia sabotando por dentro, disfarçado de bug.\n\n' +
    'No GTA Vice City, cada missão numa cópia pirata tinha 25% de chance de ligar uma chuva que nunca mais parava. ' +
    'Depois de 40 minutos, a cidade ficava sem pedestres. E ainda tinha uma segunda camada de proteção escondida no ' +
    'código, só pra vigiar se a primeira tinha sido removida. No GTA IV veio a lendária câmera bêbada, que balançava ' +
    'sem parar até dar enjoo.\n\n' +
    'Por trás da brincadeira tem uma aula real de lógica: detecção contínua, camadas independentes, degradar em vez de ' +
    'travar. E é isso que a gente vai construir do zero, ao vivo, num evento: você programando junto comigo.\n\n' +
    'Comenta MANDA e eu te chamo. Salva pra não esquecer e marca aquele amigo que curte games. 👇',
  hashtags:
    'programação logicadeprogramacao games gta rockstar antipirataria devemdobro projetodev aprenderprogramar desenvolvimentodesoftware',
  ctaFinal: 'Comenta MANDA e a gente constrói esse projeto do zero, ao vivo, no evento.',
  briefing:
    'Padrão JARVIS copiando a referência (8 slides, Ubuntu Mono). Fatos conferidos: Vice City (chuva 25%/missão, cidade ' +
    'fantasma aos 40 min, proteção em 2 camadas) e GTA IV (câmera bêbada). Sem inventar nome/data do evento (definir e ' +
    'encaixar depois). CAPA: sem imagem por ora (fundo preto); quando tiver a arte do GTA clássico (Vice City neon / ' +
    'GTA IV), adicionar bgImage server/carrossel/assets/gta-antipirataria-bg.jpg e rodar carrossel:render de novo. ' +
    'Último slide: placeholder do vídeo do projeto rodando (Jaque encaixa) + CTA. Arte em public/carrosseis/gta-antipirataria/.',
};
