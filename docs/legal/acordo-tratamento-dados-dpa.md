# Acordo de Tratamento de Dados Pessoais (DPA) — Modelo

> ⚠️ **MODELO / MINUTA — NÃO É ACONSELHAMENTO JURÍDICO.** Este documento é um
> ponto de partida técnico redigido pela equipe de produto para formalizar o que
> o sistema já faz. **Antes de assinar, deve ser revisado por assessoria jurídica
> com competência em LGPD**, principalmente porque há tratamento de dados de
> **pessoas reais** (leads/contatos). Campos entre colchetes `[...]` devem ser
> preenchidos. Base legal: Lei nº 13.709/2018 (LGPD).

Este Acordo de Tratamento de Dados Pessoais ("**Acordo**" ou "**DPA**") é parte
integrante e complementar do Contrato de Prestação de Serviços celebrado entre as
partes ("**Contrato Principal**") e regula o tratamento de dados pessoais
realizado no âmbito do sistema de gestão ("**OS**") fornecido e operado pela
Contratada.

## 1. Partes

- **Controlador:** [Razão social do cliente — ex.: Neurovida / Liranê Suliano], CNPJ/CPF [•], doravante "**Cliente**".
- **Operador:** [Razão social — ex.: Dev em Dobro], CNPJ [•], doravante "**Dev em Dobro**".

Nos termos do art. 5º, VI e VII, da LGPD, **o Cliente é o Controlador** (decide
sobre as finalidades e os meios do tratamento) e **a Dev em Dobro é a Operadora**
(trata dados pessoais em nome do Controlador).

## 2. Objeto e finalidade

A Dev em Dobro tratará dados pessoais **exclusivamente** para fornecer, operar,
manter e dar suporte ao OS do Cliente, seguindo as **instruções documentadas** do
Cliente (art. 39 da LGPD). A Dev em Dobro **não** utilizará os dados para
finalidades próprias, não os comercializará nem os compartilhará fora do previsto
neste Acordo.

## 3. Categorias de dados e de titulares

| Categoria de dado | Titulares | Origem |
|---|---|---|
| Nome, e-mail, telefone (contatos/leads) | Leads e clientes do Cliente | Upload de CSVs (ActiveCampaign, CRM, Hotmart, chat, etc.) |
| Respostas de pesquisa de perfil (ICP) | Leads do Cliente | Formulário/pesquisa do Cliente |
| Dados financeiros do Cliente (faturas de cartão, categorias, valores) | O próprio Cliente | Upload de PDF |
| **Faturamento agregado (Hotmart)** — apenas totais por período/produto | O próprio Cliente | API de resumo da Hotmart |
| Credenciais de acesso do Cliente (login) | Operadores do OS (equipe do Cliente) | Cadastro no OS |

**Minimização (art. 6º, III):** o OS coleta o mínimo necessário. Em particular, o
faturamento da Hotmart é trazido **apenas em forma agregada** (totais) — **dados
pessoais dos compradores do Cliente não são lidos nem armazenados** pelo OS.

## 4. Transparência sobre o acesso técnico (cláusula essencial)

O Cliente **reconhece e concorda** que, por a Dev em Dobro operar a infraestrutura
do OS (banco de dados dedicado e ambiente de execução), a Dev em Dobro **detém
capacidade técnica de acessar** os dados tratados, incluindo dados financeiros e
de faturamento. A Dev em Dobro **compromete-se a**:

1. acessar tais dados **somente** quando necessário para operação, correção de
   falhas ou **suporte solicitado pelo Cliente**;
2. **não** consultar dados financeiros/faturamento do Cliente fora dessas
   hipóteses;
3. manter **registro** das operações de tratamento (art. 37 da LGPD);
4. oferecer ao Cliente, mediante solicitação, opções de maior proteção — por
   exemplo, custódia da infraestrutura pelo próprio Cliente, ou cifragem de
   campos com chave sob controle exclusivo do Cliente.

## 5. Medidas de segurança (art. 46 e 47)

A Dev em Dobro adota, no mínimo:

- **Isolamento por cliente:** um banco de dados (Neon/PostgreSQL) dedicado por
  Cliente — sem compartilhamento físico de dados entre clientes.
- **Credenciais cifradas em repouso:** segredos que o Cliente cadastra (ex.: chave
  de API própria, credenciais Hotmart) são armazenados com cifragem
  **AES-256-GCM**; o valor em claro nunca retorna à interface.
- **Privilégio mínimo:** o runtime do OS conecta ao banco com papel de acesso
  restrito (não administrativo).
- **Autenticação obrigatória** para acessar o OS; segredos mantidos fora do código
  entregue ao navegador.
- **Transporte cifrado** (HTTPS/TLS) entre navegador, aplicação e banco.

## 6. Suboperadores

A Dev em Dobro utiliza os seguintes suboperadores para prestar o serviço, com os
quais mantém condições de proteção compatíveis com este Acordo:

| Suboperador | Finalidade | Dado envolvido |
|---|---|---|
| Neon (banco de dados PostgreSQL) | Hospedagem do banco dedicado do Cliente | Todos os dados do OS |
| Anthropic (Claude) | Leitura/estruturação de PDFs de fatura e geração de conteúdo, sob **chave do Cliente (BYOK)** | Conteúdo dos documentos enviados pelo Cliente |
| Hotmart | Fonte do faturamento (apenas resumo/agregados) | Totais de vendas do Cliente |
| [Provedor de hospedagem do app — ex.: Vercel/Cloudflare] | Execução das funções do OS | Tráfego da aplicação |

A inclusão de novo suboperador será **comunicada** ao Cliente, que poderá se opor
por motivo legítimo.

## 7. Direitos dos titulares (art. 18)

A Dev em Dobro auxiliará o Cliente, na medida técnica possível, a atender
solicitações de titulares (confirmação, acesso, correção, anonimização,
eliminação, portabilidade), repassando ao Cliente qualquer solicitação que receber
diretamente.

## 8. Incidentes de segurança (art. 48)

A Dev em Dobro comunicará ao Cliente qualquer incidente de segurança que possa
acarretar risco relevante aos titulares em prazo **razoável e sem demora
injustificada** após tomar conhecimento — meta de **[2] dias úteis** — com as
informações disponíveis para que o Cliente cumpra suas obrigações perante a ANPD e
os titulares.

## 9. Retenção e eliminação

Ao término do Contrato Principal, a Dev em Dobro, conforme instrução do Cliente,
**devolverá** e/ou **eliminará** os dados pessoais tratados, salvo obrigação legal
de guarda. Backups eventuais seguem ciclo de expurgo de **[•] dias**.

## 10. Responsabilidade do Cliente (Controlador)

O Cliente é responsável por: (i) ter **base legal** para coletar e usar os dados
que sobe ao OS (ex.: consentimento/legítimo interesse dos leads); (ii) manter a
**sua própria Política de Privacidade** publicada em seus canais (site,
formulários, pesquisa) informando aos titulares como seus dados são usados; (iii)
fornecer instruções lícitas de tratamento.

## 11. Disposições gerais

- **Confidencialidade:** as pessoas autorizadas ao tratamento estão sujeitas a
  dever de sigilo.
- **Vigência:** este Acordo vigora enquanto durar o tratamento previsto no
  Contrato Principal.
- **Prevalência:** em caso de conflito sobre proteção de dados, prevalece este
  Acordo.
- **Foro:** [comarca] / legislação brasileira (LGPD).

---

**[Cidade], [data].**

Controlador (Cliente): ____________________________

Operador (Dev em Dobro): ____________________________

> Revisão jurídica pendente. Campos `[...]` a preencher. Última atualização do
> modelo: 2026-07-14.
