import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const handler: Handler = async (event) => {
  // Autoriser les requêtes CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Gérer les requêtes OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { shortCode, token, action } = event.queryStringParameters || {};
    const userAgent = event.headers['user-agent'] || '';
    const ipAddress = event.headers['client-ip'] || event.headers['x-forwarded-for'] || '';

    if (!shortCode || !token || !action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Paramètres manquants: shortCode, token et action requis' 
        }),
      };
    }

    // Valider l'action
    if (!['open', 'click'].includes(action)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Action invalide. Utilisez "open" ou "click"' 
        }),
      };
    }

    console.log(`📊 Tracking ${action} pour shortCode: ${shortCode}`);

    // Mettre à jour le tracking
    const updateData: any = {
      updated_at: new Date().toISOString(),
      user_agent: userAgent,
      ip_address: ipAddress,
    };

    // Mettre à jour le timestamp approprié
    if (action === 'open') {
      updateData.opened_at = new Date().toISOString();
    } else if (action === 'click') {
      updateData.clicked_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('sms_tracking')
      .update(updateData)
      .eq('short_code', shortCode)
      .eq('token', token)
      .select('*')
      .single();

    if (error) {
      console.error('❌ Erreur lors du tracking:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: 'Erreur lors du tracking',
          details: error.message 
        }),
      };
    }

    if (!data) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: 'Lien SMS non trouvé ou expiré' 
        }),
      };
    }

    console.log(`✅ Tracking ${action} enregistré pour l'utilisateur ${data.user_id}`);

    // Retourner une image 1x1 transparente pour le tracking d'ouverture
    if (action === 'open') {
      const transparentPixel = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        body: transparentPixel,
        isBase64Encoded: true,
      };
    }

    // Pour les clics, retourner une réponse JSON
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        message: `Tracking ${action} enregistré`,
        timestamp: new Date().toISOString()
      }),
    };

  } catch (error) {
    console.error('❌ Erreur générale dans le tracking:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Erreur interne du serveur',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      }),
    };
  }
};

export { handler }; 