/**
 * apps/dobro — DOSSIÊ DO CARROSSEL: tudo o que já descobrimos sobre o que faz um
 * carrossel funcionar NESTA conta.
 *
 * POR QUE ISSO EXISTE (20/08/2026). A aba Estrategista já mostrava o ranking de
 * estruturas e os campeões, tudo derivado do banco. Mas o ranking responde só uma
 * pergunta ("que tipo de post rende mais?") e o resto do que a conta aprendeu em
 * dois meses vivia espalhado: em memória de sessão, em comentário de arquivo de
 * carrossel, na cabeça de quem estava naquele dia. O dono pediu para cadastrar
 * isso num lugar só, e este é o lugar.
 *
 * A DIFERENÇA PARA O RANKING: o ranking é recalculado a cada medição e diz O QUE
 * rende. Este dossiê é escrito à mão e diz POR QUE, e principalmente O QUE FAZER.
 * Um não substitui o outro; a tela mostra os dois lado a lado.
 *
 * A DIFERENÇA PARA O `yap-dossie`: aquele é pesquisa de fora sobre um formato que
 * ainda não publicamos. Este é quase todo número da nossa própria conta, medido
 * em post que foi ao ar. Por isso a confiança `medido` existe e é a mais comum
 * aqui.
 *
 * ⚠️ COMO MANTER. Todo número aqui tem data e origem no campo `fonte`. Quando
 * entrar safra nova de medição, os números MUDAM e este arquivo precisa mudar
 * junto, senão ele vira o que a constante `VOZ_E_VEREDITO` era antes do dossiê
 * automático: um retrato velho que ninguém percebeu que envelheceu. Os scripts
 * que levantam cada coisa estão citados na fonte de cada item.
 *
 * ⚠️ O QUE NÃO ENTRA AQUI: regra de produção da arte (tamanho de fonte, quebra de
 * título, encaixe da capa). Isso é do template e dos comentários dele. Aqui só
 * entra o que muda o RESULTADO do post.
 *
 * PARENTE PRÓXIMO: `server/carrossel/regua.ts` codifica os traços de título em
 * pontuação automática. Os pesos de lá e os números da seção "gancho" daqui são
 * a MESMA medição, e precisam ser atualizados juntos.
 */

import type { DossieSecao, Fonte } from './dossie-tipos';

export const CARROSSEL_DOSSIE: DossieSecao[] = [
  // ============================================================
  {
    id: 'estrutura',
    titulo: 'A estrutura pesa mais que a qualidade do texto',
    icone: '🏗️',
    resumo: 'Entre o melhor e o pior tipo de post há 18x de diferença. Escolher o tipo decide mais que escrever bem.',
    itens: [
      {
        titulo: 'O ranking por mediana de salvamento',
        texto:
          'Ferramenta 4,04% · listicle 3,84% · conceito 2,95% · tutorial 2,77% · contrarian 1,37% · venda 0,95% · pergunta 0,51% · storytelling 0,49% · notícia 0,23%. Ao montar cronograma, encher de ferramenta, listicle e conceito. Um texto excelente numa estrutura fraca perde para um texto médio numa estrutura forte.',
        numero: '18x do topo ao fim',
        fonte: '130 carrosséis medidos, 10/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Contrarian está sobre-representado',
        texto:
          'É o tipo mais publicado da conta e rende abaixo da mediana geral. Reduzir na programação, não eliminar: ele ainda serve quando o tema pede posição. O espaço que sobra vai para ferramenta e conceito.',
        numero: 'n=32 publicados · 1,37% de salvamento',
        fonte: 'banco, 10/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Notícia serve à atração, não ao salvamento',
        texto:
          'Salvamento pífio, mas rende mais seguidor e comentário que storytelling e pergunta. A leitura é que ela traz gente nova em vez de virar material guardado. Se for usar, marque o objetivo no card como atração e julgue por seguidor, nunca por salvamento.',
        numero: '0,23% salv · 1,4 seg/1k · 4,3 com/1k',
        fonte: 'banco, 10/08/2026',
        confianca: 'indicio',
      },
      {
        titulo: 'Conceito explica, ferramenta converte',
        texto:
          'Conceito rende 10,1 comentários por mil e ferramenta 28,2. O quadro "Ferramenta em 5 minutos" nasceu justamente para explicar sem escorregar para aula: ele traduz o jargão mas nunca deixa de prometer.',
        numero: '28,2 contra 10,1 comentários/mil',
        fonte: 'banco, 15/08/2026',
        confianca: 'medido',
      },
    ],
  },

  // ============================================================
  {
    id: 'gancho',
    titulo: 'O gancho da capa',
    icone: '🪝',
    resumo: 'Não se inventa: replica a fórmula dos campeões. Barreira cara derrubada, com a resposta rodando na máquina de quem lê.',
    itens: [
      {
        titulo: 'A fórmula que se repete nos cinco maiores',
        texto:
          '"Você não precisa ser bilionário pra ter um JARVIS no seu PC" (65,3 com/mil) · agente que responde por voz com receita e gasto de anúncio (78,8) · "Claude Code de graça, e não é pirataria" (54,4) · "faz o plano de $20 render como o de $200" (38,1) · "PewDiePie largou o ChatGPT e criou uma IA que roda 100% na sua máquina" (32,8). A forma é sempre a mesma: algo caro ou inacessível, e a resposta na máquina de quem lê. Descrição de funcionalidade não aparece em nenhum gancho de taxa alta.',
        numero: 'de 32,8 a 78,8 comentários/mil',
        fonte: 'conteudo_desempenho, 17/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Nome próprio de ferramenta é o traço mais pesado',
        texto:
          'Título com nome próprio (Claude, n8n, MCP) tem mediana de 22 seguidores por post. Com termo de categoria ("IA", "automação", "sistema"), 1. Sem âncora nenhuma, zero. Categoria não é âncora: rende quase o mesmo que não ter nada.',
        numero: '22 · 1 · 0 seguidores (mediana)',
        fonte: '150 carrosséis, 19/08/2026 (_tmp-tracos-limpo.ts)',
        confianca: 'medido',
      },
      {
        titulo: 'Os seis traços de título que a régua pontua',
        texto:
          'Nome próprio 30pt · CTA com 3+ entregas 20pt · número contável 15pt · "de graça" 15pt · comparação ou superlativo 10pt · título até 45 caracteres 10pt. Isso roda automático no fim de todo render (`conteudo:regua`), com o que falta por extenso. Não bloqueia nada: quem decide publicar card de nota baixa é o dono.',
        numero: 'forte ≥ 60 · ok ≥ 35 · abaixo disso, fraco',
        fonte: 'server/carrossel/regua.ts',
        confianca: 'medido',
      },
      {
        titulo: '"De graça" é o traço de maior lift',
        texto:
          'Aparece em 21% dos campeões e em apenas 2% do resto. Se a coisa é gratuita, isso vai na capa. É a barreira derrubada em duas palavras.',
        numero: '21% dos campeões contra 2% do resto',
        fonte: '150 carrosséis, 19/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Número no título e CTA são alavancas diferentes',
        texto:
          'Número move alcance e salvamento (66,1 salv/mil contra 43,9 sem número); o CTA move comentário. Confundir as duas leva a otimizar a métrica errada: o "12 coisas para instalar no Claude" tinha número, fez 20.511 de alcance e mesmo assim teve a pior taxa de comentário dos posts de ferramenta, porque o CTA prometia uma coisa só.',
        numero: '66,1 contra 43,9 salvamentos/mil',
        fonte: 'banco, 15 e 19/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Comparação ou superlativo, sempre que couber',
        texto:
          'Nomear o inimigo caro ("melhor que curso pago", "substitui software pago", "à frente de 99%") sobe as duas taxas ao mesmo tempo. Superlativo puro conta igual: "o agente mais hypado" faz o mesmo trabalho de colocar a coisa contra um universo.',
        numero: '58,2 salv/1k e 27,7 com/1k, contra 47,5 e 14,7',
        fonte: '150 carrosséis, 19/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'O subtítulo da capa é tensão, nunca argumento',
        texto:
          'O melhor argumento técnico do post NÃO vai na capa: vai no slide onde tem espaço para convencer. Título carrega o número ou a promessa; subtítulo carrega o conflito (quem se incomoda, o que parece proibido, o que está prestes a mudar). Argumento pede leitura e avaliação, e quem rola o feed não faz nenhuma das duas.',
        fonte: 'corte do dono no carrossel do Graphify, 12/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Gancho de fora não salva formato errado',
        texto:
          'O gancho do Graphify ("faz o plano de $20 render como o de $200") fez 10.659 comentários na conta gringa que o originou. Aqui, no formato de ferramenta única, deu 1 seguidor. Antes de repetir um gancho que bombou fora, veja se ele já foi testado aqui.',
        numero: '1 seguidor',
        fonte: 'posts de 07 a 18/08/2026 (_tmp-desempenho-titulo.ts)',
        confianca: 'medido',
      },
    ],
  },

  // ============================================================
  {
    id: 'capa',
    titulo: 'A arte da capa',
    icone: '🖼️',
    resumo: 'Três famílias funcionam. Foto de ambiente não é uma delas.',
    itens: [
      {
        titulo: 'Família 1: personagem que ENCARNA o conceito',
        texto:
          'Gambá ladrão de óculos escuros e camiseta roxa do GitHub num beco molhado, para "7 repositórios que parecem ilegais" (282 seguidores, 84,7 salv/1k). Macaco de terno e corrente de ouro em poltrona barroca, para "5 sites que deixam seu site com cara de caro" (70,1 salv/1k). Fotorrealista, fundo escuro, bicho ocupando os dois terços de cima.',
        numero: '84,7 e 70,1 salvamentos/1k',
        fonte: 'capas lidas uma a uma, 19/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Família 2: objeto icônico gigante em cena dramática',
        texto:
          'O padrão do maior post da concorrência (@guilhermemorais.ia, 35.659 curtidas): logo do GitHub em 3D, gigante, iluminado por dentro, fogo e papéis voando num corredor escuro. Texto branco condensado ocupando o terço inferior inteiro.',
        fonte: 'referências capturadas do Instagram',
        confianca: 'indicio',
      },
      {
        titulo: 'Família 3: tipografia pura, zero imagem',
        texto:
          'É legítima e barata, e o nosso maior post do mês usou ela: o elevator-saga (382 seguidores, 58 mil de alcance) saiu SEM arte nenhuma, só o gradiente roxo de fallback. Quando não houver arte pronta, isto é uma saída, não um problema.',
        numero: '382 seguidores sem arte',
        fonte: 'banco + capas, 19/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'O anti-padrão: fotografia realista de ambiente',
        texto:
          '"Cadeira odontológica vazia num consultório, luz suave de janela" é bonita e morta. Não tem personagem, não tem drama, não tem objeto icônico, e some no scroll. Foto de banco de imagem cai no mesmo buraco. A pergunta não é "que imagem ilustra o tema?", é "o que faz o dedo parar?".',
        fonte: 'corte do dono, 19/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'O denominador comum das três',
        texto:
          'UMA coisa domina o quadro, e o texto é grande o bastante para ler no feed a 10% de zoom. O terço inferior fica sempre reservado para o texto, o que também define como pedir a arte: com o rodapé vazio.',
        confianca: 'consenso',
      },
    ],
  },

  // ============================================================
  {
    id: 'espinha',
    titulo: 'A espinha do post',
    icone: '🦴',
    resumo: 'A sequência do maior post da conta, slide a slide, e a lacuna que faz a pessoa comentar.',
    itens: [
      {
        titulo: 'A lacuna do endereço: a alavanca mais forte que temos',
        texto:
          'O maior post da conta ensina o caminho inteiro e NUNCA diz o endereço: o slide de instalação diz "baixa o projeto no GitHub" e não diz qual. O contra-exemplo está no mesmo banco: "12 coisas para instalar no Claude" pôs os comandos prontos num slide, teve o segundo maior alcance da semana e a pior taxa de comentário entre os posts de ferramenta. Quem já resolveu o problema no slide não tem motivo para comentar.',
        numero: '65,3 contra 7,3 comentários/mil',
        fonte: 'JARVIS 04/07 × 12-coisas 09/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'O que pode e o que não pode ficar no slide',
        texto:
          'Endereço, comando de instalação e link vão para o presente, nunca para o slide. No slide ficam o nome da ferramenta, o que ela faz, os pré-requisitos, os passos sem o comando e o resultado esperado. Exceção consciente: post que é COLA (os 7 comandos de Git) vive de mostrar o conteúdo, e aí o presente precisa entregar outra coisa.',
        fonte: 'memória carrossel-lacuna-do-endereco',
        confianca: 'decisao',
      },
      {
        titulo: 'Os 8 slides do JARVIS',
        texto:
          '1 capa cinematográfica · 2 contexto e a virada · 3 um slide inteiro só pedindo para salvar · 4 na prática, com um item sensorial (ativa com 2 palmas) · 5 pré-requisitos e "só isso, tudo de graça" · 6 instalação em passos numerados · 7 o teste que prova que está vivo · 8 CTA com palavra-gatilho. O pedido de salvar vem CEDO, no slide 3, não no fim.',
        fonte: 'decupagem do post de 04/07/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Todo post de ferramenta precisa das "2 palmas"',
        texto:
          'Um truque físico e sensorial que dá vontade de testar hoje. No JARVIS são as duas palmas que disparam o Spotify; no Hermes, a mensagem que chega sozinha no Telegram de manhã. Sem esse momento, o post explica mas não provoca.',
        confianca: 'decisao',
      },
      {
        titulo: 'O slide 2 é o divisor de águas',
        texto:
          'Comparando duas versões do mesmo carrossel, a que CONFIRMA o gancho no slide 2 e move o problema para o slide 3 vence com folga a que abre pelo problema. É o ponto de maior evasão do post. Segundo maior ganho: nomear o slide salvável ("SALVA ESSE SLIDE" no eyebrow) em vez de só ter um slide salvável mudo.',
        fonte: 'comparação elevator-saga, 01/08/2026',
        confianca: 'indicio',
      },
      {
        titulo: 'As 5 regras do Fura a Bolha, a régua de qualidade da casa',
        texto:
          '1. Capa = parar o dedo, função única. 2. Slide 2 confirma o gancho e dá motivo para ficar. 3. Cada slide funciona sozinho (se printar solto, faz sentido). 4. Um slide que vale salvar. 5. Legenda continua o post e o CTA é UM pedido só. Tensão conhecida: a regra 2 briga com o AIDA clássico de abrir pelo problema; harmoniza reordenando os slides 2 e 3.',
        fonte: 'sistema do Rafael Araújo (@rafaelaraujocn), usado pelo dono',
        confianca: 'decisao',
      },
    ],
  },

  // ============================================================
  {
    id: 'cta',
    titulo: 'O CTA e o comentário',
    icone: '💬',
    resumo: 'O molde é fixo. O que muda o resultado é quantas entregas concretas ele promete.',
    itens: [
      {
        titulo: 'Três entregas rendem o dobro de duas',
        texto:
          'CTA com três entregas distintas fica entre 22,4 e 27,0 comentários por mil; com duas, 12,9; com uma, 7,3. A receita: o material + o que fazer quando dá errado + o próximo passo. Todos seguem o mesmo molde "Comenta PALAVRA que eu te mando X", então o que separa um do outro é só a promessa.',
        numero: '22,4 a 27,0 contra 12,9 contra 7,3',
        fonte: 'carrosséis de 07 a 14/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'A palavra do CTA precisa ser pronunciável',
        texto:
          'Palavra que mistura letra e número quebra a automação: "n8n" vira n8m, nan, N8 na hora de digitar, e cada erro é um comentário que o robô não responde. No carrossel do n8n a palavra virou FLUXO por causa disso.',
        fonte: 'decisão do dono, 19/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Pedágio no CTA custa comentário',
        texto:
          'O único post da semana que exigia cadastro antes de entregar ficou em 16,9 por mil, abaixo dos cinco primeiros, todos sem pedágio. Se a promessa exige um passo a mais antes da entrega, ela rende menos.',
        numero: '16,9 com/mil, abaixo do top 5',
        fonte: 'semana de 07 a 14/08/2026',
        confianca: 'indicio',
      },
      {
        titulo: 'O CTA entrega só o que é do próprio post',
        texto:
          'Desde 12/08/2026 o "comenta PALAVRA" não inclui mais captação para evento. Prometa artefatos do post: o modelo pronto, o passo a passo, a lista, o link da ferramenta. Isso encerrou na prática a hipótese em que a Semana era a terceira entrega.',
        fonte: 'decisão do dono, 12/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'O CTA colhe, não planta',
        texto:
          'O "comenta X" é necessário para a automação de DM, mas não faz o comentário explodir sozinho: tirando o JARVIS, posts com CTA ficam perto do baseline. O gatilho colhe o que o tema plantou. Não espere que um CTA bom salve um tema fraco.',
        fonte: 'análise de 113 carrosséis, 03/08/2026',
        confianca: 'medido',
      },
    ],
  },

  // ============================================================
  {
    id: 'publico',
    titulo: 'Com quem a conta fala',
    icone: '🎯',
    resumo: 'Quem quer construir com IA e ganhar dinheiro com isso. Não é o dev, e não é hobby.',
    itens: [
      {
        titulo: 'Vibe code segue; dev salva e vai embora',
        texto:
          'Posts de vibe code (Claude, agente, automação, skill, sem código) rendem 0,91 seguidor por mil contra 0,45 dos posts de dev (Git, CSS, HTML, sintaxe, array). O dev SALVA mais (31,1 contra 25,3 por mil) e SEGUE metade: ele guarda a cola e vai embora. Com a meta em crescimento de base, salvamento sem follow é trabalho perdido.',
        numero: '0,91 contra 0,45 seguidores/1k',
        fonte: '150 carrosséis por tema, 19/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'A exceção que confirma',
        texto:
          'O maior post do balde "dev" é o Elevator Saga (382 seguidores), que é dev por tema mas tem embalagem de descoberta, não de aula. Jogo viaja; lista de comando não. O teste ao escolher pauta: "isso ensina a MONTAR algo com IA ou ensina a sintaxe?".',
        numero: '382 seguidores',
        fonte: 'banco, 19/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Lista traz seguidor; ferramenta única não',
        texto:
          '7 repos open source → 282 seguidores · 12 coisas no Claude → 100 · 5 pastas → 50 · Seu Claude mais forte → 30 · Design nível Apple → 22. Contra isso: Graphify → 1 e Upgrade no perfil do GitHub → 1. Os quatro primeiros são LISTA numerada; os dois últimos são UMA ferramenta só, e os dois foram ao ar com gancho forte. A lista promete um mapa e dá motivo de salvar.',
        numero: '282 contra 1',
        fonte: 'posts de 07 a 18/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Jargão não afasta; definição sem fantasia afasta',
        texto:
          'Os números desmentem a intuição: título com jargão rende 18,4 comentários por mil contra 3,1 dos sem jargão. O post do CEO da Microsoft alcançou 126.383 pessoas em linguagem simples e juntou 2,0 comentários por mil. O que mata não é a palavra difícil, é abrir com uma definição em vez de uma fantasia que a pessoa já tem na cabeça.',
        numero: '18,4 contra 3,1 comentários/mil',
        fonte: 'banco, 15/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'O eixo virou comercial',
        texto:
          'Desde 20/08/2026 a conta fala bem mais de ferramenta de vibe coding do que de programação, e de construir site, agente e sistema para quem quer FATURAR com isso. A pergunta que fecha a peça deixou de ser "entendeu?" e passou a ser "dá para cobrar por isso, e quanto?".',
        fonte: 'definição do dono, 20/08/2026',
        confianca: 'decisao',
      },
    ],
  },

  // ============================================================
  {
    id: 'texto',
    titulo: 'O texto dos slides',
    icone: '✍️',
    resumo: 'Encurtar ornamento, nunca explicação. E nada de bloco de texto corrido.',
    itens: [
      {
        titulo: 'Corpo de slide nunca é bloco corrido',
        texto:
          'Encurte e marque com negrito as partes que a pessoa precisa levar. Mire em três ou quatro linhas renderizadas; se passar, corte em vez de reescrever menor. Parágrafo de cinco linhas em fonte monoespaçada vira parede, e quem rola o feed desliza embora antes de achar a informação boa.',
        fonte: 'correção do dono, 12/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Mas resumir demais não é clareza',
        texto:
          'A regra que concilia as duas: encurta o que é ORNAMENTO, nunca o que é EXPLICAÇÃO. Rótulo de duas palavras só funciona para quem já sabe o que ele significa, e o público é justamente quem não sabe. Ao escrever um item, leia só o sub e pergunte "quem nunca viu isso entende?".',
        fonte: 'correção do dono no slide de preço do n8n, 19/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Número que importa vira título de item, não linha de terminal',
        texto:
          'Bloco de terminal é para comando e tabela alinhada. Quando o número é o que interessa no slide, ele precisa ser o título grande do item, com uma frase inteira e exemplo concreto embaixo.',
        fonte: 'mesma correção, 19/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Exemplo precisa ser apresentado antes de virar "a"',
        texto:
          'O leitor entra em qualquer slide sem contexto. Artigo definido é uma promessa de que aquilo já foi dito: "a clínica" antes de existir uma clínica soa como continuação de uma conversa que ele não teve. O primeiro slide que cita um exemplo usa artigo indefinido; só do próximo em diante pode usar "a" e "ela". Vale para ferramenta, número e personagem.',
        fonte: 'correção do dono no n8n, 19/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Nunca travessão, nunca nome inventado',
        texto:
          'Travessão não entra em nenhum texto de conteúdo: troque por ponto, vírgula ou dois-pontos. E nome de método ou produto tem que ser real. O último slide é sempre o CTA, no formato "Comenta XXX que eu te mando YYY na DM".',
        fonte: 'voz de marca, pedido repetido do dono',
        confianca: 'decisao',
      },
    ],
  },

  // ============================================================
  {
    id: 'legenda',
    titulo: 'Legenda, hashtags e presente',
    icone: '📝',
    resumo: 'Metade do tamanho que já foi, cinco hashtags com funções diferentes, e o detalhe morando no presente.',
    itens: [
      {
        titulo: 'De 700 a 900 caracteres, não 1.800',
        texto:
          'Cinco blocos: o CTA na primeira linha, o problema, a virada, o número que prova, e o CTA de novo no fim. A legenda longa repetia o que os slides já diziam e ainda contava o presente inteiro, o que tira o motivo de comentar. O que sai ao encurtar é a explicação de apoio, não o número que sustenta o post.',
        numero: 'alvo de 700 a 900 caracteres',
        fonte: 'determinação do dono, 17/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Cinco hashtags, uma de cada função',
        texto:
          'Nicho exato (n8n, vagadev) · categoria (automacao, programacao) · alcance (inteligenciaartificial, carreiratech) · intenção de quem lê (freelancer, primeiroemprego) · marca (devemdobro, que nunca sai).',
        numero: '5 tags',
        fonte: 'determinação do dono, 17/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'A linha de follow é montada na hora',
        texto:
          '"Segue @devemdobro pra aprender a usar IA do jeito certo." abre toda descrição, mas NÃO é gravada na legenda de cada post: ela é aplicada na montagem. Assim vale para os posts antigos e futuros, e muda num lugar só.',
        fonte: 'decisão do dono, 05/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Legenda que nasce de referência copia a ESTRUTURA dela',
        texto:
          'Quando o post vem de uma referência, a legenda segue os blocos da legenda DELA (CTA → confissão → o que surpreendeu → para quem serve), nunca um resumo dos slides.',
        confianca: 'decisao',
      },
    ],
  },

  // ============================================================
  {
    id: 'dinheiro',
    titulo: 'O carrossel que diz quanto cobrar',
    icone: '💰',
    resumo: 'A ferramenta sozinha é curiosidade. Com preço, vira oportunidade, e muda quem salva o post.',
    itens: [
      {
        titulo: 'Preço muda o gancho e muda quem salva',
        texto:
          'Sai de "é de graça e roda na sua máquina" para "você monta de graça e vende por R$ X". O slide da tabela de preço vira o slide salvável do post. Use o PISO da faixa no título, não o teto: melhor a pessoa cobrar 800 e conseguir do que 2.500 e travar.',
        fonte: 'pedido do dono, 15/08/2026',
        confianca: 'decisao',
      },
      {
        titulo: 'Preço é afirmação verificável, sempre em duas fontes',
        texto:
          'Nunca sai da cabeça de ninguém. Faixas já levantadas e reaproveitáveis: automação n8n de R$ 400 a 900 (simples), 900 a 2.500 (com decisão no meio) e 2.500 a 10.000+ (com agente de IA); transcrição de R$ 3 a 12 por minuto conforme o tipo, com a hora transcrita em R$ 225. Preço errado é o erro mais caro que a conta pode cometer.',
        fonte: 'horadecodar + automacaohoje; vozparatexto + auditorioibirapuera',
        confianca: 'consenso',
      },
      {
        titulo: 'Sempre um slide de aviso honesto',
        texto:
          'O custo da operação (servidor, API, revisão, suporte) precisa aparecer, para o post não virar promessa de dinheiro fácil. E o argumento que fecha venda de ferramenta local é sempre o mesmo: o arquivo do cliente não sai da máquina dele.',
        confianca: 'decisao',
      },
    ],
  },

  // ============================================================
  {
    id: 'ler-numeros',
    titulo: 'Como ler estes números sem se enganar',
    icone: '⚖️',
    resumo: 'As ressalvas que impedem conclusão errada. Ler antes de usar qualquer coisa acima.',
    itens: [
      {
        titulo: 'Quase metade do alcance da conta é pago',
        texto:
          'Na semana de 10 a 16/08, o impulsionamento respondeu por 374.762 das 761.032 visualizações e por 105.088 do alcance de 180.891. As interações, ao contrário, são quase todas orgânicas: o anúncio traz olho, não engajamento. Antes de dizer que uma semana foi boa ou que um formato "cresceu", separe pago de orgânico. Queda de alcance pode ser só verba parando.',
        numero: '49% das views · 58% do alcance',
        fonte: 'account insights, semana de 10 a 16/08/2026',
        confianca: 'medido',
      },
      {
        titulo: 'Metade dos posts tem seguidores = 0',
        texto:
          'A atribuição de seguidor é esparsa: 51% dos posts medidos vêm com zero. Confie na DIREÇÃO e nas taxas por mil, nunca nos números absolutos soltos.',
        numero: '51% com atribuição zerada',
        fonte: 'conteudo_desempenho',
        confianca: 'medido',
      },
      {
        titulo: 'Amostras por estrutura ainda são pequenas',
        texto:
          'Ferramenta, que lidera as duas metas, tem n=8 e alta variância (o JARVIS é um outlier de 767 seguidores e 3.905 comentários que puxa a média sozinho). Estrutura com menos de 5 posts entra no ranking marcada como amostra fraca, e é para ser lida como pista.',
        confianca: 'indicio',
      },
      {
        titulo: 'Poucos posts têm card vinculado',
        texto:
          'Gancho e CTA reais só existem para os posts que nasceram no board. Isso limita tudo o que se pode afirmar sobre texto de capa: o resto do histórico é medição sem o texto que a produziu. Quanto mais post nascer do board, mais forte fica esta base.',
        confianca: 'medido',
      },
      {
        titulo: 'A ressalva do nome próprio',
        texto:
          'Os posts com nome próprio se concentram em agosto, a melhor fase da conta, então parte do ganho é fase e não causa. O gap de 22 contra 0 seguidores é grande demais para ser só isso, mas a régua é uma bússola, não um oráculo.',
        confianca: 'indicio',
      },
      {
        titulo: 'A régua de classificação está frouxa',
        texto:
          '42% dos carrosséis batem "Forte" em salvamento com o limiar de 2%, quando o p85 real é 4,19%. "Forte" deveria ser exceção. `conteudo:calibrar-regua` mostra os percentis e sugere faixas novas, mas mudar reclassifica o histórico inteiro, então é decisão do dono.',
        numero: '42% "Forte" · p85 real de 4,19%',
        fonte: 'calibrar-regua, 10/08/2026',
        confianca: 'medido',
      },
    ],
  },
];

/** De onde saíram os números: os scripts e as telas que os levantam. */
export const CARROSSEL_FONTES: Fonte[] = [
  { label: 'Aba Desempenho — as medições que sustentam tudo isto', url: '/conteudo/desempenho' },
  { label: 'Placar da IA — previsão contra resultado real', url: '/conteudo/placar' },
  {
    label: 'A régua do gancho, em código (server/carrossel/regua.ts)',
    url: 'https://github.com/Dev-em-Dobro/criador-de-os/blob/main/apps/dobro/server/carrossel/regua.ts',
  },
  {
    label: 'O dossiê automático que vai no prompt (server/conteudo-dossie.ts)',
    url: 'https://github.com/Dev-em-Dobro/criador-de-os/blob/main/apps/dobro/server/conteudo-dossie.ts',
  },
  { label: 'Fura a Bolha — o sistema de carrossel usado como régua', url: 'https://furaabolha.com.br/sistema' },
];

/** Data da última revisão destes achados, mostrada no rodapé. */
export const CARROSSEL_DOSSIE_EM = '20/08/2026';

/** Quantos achados o dossiê carrega hoje (mostrado no selo do topo). */
export const CARROSSEL_DOSSIE_TOTAL = CARROSSEL_DOSSIE.reduce((s, sec) => s + sec.itens.length, 0);
