/**
 * apps/dobro — carrossel "o Claude reescreve seu LinkedIn de dev de graça".
 *
 * Origem: rascunho gerado pelo pipeline em 05/08/2026 (card "Claude grátis pra
 * reescrever seu LinkedIn de dev", programado pra 08/08). Aqui ele vira arte no
 * padrão JARVIS. A PREVISÃO DA IA que veio junto do rascunho fica preservada no
 * `briefing` de propósito: `carrossel:render` recria o card do zero, e sem isso o
 * ciclo previsto x real do placar se perderia.
 *
 * Não confundir com `claude-linkedin-curriculo` (07/08), que é o Claude se
 * CONECTANDO ao LinkedIn via Composio pra buscar vaga. Aqui não tem conector nem
 * ferramenta paga: é o perfil colado no chat e reescrito.
 *
 * Precisão (Article IV): o Claude tem plano gratuito no navegador, e é só isso que
 * se afirma. Nenhum número de resultado é prometido, nenhuma funcionalidade de
 * busca do LinkedIn é inventada: o que se diz é que a busca do recrutador é por
 * palavra-chave, e que perfil sem essas palavras não aparece nela. O exemplo de
 * antes/depois do título é ilustrativo e está marcado como tal. SEM travessão.
 * Capa sem arte por ora.
 */
import type { Carrossel } from '../types';

export const claudeLinkedinPerfil: Carrossel = {
  slug: 'claude-linkedin-perfil',
  titulo: 'Claude grátis pra reescrever seu LinkedIn de dev',
  gancho: 'O Claude reescreve seu LinkedIn de dev de graça, e o recrutador para de te ignorar',
  dataProgramada: '2026-08-08',
  /** Capa (pixel art, 06/08): o polvo mexendo num perfil do LinkedIn num monitor retrô. */
  bgImage: 'server/carrossel/assets/claude-linkedin-perfil/capa.png',
  /** Presente do "comenta CLAUDE": o prompt completo + os 3 pedidos rápidos (Notion, 06/08/2026). */
  linkPresente: 'https://app.notion.com/p/3b46dd01fb4881e883eec2eb545f5c15',
  slides: [
    {
      variant: 'photo',
      cover: true,
      tituloMenor: true,
      titulo: 'O **Claude** reescreve\nseu LinkedIn de dev\nde graça, e o recrutador\npara de te ignorar',
    },
    {
      variant: 'dark',
      topIcon: 'ghost',
      eyebrow: 'Você conhece essa',
      titulo: 'Um monte de currículo,\n**nenhuma resposta**',
      corpo:
        'Você gasta horas se candidatando, uma vaga atrás da outra, e não volta nem uma mísera mensagem. Nem um não.',
      calloutLabel: 'A parte que dói:',
      callout: '"Não é que te recusaram. Na maior parte das vezes, ninguém chegou a abrir o seu perfil."',
    },
    {
      variant: 'light',
      eyebrow: 'Por que ninguém te acha',
      titulo: 'Recrutador busca por\n**palavra-chave**',
      corpo:
        '"Desenvolvedor apaixonado por tecnologia" não bate com busca nenhuma. O seu perfil existe, mas não aparece na lista de quem está contratando. E é de graça pra resolver isso: o Claude tem plano gratuito no navegador.',
    },
    {
      variant: 'purple',
      eyebrow: 'O que muda tudo',
      titulo: 'Stack no título,\nresultado no **Sobre**',
      itens: [
        { icone: 'code', titulo: 'Título com a sua stack', sub: 'React, Node, SQL: as palavras que o recrutador digita' },
        { icone: 'eye', titulo: 'Sobre com resultado', sub: 'O que você entregou, não adjetivo sobre você' },
        { icone: 'bookmark', titulo: 'Experiência com número', sub: 'Cada linha vira algo medível, mesmo em projeto pessoal' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse slide',
      titulo: 'Os 3 pedidos\npro **Claude**',
      // Cada linha precisa caber inteira no bloco (~40 caracteres): quebrada, o
      // slide salvável perde a cara de lista pronta pra copiar.
      terminal: [
        'reescreve meu titulo com a minha stack',
        'cada experiencia vira um resultado',
        'lista 10 palavras que recrutador busca',
      ],
      corpo:
        'Cola o seu perfil de hoje junto e manda os três de uma vez. Se você tem número (usuários, tempo, projetos no ar), diz junto: é o que dá peso.',
    },
    {
      variant: 'dark',
      topbleed: true,
      eyebrow: 'Antes e depois (exemplo)',
      titulo: 'O mesmo perfil,\noutra **busca**',
      itens: [
        { icone: 'ban', titulo: 'Estudante de programação', sub: 'Não aparece em busca nenhuma' },
        { icone: 'follow', titulo: 'Dev Front-end | React e TypeScript', sub: '3 projetos no ar. Essa versão aparece.' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Como fazer agora',
      titulo: 'Leva **10 minutos**',
      steps: [
        { n: '01', titulo: 'Abre o Claude', sub: 'O plano grátis dá conta' },
        { n: '02', titulo: 'Cola o seu perfil', sub: 'Título, Sobre e experiências, do jeito que estão' },
        { n: '03', titulo: 'Manda os 3 pedidos', sub: 'Os do slide que você salvou' },
        { n: '04', titulo: 'Confere linha por linha', sub: 'Só sobe o que for verdade: a entrevista cobra' },
      ],
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      // Sem título: o botão fica em cima e o texto embaixo continua a frase dele
      // ("Comente CLAUDE" + "que eu te mando..."). Decisão do dono, 06/08.
      titulo: '',
      botao: 'Comente CLAUDE 👇',
      corpo:
        'Que eu te mando o prompt pronto na DM e o passo a passo pra entrar de graça na Semana do Zero ao Programador Contratado, onde você monta o projeto que o recrutador quer ver.',
    },
  ],
  legenda:
    // AIDA + SEO: 1ª frase curta (a linha de follow come ~56 caracteres do preview)
    // e "perfil do LinkedIn" por extenso, repetido ao longo do texto.
    'Recrutador não ignora o seu perfil do LinkedIn: ele não te acha.\n\n' +
    'A busca dele é por palavra-chave, e "desenvolvedor apaixonado por tecnologia" não bate com nada. O Claude, ' +
    'no plano grátis, reescreve o seu perfil de dev com os termos que aparecem nessa busca.\n\n' +
    'Você cola o título, o Sobre e as experiências do jeito que estão hoje e pede três coisas: título com a sua ' +
    'stack, cada experiência virando resultado com número, e uma lista de 10 palavras-chave que recrutador de dev ' +
    'pesquisa.\n\n' +
    'Leva uns 10 minutos. A única regra é que cada linha do perfil novo continue verdadeira, porque quem sustenta ' +
    'isso na entrevista é você.\n\n' +
    'Comenta CLAUDE aqui embaixo que eu te mando o prompt pronto. E se você quer o projeto que faz o recrutador ' +
    'parar no seu perfil, mando junto o passo a passo pra entrar de graça na Semana do Zero ao Programador ' +
    'Contratado. 👇',
  hashtags:
    'linkedin programacao carreiratech claude inteligenciaartificial devjunior primeiroemprego vagatech curriculo devemdobro',
  ctaFinal:
    'Comenta CLAUDE que eu te mando o prompt pronto pra reescrever seu LinkedIn e o passo a passo pra se inscrever ' +
    'de graça na Semana do Zero ao Programador Contratado.',
  briefing:
    '🔮 PREVISÃO DA IA (registrada em 05/08/2026, ANTES de publicar)\n' +
    'Classe esperada: Saudável (confiança media)\n' +
    'Números previstos: salvamentos 1,8% do alcance, compartilhamentos 0,5% do alcance\n' +
    'Fura a Bolha: 22/25 (capa 4, slide 2 4, slide sozinho 4, salvável 5, CTA 5)\n' +
    'Aposta principal: Salvamentos, puxados pelo slide 5 com os 3 pedidos prontos pro Claude mais o antes/depois ' +
    'do título no slide 6\n' +
    'Riscos: O prompt fica retido na DM: quem quer o texto pronto comenta e não salva, o que pode derrubar a taxa ' +
    'de salvamento | Tema LinkedIn/carreira é mais amplo que ferramenta técnica e pode atrair alcance frio que não ' +
    'salva nem compartilha | Capa longa com duas promessas (reescreve de graça + recrutador para de te ignorar) ' +
    'pode diluir a leitura no feed\n' +
    'Veredito: Post de ferramenta concreta e grátis com prompt utilizável, tende a salvamento acima da média e ' +
    'desempenho saudável. Compartilhamento deve ficar mediano porque o benefício é pessoal e o CTA empurra pra ' +
    'comentário, não pra marcar alguém.\n' +
    '(previsão automática, modelo claude-opus-5, régua igual à do Resumo de desempenho)\n\n' +
    '⏳ INSIGHTS A VERIFICAR depois de publicar: alcance, salvamentos, compartilhamentos e comentários com CLAUDE. ' +
    'Lançar no "Resumo de desempenho" e comparar previsto x real.\n\n' +
    'DECISÕES DA ARTE (06/08/2026, ao virar carrossel JARVIS)\n' +
    'A capa mantém o gancho por extenso, com título menor pra caber: a previsão marcou o tamanho como risco, mas ' +
    'encurtar tiraria a tensão do "para de te ignorar", que é o que segura o dedo.\n' +
    'O slide 5 (salvável) virou bloco de terminal com os 3 pedidos, pra a pessoa printar e usar.\n' +
    'SLIDE 2 (decisão do dono, 06/08): abre INTENSIFICANDO A DOR (manda um monte de currículo e não volta ' +
    'nem uma mensagem), em vez de confirmar a viabilidade. Contraria a régua "não abra pelo problema", e é ' +
    'proposital: aqui o gancho JÁ é a dor ("o recrutador para de te ignorar"), então o slide 2 confirma que a ' +
    'dor é real antes de mostrar a causa. A confirmação de que é grátis foi pro slide 3 e pro passo 01.\n' +
    'O CTA continua com UM pedido (comenta CLAUDE); a Semana entra como o que ela recebe junto, não como segunda ' +
    'ação, e com o motivo dito (o projeto que o recrutador quer ver).',
};
