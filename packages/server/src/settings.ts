/**
 * @os/server — Configurações do cliente (BYOK) com cifra em repouso.
 *
 * Fábrica: `makeSettings(db, encKey)` devolve as operações ligadas ao banco do
 * app e ao segredo de cifra do app (injetados). O valor cru NUNCA volta ao
 * browser — só um hint mascarado. Só chaves de `KNOWN_SETTINGS` entram.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { appSettings } from './schema';
import type { ServerDb } from './db';

export interface SettingSpec {
  key: string;
  label: string;
  help?: string;
  prefix?: string;
}

/** Registro FECHADO de configurações aceitas. */
export const KNOWN_SETTINGS: Record<string, SettingSpec> = {
  anthropic_api_key: {
    key: 'anthropic_api_key',
    label: 'Chave da API (Anthropic / Claude)',
    help: 'Usada nas ações de IA (ex.: gerar conteúdo, ler PDFs de fatura). Gere em console.anthropic.com. Fica cifrada; nunca é exibida de volta.',
    prefix: 'sk-ant-',
  },
};

export interface SettingStatus {
  key: string;
  label: string;
  help: string | null;
  configured: boolean;
  hint: string | null;
}

export interface SettingsApi {
  getSettingsStatus(): Promise<SettingStatus[]>;
  setSetting(key: string, value: string): Promise<string>;
  deleteSetting(key: string): Promise<void>;
  getSettingValue(key: string): Promise<string | null>;
}

/** Constrói as operações de Configurações sobre o `db` e o segredo de cifra do app. */
export function makeSettings(db: ServerDb, encKey: () => string): SettingsApi {
  const key32 = (): Buffer => createHash('sha256').update(encKey()).digest();

  const encryptSecret = (plain: string): string => {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key32(), iv);
    const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, ct]).toString('base64');
  };

  const decryptSecret = (payload: string): string => {
    const buf = Buffer.from(payload, 'base64');
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const ct = buf.subarray(28);
    const decipher = createDecipheriv('aes-256-gcm', key32(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
  };

  const maskHint = (value: string): string => `••••${value.slice(-4)}`;

  return {
    async getSettingsStatus() {
      const rows = await db.select().from(appSettings);
      const byKey = new Map(rows.map((r) => [r.key, r.hint] as const));
      return Object.values(KNOWN_SETTINGS).map((s) => ({
        key: s.key,
        label: s.label,
        help: s.help ?? null,
        configured: byKey.has(s.key),
        hint: byKey.get(s.key) ?? null,
      }));
    },

    async setSetting(key: string, value: string) {
      const enc = encryptSecret(value);
      const hint = maskHint(value);
      const now = new Date();
      await db
        .insert(appSettings)
        .values({ key, valueEncrypted: enc, hint, updatedAt: now })
        .onConflictDoUpdate({ target: appSettings.key, set: { valueEncrypted: enc, hint, updatedAt: now } });
      return hint;
    },

    async deleteSetting(key: string) {
      await db.delete(appSettings).where(eq(appSettings.key, key));
    },

    async getSettingValue(key: string) {
      const rows = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
      if (rows.length === 0) return null;
      try {
        return decryptSecret(rows[0].valueEncrypted);
      } catch {
        return null;
      }
    },
  };
}
