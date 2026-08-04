/**
 * apps/dobro — rota de LEITURA do perfil do Instagram (seguidores) p/ o painel.
 *
 * GET /api/instagram/profile → { connected, followersCount, username, mediaCount }.
 * Auth-first (fail-closed). Sem token no servidor → `{ connected: false }` (200,
 * degrada gracioso: o card mostra "Conecte o Instagram"). Erro da API de Insights
 * (token expirado/permissão) também vira `connected:false` com o motivo — a tela
 * NUNCA quebra por causa disso. O token NUNCA sai daqui (só o número).
 */

import type { Context } from 'hono';
import { auth } from './auth.js';
import { getInstagramInsightsToken } from './env.js';
import { fetchAccountInsights, fetchProfile, InsightsError } from './instagram-insights.js';

export async function handlePerfilInstagram(c: Context): Promise<Response> {
  if (!(await auth.api.getSession({ headers: c.req.raw.headers }))) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  if (!getInstagramInsightsToken()) {
    return c.json({ connected: false });
  }

  try {
    const p = await fetchProfile();
    return c.json({
      connected: true,
      username: p.username ?? null,
      followersCount: p.followersCount ?? null,
      mediaCount: p.mediaCount ?? null,
    });
  } catch (err) {
    const motivo = err instanceof InsightsError ? err.message : 'erro ao ler o perfil';
    return c.json({ connected: false, error: motivo });
  }
}

/**
 * GET /api/instagram/account-insights?dias=7 → métricas de NÍVEL DE CONTA do
 * período (as mesmas do app: contas alcançadas, visualizações, interações e
 * seguidores ganhos). É a "visão Conta" do painel. Auth-first (fail-closed).
 * Sem token → `{ connected:false }` (200, degrada gracioso). A Graph API limita
 * o range a 30 dias → `dias` é clampeado no core.
 */
export async function handleAccountInsights(c: Context): Promise<Response> {
  if (!(await auth.api.getSession({ headers: c.req.raw.headers }))) {
    return c.json({ error: 'Não autenticado' }, 401);
  }

  if (!getInstagramInsightsToken()) {
    return c.json({ connected: false });
  }

  const diasRaw = Number(c.req.query('dias'));
  const dias = Number.isFinite(diasRaw) && diasRaw > 0 ? diasRaw : 7;

  try {
    const m = await fetchAccountInsights(dias);
    return c.json({ connected: true, ...m });
  } catch (err) {
    const motivo = err instanceof InsightsError ? err.message : 'erro ao ler as métricas da conta';
    return c.json({ connected: false, error: motivo });
  }
}
