/**
 * apps/dobro — registro de carrosséis. Cada carrossel novo entra aqui (uma linha)
 * e passa a ser renderizável por `pnpm carrossel:render <slug>`.
 */
import type { Carrossel } from './types';
import { gta6 } from './carrosseis/gta6';
import { gtaAntipirataria } from './carrosseis/gta-antipirataria';
import { viciar } from './carrosseis/viciar';
import { lerCodigoIa } from './carrosseis/ler-codigo-ia';
import { erroIa30min } from './carrosseis/erro-ia-30min';
import { skynet } from './carrosseis/skynet';
import { iaPensar } from './carrosseis/ia-pensar';
import { ohMyGit } from './carrosseis/oh-my-git';
import { ufcRobosChina } from './carrosseis/ufc-robos-china';
import { elevatorSaga } from './carrosseis/elevator-saga';
import { vagaComClaude } from './carrosseis/vaga-com-claude';
import { curriculoPorVaga } from './carrosseis/curriculo-por-vaga';
import { ollamaLocal } from './carrosseis/ollama-local';
import { quatroSkillsClaudeCode } from './carrosseis/4-skills-claude-code';
import { learnGitBranching } from './carrosseis/learn-git-branching';
import { whisperLocal } from './carrosseis/whisper-local';
import { cssJogos } from './carrosseis/css-jogos';
import { n8nSelfHost } from './carrosseis/n8n-self-host';
import { clineVscode } from './carrosseis/cline-vscode';
import { excalidraw } from './carrosseis/excalidraw';
import { gitComandosDia } from './carrosseis/git-comandos-dia';
import { asyncAwait } from './carrosseis/async-await';
import { caraDeCaro } from './carrosseis/cara-de-caro';
import { instalarNoClaude } from './carrosseis/instalar-no-claude';
import { claudeLinkedinCurriculo } from './carrosseis/claude-linkedin-curriculo';
import { claudeLinkedinPerfil } from './carrosseis/claude-linkedin-perfil';
import { seteRepos } from './carrosseis/7-repos';
import { cincoPastas } from './carrosseis/5-pastas';
import { quatroMcpGratis } from './carrosseis/4-mcp-gratis';
import { claudeMd } from './carrosseis/claude-md';
import { graphify } from './carrosseis/graphify';
import { curriculoLimbo } from './carrosseis/curriculo-limbo';
import { ruflo } from './carrosseis/ruflo';
import { claudeSkills } from './carrosseis/claude-skills';
import { githubPerfil } from './carrosseis/github-perfil';
import { treinarEntrevista } from './carrosseis/treinar-entrevista';
import { designApple } from './carrosseis/design-apple';
import { hermes } from './carrosseis/hermes';
import { bitburner } from './carrosseis/bitburner';
import { sbtVagas } from './carrosseis/sbt-vagas';
import { brincaComIa } from './carrosseis/brinca-com-ia';
import { manusGratis } from './carrosseis/manus-gratis';
import { claude500Vagas } from './carrosseis/claude-500-vagas';
import { claudeMem } from './carrosseis/claude-mem';
import { reposMatadores } from './carrosseis/repos-matadores';

const CARROSSEIS: Record<string, Carrossel> = {
  [gta6.slug]: gta6,
  [gtaAntipirataria.slug]: gtaAntipirataria,
  [viciar.slug]: viciar,
  [lerCodigoIa.slug]: lerCodigoIa,
  [erroIa30min.slug]: erroIa30min,
  [skynet.slug]: skynet,
  [iaPensar.slug]: iaPensar,
  [ohMyGit.slug]: ohMyGit,
  [ufcRobosChina.slug]: ufcRobosChina,
  [elevatorSaga.slug]: elevatorSaga,
  [vagaComClaude.slug]: vagaComClaude,
  [curriculoPorVaga.slug]: curriculoPorVaga,
  [ollamaLocal.slug]: ollamaLocal,
  [quatroSkillsClaudeCode.slug]: quatroSkillsClaudeCode,
  [learnGitBranching.slug]: learnGitBranching,
  [whisperLocal.slug]: whisperLocal,
  [cssJogos.slug]: cssJogos,
  [n8nSelfHost.slug]: n8nSelfHost,
  [clineVscode.slug]: clineVscode,
  [excalidraw.slug]: excalidraw,
  [gitComandosDia.slug]: gitComandosDia,
  [asyncAwait.slug]: asyncAwait,
  [claudeLinkedinCurriculo.slug]: claudeLinkedinCurriculo,
  [claudeLinkedinPerfil.slug]: claudeLinkedinPerfil,
  [caraDeCaro.slug]: caraDeCaro,
  [instalarNoClaude.slug]: instalarNoClaude,
  [seteRepos.slug]: seteRepos,
  [cincoPastas.slug]: cincoPastas,
  [quatroMcpGratis.slug]: quatroMcpGratis,
  [claudeMd.slug]: claudeMd,
  [graphify.slug]: graphify,
  [curriculoLimbo.slug]: curriculoLimbo,
  [ruflo.slug]: ruflo,
  [claudeSkills.slug]: claudeSkills,
  [githubPerfil.slug]: githubPerfil,
  [treinarEntrevista.slug]: treinarEntrevista,
  [designApple.slug]: designApple,
  [hermes.slug]: hermes,
  [bitburner.slug]: bitburner,
  [sbtVagas.slug]: sbtVagas,
  [brincaComIa.slug]: brincaComIa,
  [manusGratis.slug]: manusGratis,
  [claude500Vagas.slug]: claude500Vagas,
  [claudeMem.slug]: claudeMem,
  [reposMatadores.slug]: reposMatadores,
};

export function getCarrossel(slug: string): Carrossel | undefined {
  return CARROSSEIS[slug];
}

export function listSlugs(): string[] {
  return Object.keys(CARROSSEIS);
}
