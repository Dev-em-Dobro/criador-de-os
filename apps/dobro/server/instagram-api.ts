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
import { fetchProfile, InsightsError } from './instagram-insights.js';

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
