/**
 * apps/dobro — carrossel do Cline (agente de código open source no VS Code, que
 * roda até com modelo local).
 *
 * Encaixe no veredito: ferramenta grátis de IA para dev, open source, que roda
 * na máquina do usuário. Fecha o combo com os carrosséis do Ollama e do n8n.
 *
 * Precisão (Article IV, conferido em github.com/cline/cline em 05/08/2026):
 * é um agente de codificação autônomo disponível como SDK, extensão de IDE e
 * assistente de linha de comando; licença Apache 2.0, código aberto; tem extensão
 * para VS Code e plugin para JetBrains, além do CLI; suporta modelos locais via
 * Ollama e LM Studio; lê a estrutura do projeto e faz mudanças coordenadas entre
 * arquivos; executa comandos no terminal; acompanha erros de linter e compilador
 * e corrige; toda edição aparece como diff pra revisar, alterar ou reverter.
 * NÃO afirmamos preço de modelo, número de instalações nem comparação de
 * qualidade com outras ferramentas. SEM travessão.
 */
import type { Carrossel } from '../types';

export const clineVscode: Carrossel = {
  slug: 'cline-vscode',
  titulo: 'O agente de código open source que roda no seu VS Code',
  gancho: 'Existe um agente de código aberto que trabalha dentro do seu VS Code e aceita rodar com IA da sua máquina.',
  refsLinks: 'https://github.com/cline/cline',
  slides: [
    {
      variant: 'photo',
      cover: true,
      semFundo: true,
      titulo: 'Tem um agente de\ncódigo **aberto** que\ntrabalha dentro do\nseu VS Code.\nE aceita rodar\ncom IA local.',
      corpo: 'Passa pro lado que eu te mostro 👉',
    },
    {
      variant: 'dark',
      eyebrow: 'O que é',
      titulo: 'Chama **Cline**,\nlicença Apache 2.0',
      steps: [
        { n: '01', titulo: 'Vive dentro do editor', sub: 'Extensão do VS Code, e também tem pra JetBrains e no terminal' },
        { n: '02', titulo: 'É código aberto', sub: 'Você vê o que ele faz, não é caixa preta' },
        { n: '03', titulo: 'Aceita modelo local', sub: 'Dá pra ligar num modelo rodando na sua máquina, via Ollama ou LM Studio' },
        { n: '04', titulo: 'Age, não só sugere', sub: 'Ele edita arquivo, roda comando e acompanha o resultado' },
      ],
    },
    {
      variant: 'light',
      layout: 'center',
      icone: 'follow',
      eyebrow: 'Antes de continuar',
      titulo: 'Segue o\n**@devemdobro**',
      corpo: 'Toda semana eu mostro ferramenta de IA aberta pra quem programa. Segue pra não perder as próximas.',
    },
    {
      variant: 'dark',
      denso: true,
      eyebrow: 'Salva esse slide',
      titulo: 'A diferença entre\n**sugerir** e **fazer**',
      terminal: [
        'AUTOCOMPLETE → completa a linha que você digita',
        'CHAT         → responde e você copia na mão',
        'AGENTE       → lê o projeto, edita os arquivos,',
        '               roda o comando e corrige o erro',
      ],
      corpo: 'É a diferença entre ganhar tempo digitando e ganhar tempo na tarefa inteira.',
    },
    {
      variant: 'purple',
      eyebrow: 'O que ele faz de verdade',
      titulo: 'Ele trabalha no\nprojeto inteiro',
      itens: [
        { icone: 'layers', titulo: 'Mudança coordenada', sub: 'Lê como os arquivos se relacionam e mexe em todos os que precisam' },
        { icone: 'code', titulo: 'Roda comando no terminal', sub: 'Instala pacote, roda teste, sobe o projeto' },
        { icone: 'eye', titulo: 'Corrige o que quebrou', sub: 'Acompanha erro de linter e de compilador e volta pra arrumar' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'O que te dá segurança',
      titulo: 'Toda edição vira\num **diff**',
      corpo:
        'Nada some sem você ver. Cada alteração aparece como diferença, lado a lado, pra você revisar, mudar ou reverter. Você continua sendo quem decide o que entra no projeto.',
    },
    {
      variant: 'dark',
      eyebrow: 'Pra que serve na prática',
      titulo: 'O tipo de tarefa\nque ele **resolve bem**',
      itens: [
        { icone: 'loop', titulo: 'Refatorar em vários arquivos', sub: 'Renomear e reorganizar sem esquecer nenhum ponto' },
        { icone: 'puzzle', titulo: 'Entrar em projeto legado', sub: 'Ele lê a estrutura e te explica antes de você mexer' },
        { icone: 'laptop', titulo: 'Tarefa repetitiva de setup', sub: 'Configuração e boilerplate que você já fez dez vezes' },
      ],
    },
    {
      variant: 'light',
      eyebrow: 'Um aviso honesto',
      titulo: 'Agente sem revisão\né **dívida técnica**',
      corpo:
        'Ele acelera muito, e por isso mesmo erra rápido também. Leia os diffs, rode os testes e não aceite mudança que você não entendeu. Quem responde pelo código continua sendo você.',
    },
    {
      variant: 'purple',
      tipo: 'cta',
      logo: 'Dev em Dobro',
      handle: '@devemdobro',
      titulo: 'Quer instalar e\nconfigurar hoje?',
      botao: 'Comente CLINE 👇',
      corpo: 'Comenta CLINE que eu te mando o passo a passo de instalação e como apontar ele pra uma IA da sua máquina.',
    },
  ],
  legenda:
    'A maioria das pessoas usa IA pra programar do jeito mais lento possível: pergunta no chat, copia a resposta e ' +
    'cola no editor. Existe um degrau acima disso, e ele é aberto.\n\n' +
    'O Cline é um agente de codificação com licença Apache 2.0 que vive dentro do VS Code (também tem pra JetBrains e ' +
    'no terminal). A diferença pro chat é que ele age: lê como os arquivos do projeto se relacionam, faz mudanças ' +
    'coordenadas entre eles, roda comandos no terminal e acompanha erro de linter e de compilador pra voltar e ' +
    'corrigir.\n\n' +
    'O detalhe que quase ninguém explora: ele aceita modelo local, via Ollama ou LM Studio. Ou seja, dá pra ter um ' +
    'agente trabalhando no seu código com uma IA que roda na sua máquina.\n\n' +
    'E o que te dá segurança: toda edição aparece como diff, pra você revisar, alterar ou reverter. Nada entra no ' +
    'projeto sem você ver.\n\n' +
    'Um aviso honesto: agente acelera muito e erra rápido também. Leia os diffs, rode os testes e não aceite mudança ' +
    'que você não entendeu. Quem responde pelo código continua sendo você.\n\n' +
    'Comenta CLINE aqui embaixo que eu te mando o passo a passo de instalação e como apontar ele pra uma IA da sua ' +
    'máquina. 👇',
  hashtags: 'cline vscode inteligenciaartificial opensource programacao devweb iagratis devemdobro produtividadedev ollama',
  ctaFinal: 'Comenta CLINE que eu te mando o passo a passo de instalação e como apontar ele pra uma IA da sua máquina.',
  briefing:
    'FÓRMULA: ferramenta grátis de IA pra dev, open source, que roda na máquina. Fecha o combo com os carrosséis do ' +
    'Ollama e do n8n.\n\n' +
    'FATOS CONFERIDOS em 05/08/2026 (github.com/cline/cline)\n' +
    'Agente de codificação autônomo como SDK, extensão de IDE e assistente de linha de comando. Licença Apache 2.0. ' +
    'Extensão pra VS Code e plugin pra JetBrains, além do CLI. Suporta modelos locais via Ollama e LM Studio. Lê a ' +
    'estrutura do projeto e faz mudanças coordenadas. Executa comandos no terminal. Acompanha erros de linter e ' +
    'compilador e corrige. Toda edição aparece como diff pra revisar, alterar ou reverter.\n' +
    'NÃO afirmamos preço de modelo, número de instalações nem comparação com concorrentes.\n\n' +
    'PENDENTE: arte de capa. O ideal é um print do Cline trabalhando no VS Code, com o diff aberto.',
};
