---
name: estrategista-carrossel-analise
description: Achados da análise de 113 carrosséis reais do @devemdobro por estrutura narrativa, base da tela Estrategista de carrossel
metadata:
  type: project
---

Análise feita sobre `apps/dobro/server/scripts/_carrosseis.json` (113 carrosséis reais publicados mar-jul 2026, campos: alcance, comentarios, seguidores, salvamentos, compartilhamentos, visitasPerfil). Alimenta a tela "Estrategista" focada em carrossel. Metas do dono: (1) ganhar seguidores, (2) gerar comentários com palavra-gatilho pra automação de DM.

**Distribuição por estrutura narrativa:** Contrarian 39, Noticia 21, Conceito 16, Storytelling 12, Ferramenta 8, Venda 8, Listicle 6, Pergunta 2, Tutorial 1.

**Resultado central:** normalizado por alcance (seg/1k e com/1k), **Ferramenta** e **Conceito** vencem as duas metas. Baseline geral: seg/1k=2.17, com/1k=11.69. Ferramenta seg/1k=9.73 com/1k=49; Conceito seg/1k=2.67 com/1k=16.14. Contrarian é o mais usado (39) mas fica na média/abaixo (seg/1k=0.56).

**Ressalvas honestas que devem sobreviver a iterações:**
- 51% dos posts têm seguidores=0 (atribuição esparsa/não confiável) — usar mediana, não só média.
- Ferramenta média é puxada pelo outlier JARVIS (post: seg=767, com=3905). SEM JARVIS os 7 restantes ainda lideram (seg/1k=4.99, com/1k=24.08), mas mediana baixa (seg=1) → alta variância.
- CTA "comenta X" (15 posts): média de comentários parece explodir (336), mas isso é o JARVIS. SEM JARVIS o CTA fica com/1k=12.89 vs baseline 11.69 → quase neutro. Conclusão: o CTA não causa a explosão de comentários, o CONTEÚDO causa. CTA é necessário pra disparar a automação, mas não substitui um tema forte.
- Noticia é bimodal: poucos hits virais (CEO Microsoft, PewDiePie) e 16/21 posts com <10 seguidores.

**Why:** o dono vai reler e re-rodar isso conforme publica mais posts; os vieses de outlier e sparsity são fáceis de esquecer e levariam a recomendação errada (ex.: "todo post precisa de CTA comenta").
**How to apply:** ao reanalisar ou construir a tela, sempre reportar média E mediana, normalizar por alcance, e checar se um único post domina a categoria antes de recomendar. Não creditar seguidores a estrutura sozinha (algoritmo empurra alcance). Ver também [[copy-carrossel-convencoes]] (nunca travessão, não inventar nomes de método).
