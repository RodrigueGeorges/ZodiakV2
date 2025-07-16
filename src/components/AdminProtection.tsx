import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import StarryBackground from './StarryBackground';
import Logo from './Logo';
import InteractiveCard from './InteractiveCard';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { checkAdminAccess } from '../lib/config/admin';

interface AdminProtectionProps {
  children: React.ReactNode;
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccessHandler();
  }, []);

  const checkAdminAccessHandler = async () => {
    try {
      setLoading(true);

      // 1. Vérifier si l'utilisateur est connecté
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !currentUser) {
        console.log('❌ Utilisateur non connecté');
        setIsAuthorized(false);
        return;
      }

      setUser(currentUser);

      // 2. Vérifier le rôle dans le profil (si vous avez un champ role)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

      // 3. Vérifier l'accès admin avec la fonction centralisée
      const authorized = checkAdminAccess(
        currentUser.email,
        currentUser.id,
        profile?.role
      );

      console.log('🔐 Vérification admin:', {
        email: currentUser.email,
        userId: currentUser.id,
        role: profile?.role,
        authorized
      });

      setIsAuthorized(authorized);

      if (!authorized) {
        // Rediriger vers la page d'accueil après un délai
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }

    } catch (error) {
      console.error('❌ Erreur lors de la vérification admin:', error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  // Écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-cosmic-900 flex items-center justify-center">
        <StarryBackground />
        <div className="text-center">
          <Logo />
          <div className="mt-4 w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-400">Vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  // Accès refusé
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-cosmic-900 relative">
        <StarryBackground />
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mb-8">
                <Logo />
              </div>
              
              <InteractiveCard className="p-8">
                <div className="flex flex-col items-center space-y-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Lock className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div>
                    <h1 className="text-2xl font-cinzel font-bold mb-2 text-primary">
                      Accès Refusé
                    </h1>
                    <p className="text-primary mb-4">
                      Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
                    </p>
                    
                    {user && (
                      <div className="bg-primary/10 rounded-lg p-4 mb-4">
                        <p className="text-sm text-primary">
                          Connecté en tant que : <span className="font-medium">{user.email}</span>
                        </p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center space-x-2 text-primary mb-4">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm">Redirection automatique dans 3 secondes...</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={() => navigate('/', { replace: true })}
                      className={cn(
                        'px-6 py-2 rounded-lg transition-colors',
                        'bg-primary text-gray-900 hover:bg-primary/90'
                      )}
                    >
                      Retour à l'accueil
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className={cn(
                        'px-6 py-2 rounded-lg transition-colors',
                        'bg-gray-600 text-white hover:bg-gray-700'
                      )}
                    >
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </InteractiveCard>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Accès autorisé - afficher le contenu admin
  return (
    <div className="admin-protected">
      {children}
    </div>
  );
} 