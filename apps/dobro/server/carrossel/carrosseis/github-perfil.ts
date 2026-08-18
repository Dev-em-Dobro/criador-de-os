/**
 * apps/dobro — carrossel "UPGRADE no seu perfil do GitHub com 1 prompt simples".
 *
 * ORIGEM: reels do @avi_vashishta29 (2.050 curtidas e 5.810 comentários, ou seja,
 * quase três comentários por curtida), capturado pelo Telegram. O conteúdo dele
 * é uma vitrine de 7 segundos: texto fixo na tela "Upgrade your GitHub profile by
 * using this simple prompt", ele rolando o próprio perfil, e "Comment 'upgrade'
 * to get it" no rodapé. O prompt NÃO é entregue: fica todo atrás do comentário.
 * Lido quadro a quadro em 12/08/2026, porque em reels o gancho está na tela e na
 * fala, nunca na legenda (memória gancho-do-reels-nao-e-a-legenda).
 *
 * O QUE MUDA AQUI: a gente entrega o prompt no slide salvável, e o prompt manda
 * usar só bloco que está de pé HOJE. Essa é a diferença silenciosa do post, e ela
 * é grande.
 *
 * ⚠️ ACHADO QUE MUDA A INDICAÇÃO (testado em 12/08/2026, e por isso o
 * github-readme-stats NÃO aparece em lugar nenhum deste carrossel):
 *   · `github-readme-stats.vercel.app` responde **HTTP 503 DEPLOYMENT_PAUSED**.
 *     Está fora desde 19/04/2026 (issue #4867, ABERTA, e ela mesma cita as
 *     repetidas #3851, #4737 e #4864). É o card mais copiado da internet,
 *     79.838 estrelas, e é o que quase todo tutorial brasileiro ainda manda usar.
 *   · `github-profile-trophy.vercel.app` responde **HTTP 402**.
 *   · O README do PRÓPRIO @devemdobro usa esse endpoint desde 2021 e hoje mostra
 *     dois quadrados de imagem quebrada no perfil (print conferido em 12/08).
 *   · O readme do projeto já assume: "Because the public endpoint is not
 *     reliable, we recommend self-deployment via GitHub Actions or your own
 *     hosted instance".
 * O dono decidiu em 12/08/2026 NÃO fazer disso o gancho (o post fica no prompt,
 * sem virar post de manutenção). O aviso e o caminho do GitHub Actions ficam no
 * presente, pra quem quiser o card de estatísticas mesmo assim.
 *
 * PRECISÃO (Article IV) — o que está afirmado nos slides, conferido em 12/08/2026:
 *   · README de perfil: exige repositório com nome IGUAL ao usuário, público, com
 *     README.md na raiz e com qualquer conteúdo (docs oficiais do GitHub,
 *     "managing-your-profile-readme", condições transcritas);
 *   · cada bloco do README foi chamado por HTTP antes de entrar aqui:
 *       skillicons.dev            200
 *       shields.io                200
 *       capsule-render.vercel.app 200
 *       github-readme-activity-graph.vercel.app 200
 *       streak-stats.demolab.com  200 (com Total/Current/Longest no SVG)
 *     Nenhum bloco entrou por reputação: entrou porque respondeu.
 *   · licenças: skill-icons MIT (12.916 estrelas), capsule-render MIT (1.800),
 *     github-readme-streak-stats MIT (7.079).
 *
 * SEM TRAVESSÃO em nenhum texto de conteúdo.
 */
import type { Carrossel } from '../types';

const SHOT = 'server/carrossel/assets/github-perfil';

export const githubPerfil: Carrossel = {
  slug: 'github-perfil',
  // Mesmo título do card que já estava no board (o render casa por título).
  titulo: 'UPGRADE no seu perfil do GitHub com 1 prompt simples',
  gancho: 'Upgrade no seu perfil do GitHub com 1 prompt simples.',
  dataProgramada: '2026-08-13',
  refsLinks:
    'https://www.instagram.com/reel/Dbeyc8USEQ1/ (referência: @avi_vashishta29, 5.810 comentários / 2.050 curtidas, "Comment upgrade to get it")\n' +
    'https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/managing-your-profile-readme (fonte primária das regras do README de perfil)',
  /**
   * Presente do "comenta PERFIL" (Notion, 12/08/2026): as quatro condições do
   * README de perfil, o prompt completo, o README pronto pra colar com os links
   * montados, o checklist do perfil (fixar 3, descrição, renomear pasta) e, no
   * fim, o aviso do github-readme-stats fora do ar com o caminho do GitHub
   * Actions, que é onde essa informação vive já que saiu do carrossel.
   *
   * LINK PRIVADO: trocar pelo `.notion.site` depois de Compartilhar > Publicar.
   */
  linkPresente: 'https://app.notion.com/p/3ba6dd01fb4881f48e9df63ad0139f81',
  /**
   * Capa (arte do dono, 12/08/2026): o Octocat nível 1, de túnica e espada de
   * madeira, virando nível 99 de armadura e espada lendária. É o "upgrade" do
   * título virando imagem, e não afirma nada sobre perfil nenhum.
   *
   * A arte anterior era uma JANELA do GitHub com o README montado, gerada por
   * `node server/scripts/arte-github-perfil.cjs`. Ela continua servindo de
   * alternativa e agora sai em `capa-janela.png`: o script gravava em `capa.png`
   * e, rodado de novo, apagaria a arte do dono.
   *
   * O gráfico de contribuições ficou de fora da capa de propósito: ele expõe
   * volume de commits, e num perfil de marca a linha quase reta diria o contrário
   * do que o post promete.
   */
  bgImage: `${SHOT}/capa.png`,
  slides: [
    {
      variant: 'photo',
      cover: true,
      scrim: 'bloco',
      baixo: true,
      tituloMenor: true,
      // 25.8 × 1.05 = 27,1px. Em Ubuntu Mono cada caractere ocupa ~0,485 do
      // tamanho da fonte, então cabem ~23 por linha nos 308px úteis. As três
      // linhas abaixo têm 14, 16 e 20. A 1ª versão tinha uma de 21 caracteres em
      // escala 1.2 e quebrou sozinha em quatro linhas, subindo por cima da arte.
      // 25.8 × 1.18 = 30,4px, ~20 caracteres por linha nos 308px úteis. As três
      // linhas têm 14, 16 e 20.
      tituloEscala: 1.18,
      titulo: 'UPGRADE no seu\nperfil do **GitHub**\ncom 1 prompt simples',
      // SEM subtítulo (decisão do dono, 12/08/2026). O título já entrega a
      // promessa inteira e a arte já mostra o resultado, então a linha de baixo
      // virava ruído. A que estava aqui ("é a primeira coisa que abrem quando o
      // seu nome interessa") era, ainda por cima, uma das afirmações sobre
      // recrutador que o revisor marcou como sem fonte. Com ela fora, o título
      // cresce e a capa respira.
      swipe: 'Deslize e veja ›',
    },
    {
      variant: 'dark',
      eyebrow: 'O que ele vê hoje',
      titulo: 'Seu perfil é uma\npágina **em branco**',
      corpo:
        'Recrutador e cliente abrem o seu GitHub antes de te chamar. Sem README, o que aparece é **o seu @ e uma lista de repositório sem descrição**.',
      terminal: [
        '✗ nenhuma linha dizendo o que você faz',
        '✗ repositório com nome tipo "projeto-final"',
        '✗ nenhum jeito de te achar fora dali',
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O truque que quase ninguém sabe',
      titulo: 'Um repositório com\n**o seu nome**',
      corpo:
        'Cria um repositório com o nome **igual ao seu usuário**, público, com um **README.md na raiz** e com qualquer conteúdo dentro. O GitHub mostra esse arquivo **na capa do seu perfil**.',
      // As QUATRO condições da doc oficial. A 1ª versão trazia três: faltavam
      // "na raiz" e "com qualquer conteúdo", que são justamente as que fazem a
      // pessoa tentar e falhar (README dentro de /docs, ou arquivo vazio).
      terminal: [
        '$ usuário: joaosilva',
        '$ repositório: joaosilva  (público)',
        '$ arquivo: README.md na raiz',
        '$ com qualquer conteúdo dentro',
        '✓ vira a capa do seu perfil',
      ],
    },
    {
      variant: 'dark',
      eyebrow: 'Salva esse post pra fazer depois',
      titulo: 'O **prompt**',
      denso: true,
      // Os quatro serviços vão pelo ENDEREÇO, não pelo apelido. Na 1ª versão o
      // bloco do gráfico não tinha serviço nomeado, e é justamente onde o modelo
      // sozinho escolhe o github-readme-stats, que está fora do ar (revisor,
      // 12/08/2026). "capsule-render" também virou host: sozinho, é nome de
      // repositório, e o modelo tem que adivinhar o domínio.
      terminal: [
        'Escreva o README do meu perfil do GitHub.',
        'Usuário: @SEU_USUARIO. Eu trabalho com',
        '[SUA STACK] e quero [SEU OBJETIVO].',
        'Use só estes serviços, nesta ordem:',
        'capsule-render.vercel.app, uma linha do',
        'que eu faço, skillicons.dev, github-readme-',
        'activity-graph.vercel.app e img.shields.io.',
        'Sem emoji demais e sem frase de efeito.',
        'Me devolva só o markdown.',
      ],
      corpo:
        'O que faz esse prompt funcionar é a **lista de endereços**. Sem ela, a IA escolhe sozinha o que usar.',
    },
    {
      variant: 'light',
      eyebrow: 'O que entra no README',
      titulo: 'Os **quatro blocos**',
      itens: [
        { icone: 'camera', titulo: 'capsule-render', sub: 'A faixa colorida do topo, com o seu nome' },
        { icone: 'code', titulo: 'skillicons.dev', sub: 'Os ícones da sua stack, em uma linha' },
        // Nome do PROJETO, não apelido: o README dele avisa que os endereços
        // antigos (activity-graph.herokuapp.com e o .cyclic.app) estão mortos, e
        // quem procura por "activity-graph" cai neles. E são 31 dias, não um ano:
        // o parâmetro `days` do projeto vai no máximo a 90 (revisor, 12/08/2026).
        // Sem \n: o título do item não passa pela função de realce, então a
        // quebra vira um espaço no meio do nome ("github-readme- activity-graph").
        { icone: 'layers', titulo: 'github-readme-activity-graph', sub: 'Suas contribuições dos últimos 31 dias' },
        { icone: 'globe', titulo: 'shields.io', sub: 'Os botões de LinkedIn, e-mail e portfólio' },
      ],
      corpo: 'São **imagens por link**: você cola a URL no markdown e pronto. Não instala nada.',
    },
    {
      variant: 'dark',
      eyebrow: 'Antes de sair colando',
      titulo: 'Enfeite não segura\n**ninguém**',
      corpo:
        'O README abre a porta, o que prende é o que tem atrás. **Fixa três repositórios** no perfil, escreve uma descrição em cada um e um README curto dizendo o que o projeto faz e como rodar.\n\nPerfil bonito com repositório vazio derruba mais rápido que perfil sem README.',
    },
    {
      variant: 'grafite',
      tipo: 'cta',
      fotoTopo: true,
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer o prompt e o\nREADME pronto?',
      botao: 'Comenta PERFIL 👇',
      corpo:
        'Te mando o prompt completo, o README pronto pra colar com os links já montados e o checklist do que fixar no perfil.',
      foto: 'server/carrossel/assets/founders-bg.webp',
    },
  ],
  legenda:
    'Comenta PERFIL que eu te mando o prompt e o README pronto. 🗂️\n\n' +
    'Antes de te chamar, a pessoa abre o seu GitHub. Se você nunca criou um README de perfil, o que ela vê é o seu @ ' +
    'e uma lista de repositório sem descrição.\n\n' +
    'O truque é o seguinte: um repositório com o nome IGUAL ao seu usuário, público, com um README.md na raiz e com ' +
    'qualquer conteúdo dentro. O GitHub passa a mostrar esse arquivo na capa do seu perfil. Está na documentação ' +
    'oficial e leva dois minutos.\n\n' +
    'Aí entra o prompt. Ele funciona porque entrega a lista de endereços que a IA deve usar: capa com ' +
    'capsule-render.vercel.app, uma linha do que você faz, os ícones da sua stack com skillicons.dev, o gráfico de ' +
    'contribuições com github-readme-activity-graph.vercel.app e os badges de contato com img.shields.io. Sem essa ' +
    'lista, a IA escolhe sozinha o que usar.\n\n' +
    'Todos esses blocos são imagem por link: você cola a URL no markdown, não instala nada.\n\n' +
    'E o aviso que vale mais que o post: README bonito abre a porta, mas quem segura é o que está atrás dele. Fixa ' +
    'três repositórios, escreve a descrição de cada um e um README curto dizendo o que o projeto faz e como rodar.\n\n' +
    'Comenta PERFIL aqui embaixo que eu te mando o prompt completo e o README pronto pra colar. 👇',
  hashtags:
    'github programacao carreiratech vagadev devbr portfoliodev primeiroemprego inteligenciaartificial devemdobro opensource',
  ctaFinal:
    'Comenta PERFIL que eu te mando o prompt completo, o README pronto pra colar e o checklist do que fixar no perfil.',
  briefing:
    'FÓRMULA: a referência @avi_vashishta29 tem 5.810 comentários contra 2.050 curtidas, quase três comentários por ' +
    'curtida. Ela é uma vitrine de 7 segundos com texto fixo na tela e o CTA "comment upgrade to get it": não ensina ' +
    'nada, só mostra o resultado e guarda o prompt atrás do comentário.\n\n' +
    'NOSSA DIFERENÇA: a gente entrega o prompt no slide salvável. O CTA continua valendo porque o presente traz o ' +
    'README inteiro pronto pra colar, que é o que dá trabalho montar.\n\n' +
    '⚠️ O ACHADO QUE NÃO VIROU GANCHO (decisão do dono, 12/08/2026): github-readme-stats.vercel.app, o card mais ' +
    'copiado da internet (79.838 estrelas), está com o deployment PAUSADO desde 19/04/2026, respondendo 503 ' +
    '(issue #4867, aberta). O github-profile-trophy responde 402. O README do PRÓPRIO @devemdobro usa esse endpoint ' +
    'desde 2021 e hoje mostra dois quadrados quebrados no perfil. O dono escolheu manter o post no prompt, sem virar ' +
    'post de manutenção, então o carrossel simplesmente NÃO cita esses dois serviços, e o presente explica o caso pra ' +
    'quem quiser o card de estatísticas via GitHub Actions (que é o que o próprio projeto recomenda hoje).\n' +
    'Isso é uma decisão editorial, não um esquecimento: NÃO acrescente github-readme-stats numa próxima passada sem ' +
    'testar o endpoint antes.\n\n' +
    'CADA BLOCO DO SLIDE 5 FOI CHAMADO POR HTTP antes de entrar: skillicons, shields, capsule-render, activity-graph ' +
    'e streak-stats responderam 200 em 12/08/2026. Nenhum entrou por reputação.\n\n' +
    'CAPA (trocada pelo dono em 12/08/2026): o Octocat nível 1 virando nível 99. O título do post é "UPGRADE", e a ' +
    'arte mostra o upgrade em vez de descrever, sem afirmar nada sobre perfil de ninguém. O subtítulo saiu junto: o ' +
    'título já entrega a promessa inteira, e a linha que estava lá ("é a primeira coisa que abrem quando o seu nome ' +
    'interessa") era uma das afirmações sem fonte que o revisor apontou.\n' +
    'A arte anterior (a janela do GitHub com o README montado, cards carregados das APIs na hora) vive em ' +
    'capa-janela.png e serve de alternativa.\n\n' +
    'FURA A BOLHA\n' +
    'Regra 1 (capa pro dedo): o antes e depois em forma de personagem, o Octocat nível 1 contra o nível 99.\n' +
    'Regra 2 (o slide 2 confirma): o que a pessoa vê hoje no seu perfil, item a item.\n' +
    'Regra 3 (slide sozinho): o truque do repositório, o prompt, os blocos, o aviso.\n' +
    'Regra 4 (salvável): o slide do prompt.\n' +
    'Regra 5 (CTA único): comenta PERFIL.\n\n' +
    'PRESENTE: pronto (Notion, em linkPresente). Traz o que não cabe em slide: as quatro condições do README de ' +
    'perfil, o prompt completo com os campos pra preencher, o README pronto pra colar com os links montados, o ' +
    'checklist do perfil e o aviso do github-readme-stats com o passo a passo do GitHub Actions.\n\n' +
    'PENDENTE ANTES DE PUBLICAR: a página do Notion está PRIVADA. Compartilhar > Publicar e trocar o link aqui e no ' +
    'campo do card pelo `.notion.site`.\n\n' +
    'REVISÃO DE FATO (12/08/2026, agente revisor-carrossel): os quatro serviços responderam 200 com SVG de conteúdo ' +
    'real, o limite de seis repositórios fixados confere com a doc, e nenhum dos dois serviços fora do ar aparece em ' +
    'texto publicado. Voltou com quatro bloqueantes, todos aplicados:\n' +
    '  1. o slide 5 dizia "activity-graph", apelido que leva aos endereços MORTOS do projeto (herokuapp e cyclic). ' +
    'Virou o nome real, github-readme-activity-graph.\n' +
    '  2. o mesmo slide dizia "o gráfico do que você commitou no ano". O projeto mostra os ÚLTIMOS 31 DIAS (o ' +
    'parâmetro `days` vai só até 90) e são contribuições, não commits.\n' +
    '  3. o prompt do slide 4 nomeava três serviços e deixava o do gráfico sem nome, que é exatamente onde o modelo ' +
    'escolhe sozinho o github-readme-stats (fora do ar). Agora o prompt lista os quatro ENDEREÇOS.\n' +
    '  4. o slide 3 trazia três das quatro condições oficiais do README de perfil. Faltavam "na raiz" e "com ' +
    'qualquer conteúdo", que são as duas que fazem a pessoa tentar e falhar.\n' +
    'A capa também mudou: apontava pra github.com/devemdobro, mas o perfil real tem outro README e o repositório ' +
    'fixado não tem aquela descrição. Virou um perfil genérico.\n\n' +
    'RESSALVAS REGISTRADAS (não são fato apurado, e se cobrarem nos comentários a resposta honesta é esta):\n' +
    '  · "recrutador e cliente abrem o seu GitHub antes de te chamar" (slide 2 e legenda) é leitura de mercado da ' +
    'casa, não dado de pesquisa. A versão que estava na CAPA saiu em 12/08/2026, junto com o subtítulo inteiro.\n' +
    '  · "perfil bonito com repositório vazio derruba mais rápido que perfil sem README" (slide 6) é conselho, não ' +
    'medição.\n' +
    '  · o capsule-render declara no próprio README que é serviço "best-effort" e pode ficar instável, recomendando ' +
    'fork e deploy próprio. O github-readme-activity-graph tem a mesma recomendação. Nenhum dos dois estava fora do ' +
    'ar em 12/08/2026, mas é bom saber antes de recomendar de novo daqui a alguns meses.\n' +
    '  · o shields.io não desenha mais o logo do LinkedIn: o slug saiu do simple-icons e `logo=linkedin` devolve o ' +
    'badge sem ícone (dá pra ver na própria capa, onde só o botão do LinkedIn não tem símbolo). O README do presente ' +
    'usa esse badge, então a pessoa vai receber ele sem logo.',
};
