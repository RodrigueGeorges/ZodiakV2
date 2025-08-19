import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoadingScreen from '../components/LoadingScreen';

export default function GuidanceShortRedirect() {
  const { short } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndRedirect = async () => {
      if (!short) {
        navigate('/guidance/access?error=notfound', { replace: true });
        return;
      }

      // 1. Récupérer le token et les informations de tracking
      const { data: tokenRow, error } = await supabase
        .from('guidance_token')
        .select('token, expires_at')
        .eq('short_code', short)
        .maybeSingle();

      if (error || !tokenRow) {
        navigate('/guidance/access?error=notfound', { replace: true });
        return;
      }

      if (new Date(tokenRow.expires_at) < new Date()) {
        navigate('/guidance/access?error=expired', { replace: true });
        return;
      }

      // 2. Tracker l'ouverture du lien
      try {
        const trackingUrl = `${import.meta.env.VITE_NETLIFY_URL || 'https://zodiakv2.netlify.app'}/.netlify/functions/track-sms?shortCode=${short}&token=${tokenRow.token}&action=open`;
        
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

      // 3. Tracker le clic sur le lien
      try {
        const clickTrackingUrl = `${import.meta.env.VITE_NETLIFY_URL || 'https://zodiakv2.netlify.app'}/.netlify/functions/track-sms?shortCode=${short}&token=${tokenRow.token}&action=click`;
        
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
      navigate(`/guidance/access?token=${tokenRow.token}`, { replace: true });
    };

    fetchAndRedirect();
  }, [short, navigate]);

  return <LoadingScreen message="Redirection vers la guidance..." />;
} 