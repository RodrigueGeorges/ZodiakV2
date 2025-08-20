import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler: Handler = async (event) => {
  // Gérer les requêtes CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    };
  }

  try {
    const { shortCode } = event.queryStringParameters || {};

    if (!shortCode) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Short code manquant',
          message: 'Le paramètre shortCode est requis'
        })
      };
    }

    console.log('🔍 Recherche du token pour le short code:', shortCode);

    // Récupérer le token depuis la base de données
    const { data: tokenRow, error } = await supabase
      .from('guidance_token')
      .select('token, expires_at, user_id')
      .eq('short_code', shortCode)
      .maybeSingle();

    if (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Erreur de base de données',
          message: error.message
        })
      };
    }

    if (!tokenRow) {
      console.log('❌ Aucun token trouvé pour le short code:', shortCode);
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Token non trouvé',
          message: 'Aucun token trouvé pour ce short code'
        })
      };
    }

    // Vérifier l'expiration
    const now = new Date();
    const expiresAt = new Date(tokenRow.expires_at);

    if (now > expiresAt) {
      console.log('❌ Token expiré pour le short code:', shortCode);
      return {
        statusCode: 410,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Token expiré',
          message: 'Ce lien a expiré'
        })
      };
    }

    console.log('✅ Token trouvé et valide pour le short code:', shortCode);

    // Tracker l'accès
    try {
      await supabase
        .from('sms_tracking')
        .insert({
          user_id: tokenRow.user_id,
          short_code: shortCode,
          token: tokenRow.token,
          action: 'access',
          accessed_at: new Date().toISOString()
        });
    } catch (trackingError) {
      console.warn('⚠️ Erreur lors du tracking:', trackingError);
      // Continuer même si le tracking échoue
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        token: tokenRow.token,
        expires_at: tokenRow.expires_at,
        user_id: tokenRow.user_id
      })
    };

  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Erreur serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    };
  }
};

export { handler };
