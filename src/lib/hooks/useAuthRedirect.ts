import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

export function useAuthRedirect() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading, profile, user } = useAuth();

  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isLoading) return;

    const currentPath = location.pathname;
    
    // Routes publiques qui ne nécessitent pas de redirection
    const publicRoutes = ['/', '/login', '/register', '/register/complete'];
    const isPublicRoute = publicRoutes.includes(currentPath);

    if (!isAuthenticated) {
      // Utilisateur non authentifié
      if (!isPublicRoute) {
        // Rediriger vers login si sur une route privée
        navigate('/login', { 
          replace: true,
          state: { 
            from: location,
            message: 'Veuillez vous connecter pour accéder à cette page.' 
          }
        });
      }
      return;
    }

    // Utilisateur authentifié
    if (!profile) {
      // Utilisateur authentifié mais pas de profil complet
      if (currentPath !== '/register/complete') {
        navigate('/register/complete', { 
          replace: true,
          state: { 
            from: location,
            message: 'Veuillez compléter votre profil pour continuer.' 
          }
        });
      }
      return;
    }

    // Utilisateur authentifié avec profil complet
    if (isPublicRoute) {
      // Rediriger vers le profil si sur une route publique
      navigate('/profile', { replace: true });
    }
  }, [isAuthenticated, isLoading, profile, user, navigate, location]);

  return {
    shouldRedirect: !isLoading && isAuthenticated && !profile,
    redirectTo: !isAuthenticated ? '/login' : !profile ? '/register/complete' : '/profile'
  };
}