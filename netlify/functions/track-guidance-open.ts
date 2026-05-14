import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const transparentPixel =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const handler: Handler = async (event) => {
  const { shortCode, token } = event.queryStringParameters || {};

  if (!shortCode || !token) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'shortCode et token sont requis' }),
    };
  }

  try {
    const { data: tokenRow } = await supabase
      .from('guidance_token')
      .select('token')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (!tokenRow || tokenRow.token !== token) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Lien introuvable' }),
      };
    }

    await supabase
      .from('message_log')
      .update({ read_at: new Date().toISOString() })
      .eq('short_code', shortCode);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
      body: transparentPixel,
      isBase64Encoded: true,
    };
  } catch (error) {
    console.error('[track-guidance-open] failed', error);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      body: transparentPixel,
      isBase64Encoded: true,
    };
  }
};

export { handler };
