import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { checkAdminAccess } from '../lib/config/admin';
import AuroraBackground from './ui/AuroraBackground';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import Logo from './Logo';
import LoadingScreen from './LoadingScreen';

interface AdminProtectionProps {
  children: React.ReactNode;
}

export default function AdminProtection({ children }: AdminProtectionProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        setLoading(true);
        const {
          data: { user: currentUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !currentUser) {
          setIsAuthorized(false);
          return;
        }
        setUser(currentUser);

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single();

        const authorized = checkAdminAccess(
          currentUser.email,
          currentUser.id,
          profile?.role
        );
        setIsAuthorized(authorized);

        if (!authorized) {
          setTimeout(() => navigate('/', { replace: true }), 3000);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification admin:', error);
        setIsAuthorized(false);
      } finally {
        setLoading(false);
      }
    };
    check();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/', { replace: true });
  };

  if (loading) {
    return <LoadingScreen message="Vérification des autorisations…" />;
  }

  if (isAuthorized === false) {
    return (
      <div className="page-container relative">
        <AuroraBackground variant="dim" />
        <div className="relative z-10 mx-auto max-w-lg px-4 py-16">
          <div className="flex justify-center mb-8">
            <Logo size="md" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card variant="elevated">
              <div className="p-8 text-center space-y-6">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-magenta-500/15 ring-1 ring-magenta-500/30 text-magenta-400">
                  <XCircle className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="font-cinzel text-h2 text-ivory-50 mb-2">
                    Accès refusé
                  </h1>
                  <p className="text-body text-ivory-300">
                    Tu n'as pas les autorisations pour accéder à cette page.
                  </p>
                </div>
                {user?.email && (
                  <p className="text-caption text-ivory-400">
                    Connecté en tant que{' '}
                    <span className="text-ivory-100">{user.email}</span>
                  </p>
                )}
                <p className="inline-flex items-center justify-center gap-2 text-micro uppercase tracking-[0.18em] text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />
                  Redirection automatique dans 3 s.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <Button
                    variant="primary"
                    onClick={() => navigate('/', { replace: true })}
                  >
                    Retour à l'accueil
                  </Button>
                  <Button variant="ghost" onClick={handleLogout}>
                    Se déconnecter
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
