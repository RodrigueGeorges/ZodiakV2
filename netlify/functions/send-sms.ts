import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const _supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Accepte les deux formats de payload
    const body = JSON.parse(event.body || '{}');
    const phone = body.phone || body.to;
    const message = body.message || body.text;
    const sender = body.from || 'Zodiak';
    const isVerification = !!body.isVerification; // optionnel

    if (!phone || !message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    let smsText = message;
    // Si c'est une demande de vérification, on génère un code et on sauvegarde
    if (isVerification) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      const { error: dbError } = await _supabase
        .from('sms_verifications')
        .insert({
          phone,
          code,
          expires_at: expiresAt.toISOString()
        });
      if (dbError) {
        throw new Error('Erreur lors de la sauvegarde du code');
      }
      smsText = message.replace('{code}', code);
    }

    // Appel direct à l'API Brevo
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY || ''
      },
      body: JSON.stringify({
        sender,
        recipient: phone,
        content: smsText,
        type: 'transactional'
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Erreur lors de l'envoi du SMS");
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: result.messageId })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Error sending SMS'
      })
    };
  }
};