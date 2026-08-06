---
description: Gera rascunho de carrossel/reels a partir de uma ideia, de PRINTS de slides, ou de um link do Instagram, e coloca no cronograma como rascunho
---

# gerar-carrossel

Transforma uma IDEIA, **PRINTS de slides** ou um LINK do Instagram num rascunho no cronograma.

## Pedido do usuário
$ARGUMENTS

## Como decidir o caminho (nesta ordem)

1. **IMAGENS anexadas (prints de slides)** — é o MELHOR caminho pra carrossel:
   - Leia CADA imagem **palavra por palavra** (você tem visão). Registre o **gancho** (slide 1) e o
     texto de cada slide, na ordem.
   - Se o usuário pediu pra **copiar o gancho**, use o gancho transcrito **literalmente** (ajuste só o
     mínimo pra caber na voz do @devemdobro). Senão, use como inspiração forte.
   - Monte um TEMA rico juntando a transcrição dos slides + a instrução do usuário e rode, na raiz:
     ```
     pnpm --filter @app/dobro conteudo:gerar-tema "<transcricao dos slides + instrucao>" [carrossel|reels]
     ```

2. **LINK do Instagram** (`instagram.com/reel|reels|p|tv/...`):
   ```
   pnpm --filter @app/dobro conteudo:gerar-url "<url>" [carrossel|reels] "<instrucao>"
   ```
   ⚠️ Pelo link entra só a **legenda**. O texto DENTRO dos slides do carrossel e a FALA do reels **não
   são lidos** (o Instagram bloqueia a raspagem das imagens). Se for carrossel e o usuário quer o gancho
   dos slides, **PEÇA os prints dos slides** — é o único jeito confiável.

3. **IDEIA / tema livre** (sem imagem nem link):
   ```
   pnpm --filter @app/dobro conteudo:gerar-tema "<ideia>" [carrossel|reels]
   ```

## Ao terminar
Confirme com o TÍTULO gerado (sai no output `[gerar-...] OK — ...`) e avise que está no board
**/conteudo/painel → aba Cronograma** como **rascunho** (sem data; é só arrastar pro dia).

## O presente (obrigatório quando o CTA promete um)
Se o CTA promete material na DM ("comenta STACK que eu te mando..."), o carrossel **não está pronto**
sem o presente:
1. Crie a página no **Notion** (página privada no nível do workspace, sem parent), no formato dos
   presentes anteriores: ícone emoji, subtítulo em itálico, `## <span color="blue">Categoria</span>`,
   `### <span color="blue_bg">**Nome**</span>`, link, descrição, `💡 **Como usar:**`, e no fim o convite
   da Semana + `*Dev em Dobro*`. Leia um presente existente antes de escrever, pra manter o padrão.
2. Grave o link nos **dois** lugares: `linkPresente` em `server/carrossel/carrosseis/<slug>.ts` **e** o
   campo **Link do presente** do card. O `carrossel:render` recria o card do zero, então o que estiver
   só no banco some no próximo render.
3. **UTM do convite da Semana**: nunca copie o link de inscrição de um presente antigo. Os encurtadores
   `devemdobro.dev/xxxx` já carregam o `utm_content` de OUTRO post, e a inscrição é creditada errado.
   Monte o link identificando este post:
   ```
   https://lp.devemdobro.com/evento?utm_source=notion&utm_medium=notion&utm_campaign=organico&utm_term=notion&utm_content=<nome.do.post>.<dia>.<mes>
   ```
   O `utm_content` usa palavras separadas por ponto + a data de publicação (ex.: `sites.cara.de.caro.6.8`).
4. **GIF da landing do GTA 6 no fim**: logo DEPOIS do link de inscrição (antes do `---` e do `*Dev em Dobro*`),
   todo presente leva o GIF da landing que a galera constrói na Semana. Reaproveite o upload que já existe:
   ```
   <image src="file-upload://3b46dd01-fb48-8120-a964-00b2558e145c"></image>
   ```
   Se esse upload expirar, refaça a partir do arquivo no repo (`server/carrossel/assets/semana/landing-gta6.gif`)
   com `notion-create-file-upload` + POST multipart no `upload_url`. Antes de inserir num presente antigo,
   confira se ele já não tem o GIF: o MCP não deleta bloco, então duplicata só sai na mão.

## Regras (convenções do projeto)
- NUNCA use travessão nos textos de conteúdo.
- NUNCA invente nome de método/produto que não exista.
- Se falhar por falta de `ANTHROPIC_API_KEY`, avise que a chave da IA não está no servidor.
