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
      navigate(`/guidance/access?token=${tokenRow.token}`, { replace: true });
    };
    fetchAndRedirect();
  }, [short, navigate]);

  return <LoadingScreen message="Redirection vers la guidance..." />;
} 