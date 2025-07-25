import { useState } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { ButtonZodiak } from './ButtonZodiak';

export function LoginButton() {
  const { user, signOut } = useAuth();
  const { redirectTo } = useAuthRedirect();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut();
      redirectTo('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-300">
          Connecté
        </span>
        <ButtonZodiak
          onClick={handleSignOut}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700"
        >
          {isLoading ? 'Déconnexion...' : 'Se déconnecter'}
        </ButtonZodiak>
      </div>
    );
  }

  return (
    <ButtonZodiak
      onClick={() => redirectTo('/login')}
      className="bg-primary hover:bg-primary/90"
    >
      Se connecter
    </ButtonZodiak>
  );
}