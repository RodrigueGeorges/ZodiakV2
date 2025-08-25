import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/LoadingScreen';

export default function GuidanceShortRedirect() {
  const { short } = useParams();
  const navigate = useNavigate();

  // Log au chargement du composant
  console.log('🚀 GuidanceShortRedirect - Composant chargé');
  console.log('📋 Short code reçu:', short);

  useEffect(() => {
    const fetchAndRedirect = async () => {
      console.log('🔍 GuidanceShortRedirect - Début du processus');
      console.log('📋 Short code reçu:', short);
      console.log('🔍 URL actuelle:', window.location.href);

      if (!short) {
        console.log('❌ Aucun short code fourni');
        navigate('/guidance/access?error=notfound', { replace: true });
        return;
      }

      try {
        // 1) Appeler la fonction Netlify d'abord (bypass RLS, source de vérité)
        console.log('🔐 Appel fonction get-token (serverless)');
        try {
          const resp = await fetch(`/.netlify/functions/get-token?shortCode=${short}`, { method: 'GET' });
          if (resp.status === 200) {
            const payload = await resp.json();
            console.log('✅ Token via function:', payload);
            if (payload?.token) {
              navigate(`/guidance/access?token=${payload.token}`, { replace: true });
              return;
            }
          } else if (resp.status === 404) {
            navigate('/guidance/access?error=notfound', { replace: true });
            return;
          } else if (resp.status === 410) {
            navigate('/guidance/access?error=expired', { replace: true });
            return;
          } else {
            console.log('ℹ️ get-token non 200:', resp.status);
          }
        } catch (fnErr) {
          console.warn('⚠️ get-token failed, fallback to client query', fnErr);
        }

        // 2) Fallback: essayer via client Supabase (si des policies existent)
        console.log('🔍 Fallback: requête Supabase côté client');
        const { data: tokenRow, error } = await supabase
          .from('guidance_token')
          .select('token, expires_at')
          .eq('short_code', short)
          .maybeSingle();

        console.log('📊 Résultat de la requête:');
        console.log('  - Token row:', tokenRow);
        console.log('  - Error:', error);

        if (error) {
          console.error('❌ Erreur lors de la requête:', error);
          
          // Si c'est une erreur de permissions, essayer une approche alternative
          if (error.code === '42501' || error.message?.includes('permission')) {
            console.log('🔧 Erreur de permissions détectée, tentative alternative...');
            
            // Essayer d'utiliser une fonction Netlify pour récupérer le token
            try {
              const response = await fetch(`/.netlify/functions/get-token?shortCode=${short}`, {
                method: 'GET'
              });
              
              if (response.ok) {
                const tokenData = await response.json();
                console.log('✅ Token récupéré via fonction Netlify:', tokenData);
                
                if (tokenData.token) {
                  navigate(`/guidance/access?token=${tokenData.token}`, { replace: true });
                  return;
                }
              }
            } catch (netlifyError) {
              console.error('❌ Erreur fonction Netlify:', netlifyError);
            }
          }
          
          navigate('/guidance/access?error=notfound', { replace: true });
          return;
        }

        if (!tokenRow) {
          console.log('❌ Aucun token trouvé pour le short code:', short);
          
          // Essayer de récupérer plus d'informations sur ce short code
          try {
            const { data: allTokens } = await supabase
              .from('guidance_token')
              .select('short_code, created_at')
              .limit(10);
            
            console.log('🔍 Tokens récents dans la DB:', allTokens);
          } catch (debugError) {
            console.log('🔍 Impossible de récupérer les tokens récents:', debugError);
          }
          
          navigate('/guidance/access?error=notfound', { replace: true });
          return;
        }

        console.log('✅ Token trouvé:', tokenRow.token);
        console.log('📅 Expiration:', tokenRow.expires_at);

        // Vérifier l'expiration
        const now = new Date();
        const expiresAt = new Date(tokenRow.expires_at);
        
        console.log('⏰ Vérification de l\'expiration:');
        console.log('  - Maintenant:', now.toISOString());
        console.log('  - Expire le:', expiresAt.toISOString());
        console.log('  - Est expiré:', now > expiresAt);

        if (now > expiresAt) {
          console.log('❌ Token expiré');
          navigate('/guidance/access?error=expired', { replace: true });
          return;
        }

        // Vérifier que le token existe bien
        if (!tokenRow.token) {
          console.log('❌ Token vide ou invalide');
          navigate('/guidance/access?error=notfound', { replace: true });
          return;
        }

        // 2. Tracker l'ouverture du lien (optionnel, ne pas bloquer si ça échoue)
        try {
          const trackingUrl = `${import.meta.env.VITE_NETLIFY_URL || 'https://zodiakv2.netlify.app'}/.netlify/functions/track-sms?shortCode=${short}&token=${tokenRow.token}&action=open`;
          console.log('📊 URL de tracking d\'ouverture:', trackingUrl);
          
          // Créer une image invisible pour tracker l'ouverture
          const trackingImage = new Image();
          trackingImage.src = trackingUrl;
          trackingImage.style.display = 'none';
          document.body.appendChild(trackingImage);
          
          // Nettoyer après un délai
          setTimeout(() => {
            if (document.body.contains(trackingImage)) {
              document.body.removeChild(trackingImage);
            }
          }, 1000);

          console.log('📊 Tracking d\'ouverture envoyé');
        } catch (trackingError) {
          console.warn('⚠️ Erreur lors du tracking d\'ouverture:', trackingError);
          // Continuer même si le tracking échoue
        }

        // 3. Tracker le clic sur le lien (optionnel, ne pas bloquer si ça échoue)
        try {
          const clickTrackingUrl = `${import.meta.env.VITE_NETLIFY_URL || 'https://zodiakv2.netlify.app'}/.netlify/functions/track-sms?shortCode=${short}&token=${tokenRow.token}&action=click`;
          console.log('📊 URL de tracking de clic:', clickTrackingUrl);
          
          fetch(clickTrackingUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }).catch(error => {
            console.warn('⚠️ Erreur lors du tracking de clic:', error);
          });

          console.log('📊 Tracking de clic envoyé');
        } catch (trackingError) {
          console.warn('⚠️ Erreur lors du tracking de clic:', trackingError);
          // Continuer même si le tracking échoue
        }

        // 4. Rediriger vers la page de guidance
        const redirectUrl = `/guidance/access?token=${tokenRow.token}`;
        console.log('🔄 Redirection vers:', redirectUrl);
        navigate(redirectUrl, { replace: true });

      } catch (error) {
        console.error('❌ Erreur générale:', error);
        navigate('/guidance/access?error=notfound', { replace: true });
      }
    };

    // Délai court pour s'assurer que le composant est bien monté
    const timer = setTimeout(() => {
      fetchAndRedirect();
    }, 100);

    return () => clearTimeout(timer);
  }, [short, navigate]);

  return <LoadingScreen message="Redirection vers la guidance..." />;
} 