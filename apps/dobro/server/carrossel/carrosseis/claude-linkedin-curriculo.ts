/**
 * apps/dobro — carrossel "IA que ajusta seu currículo pra cada vaga", versão que
 * SEGUE A REFERÊNCIA mandada no Telegram (05/08/2026).
 *
 * Origem: reel de @hackswithnele, https://www.instagram.com/reel/DbNHlazt6Bf/
 * ("Finding job in 2026 on easy mode"), 1.637 curtidas e 2.363 comentários, ou
 * seja 1,4 comentário por curtida: o CTA de comentário é o motor do post. O texto
 * na tela foi transcrito frame a frame do vídeo (yt-dlp + ffmpeg), não da legenda.
 *
 * ESTRUTURA COPIADA DA REFERÊNCIA: gancho na tela "how to connect claude to
 * linkedin" -> promessa (ele acha e aplica nas vagas por você, em vez de você
 * passar mais um mês procurando) -> passo a passo mostrado na tela: abre o Claude,
 * vai em Connectors, Add custom connector, cria conta grátis no composio.dev/for-you,
 * copia a URL do MCP, volta pro Claude, nomeia "Composio For You", clica Add,
 * conecta o LinkedIn -> sobe o currículo em PDF e manda o prompt -> fecha em
 * "you can even have a tailored resume for each job, automatically" + CTA de
 * comentário. Nasceu do card "IA que ajusta seu currículo pra cada vaga"; o dono
 * trocou o título e o gancho (05/08) pra "Agora o Claude se conecta com o LinkedIn
 * e busca vagas automaticamente pra você", que é a promessa da própria ref. O
 * currículo por vaga continua no carrossel, agora como consequência.
 *
 * Precisão (Article IV): tudo que está nos slides aparece no vídeo ou no site.
 * O produto é o Composio For You (composio.dev/for-you, botão "Get started for
 * free"), a URL do servidor MCP é https://connect.composio.dev/mcp e o nome dado
 * ao conector no vídeo é "Composio For You". NÃO se afirma que dá pra fazer no
 * plano gratuito do Claude: conector personalizado é beta e varia por plano, e
 * isso virou o aviso honesto do slide 7. A ref é conteúdo PATROCINADO pela
 * Composio (#composiopartner na legenda dela), o que explica a ferramenta ser o
 * centro do vídeo; aqui ela entra como meio, e o currículo por vaga é o fim.
 * Nenhum resultado dela foi copiado. SEM travessão. Capa sem arte por ora: o
 * print do site do Composio é claro demais e não sustenta a capa escura.
 */
import type { Carrossel } from '../types';

export const claudeLinkedinCurriculo: Carrossel = {
  slug: 'claude-linkedin-curriculo',
  titulo: 'Agora o Claude se conecta com o LinkedIn e busca vagas automaticamente pra você',
  gancho: 'Agora o Claude se conecta com o LinkedIn e busca vagas automaticamente pra você',
  dataProgramada: '2026-08-06T00:00:00.000Z',
  /** Arte da capa (pixel art do dono, 05/08): o LinkedIn com vagas num monitor retrô. */
  bgImage: 'server/carrossel/assets/claude-linkedin-bg.jpg',
  /**
   * Presente do "comenta VAGA": guia no Notion (workspace Dev em Dobro), criado na
   * raiz pra publicar sozinho, sem expor o resto. ESTE É O LINK PRIVADO: trocar
   * pelo `.notion.site` assim que o dono clicar em Compartilhar > Publicar.
   */
  linkPresente: 'https://app.notion.com/p/3b36dd01fb488190add8d0b69acb91fb',
  refsLinks:
    'REF SEGUIDA (Telegram, 05/08): https://www.instagram.com/reel/DbNHlazt6Bf/\n' +
    '@hackswithnele, 1.637 curtidas e 2.363 comentarios, conteudo patrocinado (#composiopartner)\n' +
    'FERRAMENTA DO PASSO A PASSO: https://composio.dev/for-you\n' +
    'URL DO CONECTOR: https://connect.composio.dev/mcp',
  slides: [
    {
      variant: 'photo',
      cover: true,
      titulo: 'Agora o Claude\nbusca **vagas**\nno seu LinkedIn',
      corpo: 'Ele se conecta e faz sozinho 👉',
    },
    {
      variant: 'light',
      eyebrow: 'O caminho',
      titulo: 'São **4 passos**,\nuns 5 minutos',
      steps: [
        { n: '01', titulo: 'Abre os conectores do Claude', sub: 'Onde ele ganha acesso a ferramentas' },
        { n: '02', titulo: 'Cria a conta no Composio', sub: 'É a ponte entre o Claude e o LinkedIn' },
        { n: '03', titulo: 'Cola o endereço no Claude', sub: 'Um nome, um campo, e pronto' },
        { n: '04', titulo: 'Sobe o seu currículo', sub: 'Ele acha as vagas e ajusta pra cada uma' },
      ],
      corpo: 'A conta do Composio é gratuita.',
    },
    {
      variant: 'dark',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo:
        'Toda semana eu mostro como usar IA e automação pra achar, disputar e ganhar vaga de tecnologia. Segue pra não perder as próximas.',
    },
    {
      variant: 'purple',
      eyebrow: 'Passo 01',
      titulo: 'O que é essa ponte',
      itens: [
        { icone: 'globe', titulo: 'Chama Composio', sub: 'Liga o Claude a mais de mil apps, LinkedIn incluso' },
        { icone: 'ai', titulo: 'O Claude passa a agir', sub: 'Ele busca vaga de verdade, não fica só conversando' },
        { icone: 'code', titulo: 'Conta gratuita', sub: 'É em composio.dev/for-you, botão Get started for free' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Salva esse slide',
      titulo: 'Como **conectar**,\nem 4 linhas',
      terminal: [
        '1. claude.ai > Conectores',
        '2. Adicionar conector personalizado',
        '3. Nome: Composio For You',
        '4. URL: connect.composio.dev/mcp',
      ],
      corpo:
        'Os conectores ficam nas configurações do Claude. Depois de adicionar, você conecta o seu LinkedIn dentro do Composio.',
    },
    {
      variant: 'dark',
      topIcon: 'ai',
      eyebrow: 'Passo 04',
      titulo: 'O prompt que faz\no **trabalho**',
      calloutLabel: 'Sobe o currículo em PDF e manda:',
      callout:
        '"Usa o Composio For You pra achar as vagas que combinam com o meu currículo e ajusta ele pra cada uma."',
      corpo:
        'Ele devolve as vagas que casam com a sua experiência e uma versão do currículo falando a língua de cada uma.',
    },
    {
      variant: 'light',
      eyebrow: 'O aviso honesto',
      titulo: 'Você revisa **antes**\nde enviar',
      itens: [
        { icone: 'ban', titulo: 'Nada de feito inventado', sub: 'Se perguntarem na entrevista, a história tem que existir' },
        { icone: 'eye', titulo: 'Confere o que autoriza', sub: 'Você dá acesso à sua conta pra uma ferramenta de fora' },
        { icone: 'ai', titulo: 'Conector ainda é beta', sub: 'Nem todo plano do Claude tem esse recurso hoje' },
      ],
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'A ferramenta acha\na vaga. Quem contrata\nolha o seu preparo.',
      botao: 'Comente VAGA 👇',
      corpo:
        'Comenta VAGA que eu te mando o guia de como fazer o Claude buscar as vagas por você. Antes de receber, você faz o cadastro gratuito na Semana do Zero ao Programador Contratado, onde a gente aprofunda essa busca.',
    },
  ],
  legenda:
    'Procurar vaga hoje é um trabalho em si: você rola o LinkedIn, abre dezenas de anúncios e no fim manda o mesmo ' +
    'currículo pra todo mundo. Dá pra virar esse jogo conectando o Claude direto no seu LinkedIn.\n\n' +
    'O caminho tem 4 passos e leva uns 5 minutos:\n\n' +
    '1. No Claude, vai nas configurações, Conectores, e escolhe Adicionar conector personalizado.\n\n' +
    '2. Em composio.dev/for-you você cria uma conta gratuita. O Composio é a ponte que liga o Claude a mais de mil ' +
    'aplicativos, o LinkedIn entre eles.\n\n' +
    '3. Copia o endereço do servidor (connect.composio.dev/mcp), volta pro Claude, dá o nome de Composio For You e ' +
    'clica em adicionar. Depois é só conectar o seu LinkedIn lá dentro.\n\n' +
    '4. Sobe o seu currículo em PDF no chat e manda: "usa o Composio For You pra achar as vagas que combinam com o ' +
    'meu currículo e ajusta ele pra cada uma".\n\n' +
    'A partir daí ele te devolve as vagas que casam com a sua experiência e uma versão do currículo falando a língua ' +
    'de cada uma, em vez de um só pra todas.\n\n' +
    'Dois avisos honestos: conector personalizado ainda é beta e nem todo plano do Claude tem, e você está dando ' +
    'acesso à sua conta pra uma ferramenta de fora, então confere o que autoriza. E revisa cada versão antes de ' +
    'enviar: se perguntarem sobre uma linha na entrevista, você precisa conseguir contar a história de verdade.\n\n' +
    'Comenta VAGA aqui embaixo que eu te mando o guia completo de como fazer o Claude buscar as vagas por você. ' +
    'Antes de receber o guia, você faz o seu cadastro gratuito na Semana do Zero ao Programador Contratado, onde a ' +
    'gente aprofunda a busca de vagas e o que fazer depois que a vaga certa aparece. 👇',
  hashtags:
    'claudeai composio mcp linkedin curriculo vagatech carreiratech inteligenciaartificial devweb devemdobro',
  ctaFinal:
    'Comenta VAGA que eu te mando o guia de como fazer o Claude buscar as vagas por você. Antes de receber o guia, você faz o cadastro gratuito na Semana do Zero ao Programador Contratado, onde a gente aprofunda a busca de vagas.',
  briefing:
    'ORIGEM: referência do Telegram (05/08/2026), reel de @hackswithnele ' +
    '(instagram.com/reel/DbNHlazt6Bf/) com 1.637 curtidas e 2.363 comentários, 1,4 comentário por curtida. ' +
    'O texto na tela foi transcrito frame a frame do vídeo, não da legenda.\n\n' +
    'ESTRUTURA COPIADA DA REFERÊNCIA\n' +
    'Gancho na tela: "how to connect claude to linkedin", com a promessa de parar de passar mais um mês procurando ' +
    'e aplicando em vaga. Depois o passo a passo mostrado na tela: abre o Claude, Connectors, Add custom connector, ' +
    'cria conta grátis em composio.dev/for-you, copia a URL do MCP, volta pro Claude, nomeia "Composio For You", ' +
    'clica Add, conecta o LinkedIn. Fecha subindo o currículo em PDF com o prompt de achar as vagas que combinam, e ' +
    'a promessa final: um currículo ajustado pra cada vaga, automaticamente. CTA: comentar uma palavra.\n\n' +
    'O QUE FOI ADAPTADO E POR QUÊ\n' +
    'O tema do card é o currículo por vaga, então o que na ref é a última frase virou o eixo aqui (capa e slide 6).\n' +
    'Foi acrescentado o slide 7, que a ref não tem: conector personalizado é beta e nem todo plano do Claude tem, e ' +
    'conectar o LinkedIn dá acesso à conta pra uma ferramenta de fora. Melhor dizer isso do que a audiência ' +
    'descobrir sozinha.\n' +
    'A ref é conteúdo PATROCINADO pela Composio (#composiopartner na legenda dela). Aqui a ferramenta entra como ' +
    'meio, não como o fim, e nenhum resultado dela foi copiado.\n' +
    'CTA com motivo antes do pedido (marketing pessoal na Semana), não só "inscrição gratuita".\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 capa: uma ideia, gancho por extenso. PENDENTE: arte de capa (o print do site do Composio é claro demais ' +
    'e não sustenta a capa escura; o ideal seria um print da tela de conectores do Claude, que exige login).\n' +
    'Regra 2: o slide 2 confirma o gancho com o índice dos 4 passos.\n' +
    'Regra 4 slide salvável: o slide 5 traz o passo a passo do conector em 4 linhas, marcado com "Salva esse slide".\n' +
    'Regra 5: CTA único, comenta VAGA.',
};
