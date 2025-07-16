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
    const { phone, code } = JSON.parse(event.body || '{}');

    if (!phone || !code) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters' })
      };
    }

    // Vérifier le code dans la base de données
    const { data: verificationData, error: verificationError } = await _supabase
      .from('sms_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('expires_at', new Date().toISOString(), 'gt')
      .single();

    if (verificationError || !verificationData) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          success: false,
          error: 'Code incorrect ou expiré'
        })
      };
    }

    // Supprimer le code utilisé
    await _supabase
      .from('sms_verifications')
      .delete()
      .eq('id', verificationData.id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        message: 'Code vérifié avec succès'
      })
    };

    // Code incorrect
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: false,
        error: 'Code incorrect'
      })
    };

  } catch (error) {
    console.error('Error verifying SMS code:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Error verifying SMS code'
      })
    };
  }
}; 