import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import LoadingScreen from './LoadingScreen';

interface PrivateRouteProps {
  children: ReactNode;
}

/**
 * Garde de route :
 *  - en attente de session  → écran de chargement
 *  - non authentifié        → redirection vers /login (avec préservation de
 *                             l'URL d'origine pour retour post-connexion)
 *  - authentifié            → rend les enfants
 *
 * Bug fix : avant cette version, `!user` retournait LoadingScreen indéfiniment,
 * ce qui causait un "chargement infini" si on accédait directement à une route
 * protégée sans session. On redirige proprement maintenant.
 */
export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return <>{children}</>;
}
