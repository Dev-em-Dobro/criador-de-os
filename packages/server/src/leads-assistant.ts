/**
 * @os/server — assistente de LEADS pronto (analista de growth/leads quentes).
 *
 * Provedor de fábrica: qualquer cliente com o módulo de leads ganha um analista
 * registrando `makeLeadsAssistant(db)` em `mountAssistant` (contextKey 'leads').
 * Lê a base consolidada (tiers/segmentos/cobertura) do Neon e monta o contexto.
 */

import { makeLeads } from './leads';
import type { ServerDb } from './db';
import type { AssistantProvider } from './assistant';

/** Persona/método do analista de leads (instruções de domínio). */
export const LEADS_PERSONA = [
  'Você é um analista de growth/leads de pequenos negócios — direto, prático e orientado a ação.',
  'Avalia a base de contatos consolidada e diz ao dono ONDE focar agora para vender mais.',
  '',
  '## Como pensar',
  '- Temperatura: tiers S/A (quente), B (morno), C (frio); e os segmentos de ação.',
  '- Cobertura: quanto da base respondeu a pesquisa de perfil (sem pesquisa = "sem perfil",',
  '  não dá pra pontuar). Quanto mais gente responder, mais preciso fica o foco.',
  '- Priorize por RETORNO: ICP alto primeiro (ofereça direto); sem-perfil → peça pra',
  '  responder a pesquisa; ICP baixo → nutrição/conteúdo antes de oferecer.',
  '',
  '## Regras',
  '- Use SOMENTE os números dos dados. Nunca invente contatos nem contagens.',
  '- Se a base ainda NÃO foi pontuada, oriente a rodar a Pontuação (a análise fica limitada).',
  '',
  '## Como mapear na análise',
  '- resumo: retrato geral (tamanho da base, quão quente está, o gargalo principal).',
  '- secoes: "Temperatura da base" (por tier/segmento) e "Cobertura" (% com pesquisa, canais).',
  '- acoes: próximos passos por segmento — cada um com o público e a jogada recomendada.',
].join('\n');

const SEG_LABEL: Record<string, string> = {
  'icp-alto': 'ICP alto (tier S/A — mais quentes)',
  'icp-medio': 'ICP médio (tier B)',
  'icp-baixo': 'ICP baixo (tier C)',
  'sem-perfil': 'Sem perfil (não respondeu a pesquisa)',
};

/**
 * Provedor de fábrica: lê a base de leads e monta o contexto. `null` (estado
 * vazio) quando ainda não há leads consolidados.
 */
export function makeLeadsAssistant(db: ServerDb): AssistantProvider {
  const api = makeLeads(db);
  return {
    persona: LEADS_PERSONA,
    async provide() {
      const summary = await api.getLeadsSummary();
      if (summary.consolidated === 0) return null;

      const all = await api.listLeads(null, 500);
      const scored = all.filter((l) => l.tier !== null).length;
      const bySeg: Record<string, number> = {};
      const byTier: Record<string, number> = {};
      let comPesquisa = 0;
      let comEmail = 0;
      let comPhone = 0;
      for (const l of all) {
        if (l.segment) bySeg[l.segment] = (bySeg[l.segment] ?? 0) + 1;
        if (l.tier) byTier[l.tier] = (byTier[l.tier] ?? 0) + 1;
        if (l.respondeuPesquisa) comPesquisa++;
        if (l.hasEmail) comEmail++;
        if (l.hasPhone) comPhone++;
      }
      const total = all.length;
      const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

      const linhas: string[] = [];
      linhas.push(`BASE CONSOLIDADA: ${total} leads únicos (${summary.totalRows} registros importados, deduplicados).`);
      linhas.push(scored > 0 ? `PONTUADOS: ${scored} de ${total}.` : 'A base AINDA NÃO FOI PONTUADA — rode a Pontuação para classificar por interesse.');

      if (scored > 0) {
        linhas.push('');
        linhas.push('POR TIER:');
        for (const t of ['S', 'A', 'B', 'C']) if (byTier[t]) linhas.push(`- Tier ${t}: ${byTier[t]}`);
        linhas.push('');
        linhas.push('POR SEGMENTO DE AÇÃO:');
        for (const [seg, n] of Object.entries(bySeg).sort((a, b) => b[1] - a[1])) {
          linhas.push(`- ${SEG_LABEL[seg] ?? seg}: ${n} (${pct(n)}%)`);
        }
      }

      linhas.push('');
      linhas.push('COBERTURA:');
      linhas.push(`- Responderam a pesquisa de perfil: ${comPesquisa} (${pct(comPesquisa)}%).`);
      linhas.push(`- Com e-mail: ${pct(comEmail)}% · com telefone: ${pct(comPhone)}%.`);

      linhas.push('');
      linhas.push('POR FONTE (registros importados):');
      for (const s of summary.sources) if (s.rows > 0) linhas.push(`- ${s.label}: ${s.rows}`);

      // Alguns leads mais quentes (nome + tier + fontes) para dar ação concreta.
      const quentes = all.filter((l) => l.segment === 'icp-alto').slice(0, 12);
      if (quentes.length) {
        linhas.push('');
        linhas.push('LEADS MAIS QUENTES (ICP alto — comece por estes):');
        for (const l of quentes) {
          linhas.push(`- ${l.name ?? '(sem nome)'} · tier ${l.tier} · via ${l.sources.join('/')}`);
        }
      }

      return linhas.join('\n');
    },
  };
}
