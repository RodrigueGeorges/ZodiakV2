import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import LoadingScreen from './LoadingScreen';

interface PrivateRouteProps {
  children: ReactNode;
  /** Si true (default), redirige vers /register/complete quand le profil
   *  n'a pas encore les données natales (cas OAuth ou inscription interrompue). */
  requireCompleteProfile?: boolean;
}

/**
 * Garde de route :
 *  - en attente de session  → écran de chargement
 *  - non authentifié        → redirection vers /login (avec préservation de
 *                             l'URL d'origine pour retour post-connexion)
 *  - authentifié sans profil natal → /register/complete (cas OAuth)
 *  - authentifié avec profil       → rend les enfants
 */
export default function PrivateRoute({
  children,
  requireCompleteProfile = true,
}: PrivateRouteProps) {
  const { user, profile, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  // Profil incomplet → finalisation requise (cas OAuth Google/Apple ou abandon
  // de l'étape 2 lors d'un signup classique). On évite la boucle en
  // n'appliquant cette règle qu'aux routes qui le demandent.
  if (requireCompleteProfile) {
    const profileComplete =
      Boolean(profile?.birth_date) && Boolean(profile?.birth_place);
    if (!profileComplete && location.pathname !== '/register/complete') {
      return <Navigate to="/register/complete" replace />;
    }
  }

  return <>{children}</>;
}
