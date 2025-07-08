import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TIMEZONE = 'Europe/Paris';

async function sendSms(phoneNumber: string, content: string): Promise<void> {
  const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!
    },
    body: JSON.stringify({
      recipient: phoneNumber,
      sender: 'Zodiak',
      content: content,
      type: 'transactional'
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Erreur Brevo: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('✅ SMS envoyé via Brevo:', result);
}

function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const handler: Handler = async () => {
  try {
    console.log('🧪 Début de l\'envoi du SMS de test à Rodrigue...');

    // 1. Rechercher le profil de Rodrigue
    console.log('1️⃣ Recherche du profil de Rodrigue...');
    const { data: rodrigueProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .ilike('name', '%Rodrigue%')
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erreur lors de la recherche:', profileError);
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Erreur lors de la recherche du profil',
          details: profileError.message 
        })
      };
    }

    if (!rodrigueProfile) {
      console.log('❌ Aucun utilisateur nommé "Rodrigue" trouvé');
      return {
        statusCode: 404,
        body: JSON.stringify({ 
          error: 'Utilisateur Rodrigue non trouvé',
          message: 'Aucun utilisateur avec "Rodrigue" dans le nom n\'a été trouvé'
        })
      };
    }

    console.log(`✅ Profil trouvé: ${rodrigueProfile.name}`);
    console.log(`   📱 Téléphone: ${rodrigueProfile.phone || '❌ Manquant'}`);
    console.log(`   📊 Statut: ${rodrigueProfile.subscription_status}`);

    // 2. Vérifier les prérequis
    const issues: string[] = [];
    if (!rodrigueProfile.phone) issues.push('Pas de numéro de téléphone');
    if (!rodrigueProfile.natal_chart) issues.push('Pas de thème natal calculé');
    if (rodrigueProfile.subscription_status === 'expired') issues.push('Abonnement expiré');

    if (issues.length > 0) {
      console.log('❌ Problèmes détectés:', issues);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Problèmes avec le profil',
          issues: issues,
          profile: {
            name: rodrigueProfile.name,
            phone: rodrigueProfile.phone,
            subscription_status: rodrigueProfile.subscription_status
          }
        })
      };
    }

    // 3. Générer un token unique et un code court
    const token = crypto.randomUUID();
    let shortCode;
    let isUnique = false;
    while (!isUnique) {
      shortCode = generateShortCode();
      const { data: existing } = await supabase.from('guidance_token').select('id').eq('short_code', shortCode).maybeSingle();
      if (!existing) isUnique = true;
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const today = format(new Date(), 'yyyy-MM-dd');
    
    await supabase.from('guidance_token').upsert({
      user_id: rodrigueProfile.id,
      token,
      date: today,
      expires_at: expiresAt,
      short_code: shortCode
    });

    // 4. Créer l'entrée de tracking
    await supabase
      .from('sms_tracking')
      .insert({
        user_id: rodrigueProfile.id,
        short_code: shortCode,
        token: token,
        date: today,
        sent_at: new Date().toISOString()
      });

    // 5. Préparer le lien court
    const appUrl = process.env.URL || 'https://zodiak.netlify.app';
    const shortLink = `${appUrl}/g/${shortCode}`;

    // 6. Envoyer le SMS de test personnalisé
    const firstName = rodrigueProfile.name?.split(' ')[0] || 'cher utilisateur';
    const smsContent = `🧪 TEST - Bonjour ${firstName} !

Ta guidance astrale du jour est prête !
Découvre ton message personnalisé ici 👇
${shortLink}
(Valable 24h)`;

    console.log('📱 Envoi du SMS de test personnalisé...');
    await sendSms(rodrigueProfile.phone, smsContent);

    // 7. Mettre à jour la date de dernière guidance envoyée
    await supabase
      .from('profiles')
      .update({ 
        last_guidance_sent: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', rodrigueProfile.id);

    console.log('✅ SMS de test envoyé avec succès à Rodrigue !');

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true,
        message: 'SMS de test envoyé avec succès',
        recipient: {
          name: rodrigueProfile.name,
          phone: rodrigueProfile.phone
        },
        link: shortLink,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du SMS de test:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur lors de l\'envoi du SMS de test',
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      })
    };
  }
};

export { handler }; 