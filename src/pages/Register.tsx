import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InteractiveCard from '../components/InteractiveCard';
import PhoneAuth from '../components/PhoneAuth';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import StarryBackground from '../components/StarryBackground';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';

export default function Register() {
  const navigate = useNavigate();
  const { isLoading } = useAuth();
  const { shouldRedirect } = useAuthRedirect();
  const [authMode, setAuthMode] = useState<'sms' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailInfo, setEmailInfo] = useState<string | null>(null);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailInfo(null);
    try {
      console.log('Tentative d\'inscription avec:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/register/complete`
        }
      });
      
      if (error) {
        console.error('Erreur d\'inscription:', error);
        setEmailError(error.message);
        return;
      }
      
      if (data.user) {
        console.log('Inscription réussie pour:', data.user.email);
        setEmailInfo('Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.');
        setEmail('');
        setPassword('');
        navigate('/register/confirmation');
      } else {
        setEmailError("Erreur lors de l'inscription - aucun utilisateur créé");
      }
    } catch (error) {
      console.error('Erreur inattendue lors de l\'inscription:', error);
      setEmailError(error instanceof Error ? error.message : 'Erreur lors de l\'inscription');
    }
  };

  if (isLoading) {
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
                Inscription
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
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50"
                    placeholder="Votre email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50"
                    placeholder="Votre mot de passe"
                    required
                  />
                </div>
                {emailError && <div className="text-primary text-sm mb-2">{emailError}</div>}
                {emailInfo && <div className="text-primary text-sm mb-2">{emailInfo}</div>}
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-cosmic-900 font-semibold hover:opacity-90 transition-colors"
                >
                  Créer un compte
                </button>
              </form>
            )}
            <div className="mt-4 text-center">
              <span className="text-sm text-primary">Déjà un compte ?{' '}
                <button type="button" className="underline text-primary" onClick={() => navigate('/login')}>Se connecter</button>
              </span>
            </div>
          </InteractiveCard>
        </div>
      </div>
    </div>
  );
}