/**
 * apps/dobro — cria no board as 20 peças do PILOTO DE YAP (reels falando pra
 * câmera), distribuídas em 7 dias, 3 por dia.
 *
 * POR QUE ELE EXISTE (20/08/2026): o piloto testa se o yap entrega o que o
 * carrossel não entrega — pôr a nossa cara no conteúdo. Criar 20 cards na mão
 * pelo board é trabalho de digitação, e o que importa é o conteúdo de cada um.
 *
 * As pautas saíram da busca do Instagram nos termos do eixo novo (vibe coding,
 * criar site com IA, agente de IA, ganhar dinheiro com IA), pelo método de pauta
 * validada. O plano completo vive em `docs/piloto-yap-20-reels.md`.
 *
 * Regras aplicadas em todas: um ponto por vídeo, gancho de 10 a 18 palavras dito
 * E escrito na tela, e pedido só em 4 das 20 (sempre no meio do vídeo). Os
 * territórios são intercalados pra não repetir assunto no mesmo dia, que é o que
 * o Instagram lê como comportamento repetitivo.
 *
 * É IDEMPOTENTE: pula qualquer peça cujo título já exista no board.
 *
 * Uso:
 *   pnpm --filter @app/dobro conteudo:seed-piloto-yap [YYYY-MM-DD-do-primeiro-dia]
 *   (sem data, começa na próxima segunda-feira)
 */
import { eq } from 'drizzle-orm';
import { db } from '../../db/client';
import { conteudoPosts } from '../../db/schema';

/** Horários dos 3 posts do dia. Espalhados pra não parecer publicação em rajada. */
const HORAS = ['09:00', '13:00', '19:00'];

interface Peca {
  /** Território da pauta, usado pra intercalar e pra ler o board depois. */
  territorio: string;
  titulo: string;
  gancho: string;
  ponto: string;
  /** 'resolve' entrega algo; 'historia' e 'opiniao' põem a cara. */
  tipo: 'resolve' | 'historia' | 'opiniao';
  duracao: '21-34s' | '35-45s';
  /** Pedido de verdade, no MEIO do vídeo. Sem isso a peça fecha no ponto. */
  cta?: string;
  /** O que só o dono sabe e precisa preencher antes de gravar. */
  falta?: string;
}

/** Na ordem de publicação: territórios intercalados, 3 por dia. */
const PECAS: Peca[] = [
  // ── dia 1
  {
    territorio: 'Cara de IA',
    titulo: 'Os sinais que denunciam um site feito com IA',
    gancho: 'Seu site tem cara de IA e o cliente percebe antes de ler qualquer coisa',
    ponto: 'Listar os sinais que entregam um site vibecoded e o que trocar em cada um.',
    tipo: 'resolve',
    duracao: '35-45s',
  },
  {
    territorio: 'Preço',
    titulo: 'Quanto cobrar por um site feito com IA',
    gancho: 'Quanto cobrar por um site feito com IA. Vou te dar a faixa',
    ponto: 'Faixa de preço por tipo de entrega e o que faz o preço subir ou descer.',
    tipo: 'resolve',
    duracao: '35-45s',
    cta: 'Comenta a palavra e eu mando a tabela de faixas por tipo de entrega.',
    falta: 'As faixas reais que você pratica ou conferiu. Sem número real, a peça não sai.',
  },
  {
    territorio: 'Opinião',
    titulo: 'Todo mundo usa IA, a diferença é quem admite',
    gancho: 'Todo mundo usa IA. A diferença é quem tem coragem de admitir',
    ponto: 'O preconceito com quem se assume vibecoder e por que ele não para de pé.',
    tipo: 'opiniao',
    duracao: '21-34s',
  },

  // ── dia 2
  {
    territorio: '1 prompt',
    titulo: 'O site inteiro que saiu de um prompt só',
    gancho: 'Fiz um site inteiro com um prompt só e vou te mostrar ele agora',
    ponto: 'Mostrar o prompt na tela e dizer o que ainda precisou de ajuste na mão.',
    tipo: 'resolve',
    duracao: '35-45s',
    falta: 'Qual site foi e qual foi o prompt exato. Precisa aparecer na tela.',
  },
  {
    territorio: 'Repos',
    titulo: 'Repositórios que substituem ferramenta paga',
    gancho: 'Esses repositórios fazem o que você paga caro pra fazer, e são de graça',
    ponto: 'A lista, dizendo o que cada um substitui e quanto custa a alternativa paga.',
    tipo: 'resolve',
    duracao: '35-45s',
    cta: 'Comenta a palavra e eu mando a lista com os links.',
    falta: 'Quais repos entram. Lista é o formato que mais trouxe seguidor pra conta.',
  },
  {
    territorio: 'Stack',
    titulo: 'Troquei de stack três vezes antes de parar nessa',
    gancho: 'Troquei de stack três vezes antes de parar nessa e perdi meses no caminho',
    ponto: 'O que cada troca custou e o que ela ensinou.',
    tipo: 'historia',
    duracao: '21-34s',
    falta: 'Quais foram as três stacks e o que quebrou em cada uma.',
  },

  // ── dia 3
  {
    territorio: 'Site de nicho',
    titulo: 'Site de imobiliária é o mais fácil de vender',
    gancho: 'Site de imobiliária é o mais fácil de vender e quase ninguém faz',
    ponto: 'Por que esse nicho e o que o cliente realmente pede numa primeira conversa.',
    tipo: 'resolve',
    duracao: '35-45s',
  },
  {
    territorio: 'Grátis vs pago',
    titulo: 'Onde acaba o gratuito e começa o que vale pagar',
    gancho: 'Dá pra fazer tudo isso sem gastar um real. Aqui é onde vale pagar',
    ponto: 'A linha exata entre o que o plano gratuito resolve e o que só a assinatura resolve.',
    tipo: 'resolve',
    duracao: '21-34s',
  },
  {
    territorio: 'Agente',
    titulo: 'O primeiro agente que entreguei quebrou no segundo dia',
    gancho: 'O primeiro agente que eu entreguei quebrou no segundo dia de uso',
    ponto: 'O que faltou nele e a verificação que eu passei a fazer por causa disso.',
    tipo: 'historia',
    duracao: '21-34s',
    falta: 'Qual agente era, o que ele fazia e como exatamente ele quebrou.',
  },

  // ── dia 4
  {
    territorio: 'Stack',
    titulo: 'A stack inteira pra tirar um site do zero ao ar',
    gancho: 'Essa é a stack inteira que eu uso pra tirar um site do zero ao ar',
    ponto: 'A lista com o motivo de cada escolha, não só os nomes.',
    tipo: 'resolve',
    duracao: '35-45s',
  },
  {
    territorio: 'Preço',
    titulo: 'Você cobra pelo tempo, o cliente paga pelo problema',
    gancho: 'Você está cobrando pelo seu tempo. O cliente paga pelo problema resolvido',
    ponto: 'Por que preço por hora trava quem entrega rápido com IA.',
    tipo: 'resolve',
    duracao: '21-34s',
  },
  {
    territorio: 'Cara de IA',
    titulo: 'O cliente me disse na cara que o site parecia IA',
    gancho: 'Já entreguei site com cara de IA e o cliente me disse isso na cara',
    ponto: 'O que ele apontou e o que eu mudei no meu processo depois disso.',
    tipo: 'historia',
    duracao: '21-34s',
    falta: 'O caso real: que cliente, o que ele falou e o que você mudou.',
  },

  // ── dia 5
  {
    territorio: 'Agente',
    titulo: 'Um agente que faz o trabalho de uma pessoa',
    gancho: 'Montei um agente que faz o trabalho de uma pessoa dentro da empresa',
    ponto: 'O que ele faz de ponta a ponta, com a tarefa concreta que ele resolve.',
    tipo: 'resolve',
    duracao: '35-45s',
    falta: 'Qual empresa e qual tarefa. Exemplo precisa ser apresentado antes de ser usado.',
  },
  {
    territorio: 'Grátis vs pago',
    titulo: 'O kit gratuito pra primeira entrega',
    gancho: 'Você não precisa assinar nada pra começar. Precisa disso aqui',
    ponto: 'O kit gratuito completo que dá pra usar na primeira entrega paga.',
    tipo: 'resolve',
    duracao: '35-45s',
    cta: 'Comenta a palavra e eu mando o kit completo.',
  },
  {
    territorio: 'Site de nicho',
    titulo: 'Faz o mesmo site dez vezes',
    gancho: 'Escolhe um nicho e entrega o mesmo site dez vezes em vez de dez projetos',
    ponto: 'A lógica do modelo repetido, que é o que transforma entrega em negócio.',
    tipo: 'resolve',
    duracao: '21-34s',
  },

  // ── dia 6
  {
    territorio: '1 prompt',
    titulo: 'O que falta no seu prompt de site',
    gancho: 'O prompt não é o problema. É o que você esquece de dizer dentro dele',
    ponto: 'As três coisas que faltam em quase todo prompt de site.',
    tipo: 'resolve',
    duracao: '21-34s',
  },
  {
    territorio: 'Repos',
    titulo: 'Um repositório cancelou uma assinatura minha',
    gancho: 'Um repositório do GitHub cancelou uma assinatura que eu pagava todo mês',
    ponto: 'Qual repo, o que ele substituiu e quanto deixou de sair por mês.',
    tipo: 'resolve',
    duracao: '21-34s',
    falta: 'Qual assinatura era e o valor real que você deixou de pagar.',
  },
  {
    territorio: 'Primeiro dinheiro',
    titulo: 'Cobrei barato demais no primeiro trabalho com IA',
    gancho: 'O primeiro trabalho que eu cobrei usando IA foi barato demais',
    ponto: 'Quanto foi, o que eu entreguei e o que eu cobraria pela mesma coisa hoje.',
    tipo: 'historia',
    duracao: '35-45s',
    falta: 'O valor real do primeiro trabalho e o que era a entrega.',
  },

  // ── dia 7
  {
    territorio: 'Serviço vendável',
    titulo: 'O serviço que dá pra vender essa semana',
    gancho: 'Esse serviço você consegue vender essa semana, mesmo começando hoje',
    ponto: 'Qual é o serviço, o que precisa saber pra entregar e onde achar o primeiro cliente.',
    tipo: 'resolve',
    duracao: '21-34s',
    cta: 'Comenta a palavra e eu mando o passo a passo da primeira venda.',
  },
  {
    territorio: 'Opinião',
    titulo: 'Não precisa aprender a programar pra entrar em tecnologia',
    gancho: 'Você não precisa aprender a programar pra entrar em tecnologia hoje',
    ponto: 'A tese: o que substituiu o pré-requisito antigo e o que continua sendo exigido.',
    tipo: 'opiniao',
    duracao: '35-45s',
  },
];

/** Próxima segunda-feira a partir de hoje (ou a data passada na linha de comando). */
function primeiroDia(): Date {
  const arg = process.argv[2];
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) return new Date(`${arg}T12:00:00`);
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  // 1 = segunda. Anda até a próxima segunda (nunca hoje, pra dar tempo de gravar).
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() !== 1);
  return d;
}

/** Briefing do card: o que a pessoa precisa ler antes de gravar. */
function montaBriefing(p: Peca): string {
  const linhas = [
    `FORMATO: yap (falar pra câmera, sem roteiro decorado, edição mínima).`,
    `DURAÇÃO ALVO: ${p.duracao}.`,
    `TIPO: ${p.tipo === 'resolve' ? 'resolve algo (crescimento)' : 'põe a cara (aquecimento)'}.`,
    ``,
    `O PONTO (um só): ${p.ponto}`,
    ``,
    `GANCHO: dizer E escrever na tela nos 3 primeiros segundos. 85% assiste sem som.`,
    `RITMO: quebra de padrão a cada 3 a 5 segundos (corte, palavra na tela, mudança de enquadramento).`,
    `FIM: ${p.cta ? 'esta peça TEM pedido, e ele entra no MEIO do vídeo, não no fim.' : 'fecha no ponto, sem pedir nada. No máximo devolve a pergunta.'}`,
  ];
  if (p.falta) linhas.push(``, `FALTA PREENCHER: ${p.falta}`);
  linhas.push(
    ``,
    `MEDIR DEPOIS: alcance, visitas ao perfil, seguidores, duração, salvamento, compartilhamento.`,
    `Os 88 reels antigos ficaram sem seguidores, visitas e duração. Se ficar de novo, o piloto não conclui nada.`,
  );
  return linhas.join('\n');
}

async function main(): Promise<void> {
  const inicio = primeiroDia();
  const criados: string[] = [];
  const pulados: string[] = [];

  for (let i = 0; i < PECAS.length; i += 1) {
    const p = PECAS[i];
    const [existe] = await db
      .select({ id: conteudoPosts.id })
      .from(conteudoPosts)
      .where(eq(conteudoPosts.titulo, p.titulo))
      .limit(1);
    if (existe) {
      pulados.push(p.titulo);
      continue;
    }

    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + Math.floor(i / HORAS.length));
    const [hh, mm] = HORAS[i % HORAS.length].split(':').map(Number);
    dia.setHours(hh, mm, 0, 0);

    const [row] = await db
      .insert(conteudoPosts)
      .values({
        titulo: p.titulo,
        formato: 'reels',
        estado: 'rascunho',
        plataforma: 'instagram',
        // 'resolve' puxa gente nova; história e opinião aquecem quem já segue.
        objetivo: p.tipo === 'resolve' ? 'atracao' : 'aquecimento',
        gancho: p.gancho,
        pauta: p.ponto,
        ctaFinal: p.cta ?? null,
        briefing: montaBriefing(p),
        refsLinks: 'https://www.instagram.com/reel/DcJhZ2LBKPQ/',
        dataProgramada: dia,
      })
      .returning({ id: conteudoPosts.id });

    criados.push(
      `${dia.toISOString().slice(0, 10)} ${HORAS[i % HORAS.length]}  [${p.territorio}] ${p.titulo} (${row.id.slice(0, 8)})`,
    );
  }

  console.log(`\n=== PILOTO DE YAP — ${criados.length} peças criadas ===`);
  for (const c of criados) console.log(c);
  if (pulados.length) {
    console.log(`\n${pulados.length} já existiam e foram puladas:`);
    for (const p of pulados) console.log(`  · ${p}`);
  }
  console.log(
    `\nGrave em lote ANTES de ${inicio.toISOString().slice(0, 10)}. Plano completo: docs/piloto-yap-20-reels.md`,
  );
}

main().catch((err) => {
  console.error('[seed-piloto-yap] FALHOU:', err instanceof Error ? err.message : err);
  process.exit(1);
});
