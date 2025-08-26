import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { /* re-use */ } from './_guidanceUtils';

// Lazy imports to avoid circular deps; we only need types/values
let getProkeralaTokenFn: (() => Promise<string|null>) | null = null;

try {
  // Dynamically import to access internal helper without exposing
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const utils = require('./_guidanceUtils');
  if (typeof utils.getProkeralaToken === 'function') {
    getProkeralaTokenFn = utils.getProkeralaToken as () => Promise<string|null>;
  }
} catch {}

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async () => {
  const startedAt = new Date().toISOString();
  const env = {
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasSupabaseKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasProkeralaBase: Boolean(process.env.PROKERALA_BASE_URL),
    hasProkeralaCreds: Boolean(process.env.PROKERALA_CLIENT_ID && process.env.PROKERALA_CLIENT_SECRET),
    hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
    openAIModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    appUrl: process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://zodiakv2.netlify.app'
  };

  const checks: Record<string, unknown> = {};

  // Supabase basic check: select 1 via a lightweight table if exists
  try {
    const { error } = await supabase
      .from('daily_guidance')
      .select('id')
      .limit(1);
    checks.supabase = { ok: !error, error: error?.message };
  } catch (e: any) {
    checks.supabase = { ok: false, error: e?.message };
  }

  // Prokerala token check (does not call heavy API)
  try {
    let tokenOk = false;
    if (getProkeralaTokenFn) {
      const token = await getProkeralaTokenFn();
      tokenOk = Boolean(token);
    }
    checks.prokerala = { ok: tokenOk };
  } catch (e: any) {
    checks.prokerala = { ok: false, error: e?.message };
  }

  // OpenAI: we do not hit API here; just expose config presence
  checks.openai = { ok: env.hasOpenAIKey, model: env.openAIModel };

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      startedAt,
      env,
      checks
    })
  };
};


