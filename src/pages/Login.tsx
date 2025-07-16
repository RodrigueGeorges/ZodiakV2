import React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveCard from '../components/InteractiveCard';
import PhoneAuth from '../components/PhoneAuth';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import StarryBackground from '../components/StarryBackground';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';

export default function Login() {
  const navigate = useNavigate();
  const { isLoading, user } = useAuth();
  const { shouldRedirect } = useAuthRedirect();
  const [authMode, setAuthMode] = useState<'sms' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      console.log('Tentative de connexion avec:', email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        console.error('Erreur de connexion:', error);
        setError(error.message);
        return;
      }
      
      if (data.user) {
        console.log('Connexion réussie pour:', data.user.email);
        // La redirection est gérée par useAuthRedirect
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  // Affiche le loader uniquement si on attend la session ET qu'on ne sait pas encore si l'utilisateur existe
  if (isLoading && user === null) {
    return <div className="text-center text-white py-8">Chargement...</div>;
  }

  // Si l'utilisateur est authentifié, il sera redirigé automatiquement
  if (shouldRedirect) {
    return <div className="text-center text-white py-8">Redirection...</div>;
  }

  return (
    <div className="min-h-screen overflow-hidden relative">
      <StarryBackground />
      <div className="container mx-auto px-4 md:px-8 xl:px-12 2xl:px-24 py-8 md:py-12 lg:py-16">
        <div className="max-w-md mx-auto mt-16">
          <InteractiveCard className="p-6 md:p-8 xl:p-10 2xl:p-16">
            <div className="mb-8 text-center">
              <Logo />
              <h2 className="text-2xl font-cinzel font-bold mt-4 mb-2">
                Connexion
              </h2>
            </div>
            <div className="flex justify-center mb-4 gap-4">
              <button
                className={cn('px-3 py-1 rounded', authMode === 'sms' ? 'bg-gradient-to-r from-primary to-secondary text-cosmic-900' : 'bg-cosmic-900 text-primary border border-primary')}
                onClick={() => setAuthMode('sms')}
              >SMS</button>
              <button
                className={cn('px-3 py-1 rounded', authMode === 'email' ? 'bg-gradient-to-r from-primary to-secondary text-cosmic-900' : 'bg-cosmic-900 text-primary border border-primary')}
                onClick={() => setAuthMode('email')}
              >Email</button>
            </div>
            {authMode === 'sms' ? (
              <PhoneAuth onSuccess={() => navigate('/profile')} />
            ) : (
              <form onSubmit={handleEmailLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1" htmlFor="login-email">Email</label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="Votre email"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1" htmlFor="login-password">Mot de passe</label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    placeholder="Votre mot de passe"
                    required
                    autoComplete="current-password"
                  />
                </div>
                {error && <div className="text-primary text-sm mb-2" role="alert" aria-live="assertive">{error}</div>}
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-cosmic-900 font-semibold hover:opacity-90 focus:bg-secondary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none transition-colors"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
                <div className="text-center mt-2">
                  <button
                    type="button"
                    className="text-sm text-primary hover:text-secondary underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    onClick={() => {
                      if (email) {
                        supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/login`
                        }).then(() => {
                          alert('Email de réinitialisation envoyé !');
                        }).catch(err => {
                          console.error('Erreur envoi email:', err);
                        });
                      } else {
                        alert('Veuillez d\'abord entrer votre email');
                      }
                    }}
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              </form>
            )}
            <div className="mt-4 text-center">
              <span className="text-sm text-primary">Pas encore de compte ?{' '}
                <button type="button" className="underline text-primary" onClick={() => navigate('/register')}>Créer un compte</button>
              </span>
            </div>
          </InteractiveCard>
        </div>
      </div>
    </div>
  );
} 