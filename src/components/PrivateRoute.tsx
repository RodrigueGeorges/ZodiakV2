import React from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { Navigate, useLocation } from 'react-router-dom';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { shouldRedirect, redirectTo } = useAuthRedirect();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900 text-white">
        Chargement...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location, 
          message: 'Votre session a expiré, veuillez vous reconnecter.' 
        }} 
        replace 
      />
    );
  }

  if (shouldRedirect) {
    return (
      <Navigate 
        to="/register/complete" 
        state={{ 
          from: location, 
          message: 'Merci de compléter votre profil.' 
        }} 
        replace 
      />
    );
  }

  return children;
}

export default PrivateRoute; 