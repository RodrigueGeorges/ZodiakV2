import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint de health check pour la stack serveur.
 *
 * Vérifie :
 *   - Supabase : SELECT léger sur `daily_guidance`
 *   - OpenAI : présence de la clé (sans hit l'API)
 *   - Meta : présence des configs WhatsApp / Instagram
 *
 * ⚠️ Les noms de variables doivent rester alignés sur `_metaUtils.ts`
 * (source de vérité de l'envoi). Voir `getMetaConfig()`.
 */
export const handler: Handler = async () => {
  const startedAt = new Date().toISOString();
  const env = {
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasSupabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    openAIModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    hasWhatsAppCloud: Boolean(
      process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN
    ),
    hasInstagram: Boolean(
      process.env.INSTAGRAM_BUSINESS_ID && process.env.INSTAGRAM_PAGE_ACCESS_TOKEN
    ),
    hasMetaAppSecret: Boolean(process.env.META_APP_SECRET),
    hasMetaVerifyToken: Boolean(process.env.META_VERIFY_TOKEN),
    appUrl: process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://zodiakastro.com',
  };

  const checks: Record<string, unknown> = {};

  try {
    const { error } = await supabase.from('daily_guidance').select('id').limit(1);
    checks.supabase = { ok: !error, error: error?.message };
  } catch (e: unknown) {
    checks.supabase = { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  checks.openai = { ok: env.hasOpenAIKey, model: env.openAIModel };
  checks.whatsapp = { ok: env.hasWhatsAppCloud };
  checks.instagram = { ok: env.hasInstagram };
  checks.metaWebhook = { ok: env.hasMetaAppSecret && env.hasMetaVerifyToken };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startedAt, env, checks }),
  };
};
