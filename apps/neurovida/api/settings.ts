/**
 * apps/neurovida — configurações do cliente (modelo BYOK) com cifra em repouso.
 *
 * O cliente cola a PRÓPRIA chave de API (ex.: Anthropic) na tela de Configurações.
 * Aqui ela é cifrada (AES-256-GCM) e guardada no Neon do cliente. Regras:
 *  - O valor cru NUNCA volta ao browser — só um `hint` mascarado (ex.: ••••Xy4Z).
 *  - Só chaves de um registro FECHADO (`KNOWN_SETTINGS`) podem ser gravadas.
 *  - Ler/gravar exige sessão (o handler em app.ts é auth-first).
 *  - O valor decifrado é usado SÓ server-side (ex.: chamar a Claude API).
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { dbAuth, schema } from '../db/client';
import { getSettingsEncKey } from './env';

/** Uma configuração conhecida (BYOK). `prefix` valida o formato básico da chave. */
export interface SettingSpec {
  key: string;
  label: string;
  help?: string;
  /** Prefixo esperado da chave (validação leve), ex.: 'sk-ant-'. */
  prefix?: string;
}

/** Registro FECHADO de configurações aceitas (a "allowlist" das settings). */
export const KNOWN_SETTINGS: Record<string, SettingSpec> = {
  anthropic_api_key: {
    key: 'anthropic_api_key',
    label: 'Chave da API (Anthropic / Claude)',
    help: 'Usada para gerar conteúdo com IA (Estúdio IA). Gere em console.anthropic.com. Fica cifrada; nunca é exibida de volta.',
    prefix: 'sk-ant-',
  },
};

// ------------------------------------------------------------
// Cifra AES-256-GCM (iv[12] + tag[16] + ciphertext, base64)
// ------------------------------------------------------------

function key32(): Buffer {
  // Deriva 32 bytes determinísticos do segredo server-side (sha256).
  return createHash('sha256').update(getSettingsEncKey()).digest();
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key32(), iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', key32(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/** Resumo mascarado seguro para exibir no painel (nunca o valor todo). */
function maskHint(value: string): string {
  const tail = value.slice(-4);
  return `••••${tail}`;
}

// ------------------------------------------------------------
// Operações (usam o role app_auth via dbAuth)
// ------------------------------------------------------------

export interface SettingStatus {
  key: string;
  label: string;
  help: string | null;
  configured: boolean;
  hint: string | null;
}

/** Status de TODAS as settings conhecidas (configurada? + hint). Sem valores. */
export async function getSettingsStatus(): Promise<SettingStatus[]> {
  const rows = await dbAuth.select().from(schema.appSettings);
  const byKey = new Map(rows.map((r) => [r.key, r.hint] as const));
  return Object.values(KNOWN_SETTINGS).map((s) => ({
    key: s.key,
    label: s.label,
    help: s.help ?? null,
    configured: byKey.has(s.key),
    hint: byKey.get(s.key) ?? null,
  }));
}

/** Grava (upsert) uma setting cifrada. Retorna o hint mascarado. */
export async function setSetting(key: string, value: string): Promise<string> {
  const enc = encryptSecret(value);
  const hint = maskHint(value);
  const now = new Date();
  await dbAuth
    .insert(schema.appSettings)
    .values({ key, valueEncrypted: enc, hint, updatedAt: now })
    .onConflictDoUpdate({
      target: schema.appSettings.key,
      set: { valueEncrypted: enc, hint, updatedAt: now },
    });
  return hint;
}

/** Remove uma setting. */
export async function deleteSetting(key: string): Promise<void> {
  await dbAuth.delete(schema.appSettings).where(eq(schema.appSettings.key, key));
}

/**
 * Valor decifrado de uma setting, ou null se ausente/ilegível. USO SÓ SERVER-SIDE
 * (ex.: chamar a Claude API com a chave BYOK do cliente).
 */
export async function getSettingValue(key: string): Promise<string | null> {
  const rows = await dbAuth
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, key))
    .limit(1);
  if (rows.length === 0) return null;
  try {
    return decryptSecret(rows[0].valueEncrypted);
  } catch {
    return null;
  }
}
