import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { useDocumentSeo } from '../lib/documentSeo';

/**
 * GuidanceShortRedirect — résolveur de short codes (ex: /g/abc123).
 *
 * Logique :
 *   1. Appelle la fonction Netlify `get-token` (source de vérité, bypass RLS).
 *   2. Redirige vers `/guidance/access?token=…` avec le token long.
 *   3. Tracke l'ouverture via `track-guidance-open` (best effort, pas bloquant).
 *
 * Côté UI : juste un splash de chargement aurora — l'utilisateur ne reste
 * jamais ici plus de 300ms en pratique.
 */
export default function GuidanceShortRedirect() {
  const { short } = useParams();
  const navigate = useNavigate();

  useDocumentSeo({
    title: 'Ouverture de ta guidance · Zodiak Astro',
    description:
      'Redirection sécurisée vers une guidance astrale du jour partagée sur Zodiak Astro — même service que sur WhatsApp ou Instagram.',
  });

  useEffect(() => {
    const run = async () => {
      if (!short) {
        navigate('/guidance/access?error=notfound', { replace: true });
        return;
      }

      try {
        const resp = await fetch(
          `/.netlify/functions/get-token?shortCode=${encodeURIComponent(short)}`,
          { method: 'GET' }
        );
        if (resp.status === 200) {
          const payload = await resp.json();
          if (payload?.token) {
            // Tracking best-effort
            try {
              const url = `/.netlify/functions/track-guidance-open?shortCode=${encodeURIComponent(
                short
              )}&token=${encodeURIComponent(payload.token)}&action=open`;
              const img = new Image();
              img.src = url;
              img.style.display = 'none';
              document.body.appendChild(img);
              setTimeout(() => {
                if (document.body.contains(img)) document.body.removeChild(img);
              }, 1000);
            } catch {
              /* ignore */
            }
            navigate(`/guidance/access?token=${payload.token}`, {
              replace: true,
            });
            return;
          }
        }
        if (resp.status === 410) {
          navigate('/guidance/access?error=expired', { replace: true });
          return;
        }
        navigate('/guidance/access?error=notfound', { replace: true });
      } catch {
        navigate('/guidance/access?error=notfound', { replace: true });
      }
    };

    const t = setTimeout(run, 80);
    return () => clearTimeout(t);
  }, [short, navigate]);

  return <LoadingScreen message="Connexion à ta guidance…" />;
}
