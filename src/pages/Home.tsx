import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkle, Moon, Sun, Compass, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import PhoneAuth from '../components/PhoneAuth';
import { Logo } from '../components/Logo';
import StarryBackground from '../components/StarryBackground';
import InteractiveCard from '../components/InteractiveCard';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import CosmicLoader from '../components/CosmicLoader';

// HOME PAGE - DESIGN PREMIUM
// Optimisation technique uniquement, aucun changement visuel
export default function Home() {
  const { isLoading, user } = useAuth();
  const { shouldRedirect } = useAuthRedirect();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'sms' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Gestion de l'authentification email
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (isSignUp) {
        // Inscription
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/register/complete`
          }
        });
        if (error || !data.user) {
          setError(error?.message || "Erreur lors de l'inscription");
        } else {
          setInfo('Inscription réussie ! Vérifiez votre boîte mail pour confirmer votre adresse.');
          setIsSignUp(false);
          setEmail('');
          setPassword('');
        }
      } else {
        // Connexion
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        }
        // La redirection est gérée par useAuthRedirect
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur inattendue est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // Loader pendant la récupération de la session
  if (isLoading && user === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <CosmicLoader />
      </div>
    );
  }

  // Redirection automatique si l'utilisateur est authentifié
  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <CosmicLoader />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden relative">
      <StarryBackground />

      {/* LOGO + NOM EN HAUT À GAUCHE, SANS BARRE */}
      <div className="absolute top-2 left-2 sm:top-4 sm:left-4 md:top-8 md:left-8 z-30 flex items-center gap-2 sm:gap-4 md:gap-6 lg:gap-10 select-none max-w-[90vw] overflow-hidden">
        <Logo 
          size={typeof window !== 'undefined' && window.innerWidth < 640 ? 'sm' : (window.innerWidth < 1024 ? 'md' : 'lg')}
          className="drop-shadow-glow"
          aria-label="Logo Zodiak"
        />
        <span className="truncate text-xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-cinzel font-bold bg-gradient-to-r from-primary via-secondary to-primary text-transparent bg-clip-text" aria-label="Zodiak">
          Zodiak
        </span>
      </div>

      {/* TAGLINE CENTRÉE EN HAUT */}
      <div className="w-full flex justify-center pt-24 md:pt-28 xl:pt-32">
        <h1 className="text-center text-xl md:text-2xl xl:text-3xl font-cinzel font-semibold bg-gradient-to-r from-primary via-secondary to-primary text-transparent bg-clip-text drop-shadow-glow max-w-2xl mx-auto cosmic-glow">
          Votre guide cosmique quotidien
        </h1>
      </div>

      <div className="container mx-auto px-4 md:px-8 xl:px-12 2xl:px-24 py-8 md:py-12 lg:py-16">
        <div className="max-w-5xl xl:max-w-7xl 2xl:max-w-screen-xl mx-auto">
          <div className="text-center mb-8 md:mb-12 xl:mb-16">
            {/* BOUTON PRINCIPAL ACCESSIBLE */}
            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-cosmic-900 rounded-lg font-bold text-lg shadow-lg hover:opacity-90 transition relative flex items-center gap-2 mx-auto mb-8 z-20 no-rotate cosmic-btn-premium"
              onClick={() => setShowModal(true)}
              role="button"
              aria-label="Commencez votre voyage astral"
              tabIndex={0}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              <Sparkle className="w-6 h-6 text-primary" aria-hidden="true" />
              Commencez votre voyage astral
            </motion.button>

            {/* MODALE AVEC FORMULAIRE - ACCESSIBLE */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-cosmic-900 rounded-2xl shadow-2xl p-6 md:p-8 xl:p-10 2xl:p-16 max-w-md w-full relative border border-primary/20"
                >
                  {/* Bouton retour à l'accueil */}
                  <button
                    onClick={() => setShowModal(false)}
                    className="absolute top-3 left-3 text-primary hover:text-secondary text-lg font-bold"
                    aria-label="Retour à l'accueil"
                  >
                    ← Accueil
                  </button>
                  {/* Croix de fermeture */}
                  <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-primary hover:text-secondary text-2xl" aria-label="Fermer la modale">×</button>
                  <InteractiveCard className="p-6 md:p-8 xl:p-10 2xl:p-16">
                    <h2 className="text-xl md:text-2xl font-cinzel font-bold text-center mb-4 md:mb-6">
                      <span className="bg-gradient-to-r from-primary via-secondary to-primary text-transparent bg-clip-text">
                        {isSignUp ? 'Inscription' : 'Connexion'}
                      </span>
                    </h2>
                    <div className="flex justify-center mb-4 gap-4">
                      <button
                        className={cn('px-3 py-1 rounded', authMode === 'sms' ? 'bg-gradient-to-r from-primary to-secondary text-cosmic-900' : 'bg-cosmic-900 text-primary border border-primary')}
                        onClick={() => setAuthMode('sms')}
                        aria-label="Authentification par SMS"
                      >SMS</button>
                      <button
                        className={cn('px-3 py-1 rounded', authMode === 'email' ? 'bg-gradient-to-r from-primary to-secondary text-cosmic-900' : 'bg-cosmic-900 text-primary border border-primary')}
                        onClick={() => setAuthMode('email')}
                        aria-label="Authentification par Email"
                      >Email</button>
                    </div>
                    {authMode === 'sms' ? (
                      <PhoneAuth onSuccess={() => navigate('/profile')} />
                    ) : (
                      <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="email-input">Email</label>
                          <input
                            id="email-input"
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50"
                            placeholder="Votre email"
                            required
                            autoComplete="email"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1" htmlFor="password-input">Mot de passe</label>
                          <input
                            id="password-input"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50"
                            placeholder="Votre mot de passe"
                            required
                            autoComplete="current-password"
                          />
                        </div>
                        {/* Messages d'erreur/info accessibles */}
                        {error && <div className="text-red-400 text-sm mb-2" aria-live="polite">{error}</div>}
                        {info && <div className="text-green-400 text-sm mb-2" aria-live="polite">{info}</div>}
                        <motion.button
                          type="submit"
                          className="w-full py-2 rounded-lg bg-primary text-black font-semibold hover:bg-secondary transition-colors relative overflow-hidden"
                          whileTap={{ scale: 0.97 }}
                          animate={loading ? { boxShadow: '0 0 24px 8px #F5CBA7' } : {}}
                          disabled={loading}
                          aria-label={isSignUp ? 'Créer un compte' : 'Se connecter'}
                        >
                          {loading ? 'Chargement...' : (isSignUp ? 'Créer un compte' : 'Se connecter')}
                        </motion.button>
                        <div className="text-center mt-2">
                          {isSignUp ? (
                            <span className="text-sm text-gray-400">Déjà un compte ? <button type="button" className="underline text-primary" onClick={() => setIsSignUp(false)} aria-label="Se connecter">Se connecter</button></span>
                          ) : (
                            <span className="text-sm text-gray-400">Pas encore de compte ? <button type="button" className="underline text-primary" onClick={() => setIsSignUp(true)} aria-label="Créer un compte">Créer un compte</button></span>
                          )}
                        </div>
                      </form>
                    )}
                    <div className="mt-4 md:mt-6 text-center">
                      <p className="text-sm md:text-base text-primary">
                        Pas encore de compte ?{' '}
                        <Link 
                          to="/register" 
                          className="text-primary hover:text-secondary transition-colors"
                        >
                          Inscrivez-vous
                        </Link>
                      </p>
                    </div>
                  </InteractiveCard>
                </motion.div>
              </div>
            )}

            {/* BANDEAU ESSAI */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative mb-8 md:mb-12"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 blur-xl opacity-50" />
              <div className="relative bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full py-2 md:py-2 px-4 md:px-6 xl:px-10 2xl:px-14 inline-flex items-center gap-2 md:gap-3 border border-primary/20 shadow-2xl">
                <Sparkle className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" aria-hidden="true" />
                <span className="text-base md:text-lg xl:text-xl 2xl:text-2xl font-cinzel font-semibold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
                  1 mois d'essai gratuit
                </span>
                <Sparkle className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" aria-hidden="true" />
              </div>
            </motion.div>

            {/* GRILLE DES FONCTIONNALITÉS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8 xl:gap-12 2xl:gap-16">
              {[
                {
                  icon: <Sun className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />,
                  title: "Guidance Quotidienne",
                  description: "Recevez chaque jour un message personnalisé basé sur votre thème astral et les transits planétaires du moment, directement dans l’application ou par SMS."
                },
                {
                  icon: <Moon className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />,
                  title: "Thème Astral Détaillé",
                  description: "Accédez à l’analyse complète de votre carte du ciel : interprétation de vos planètes, ascendant, aspects majeurs, et résumé de votre signature astrale."
                },
                {
                  icon: <Compass className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />,
                  title: "Chat Astrologique Intelligent",
                  description: "Posez toutes vos questions à notre chatbot astrologique : guidance, conseils, explications sur votre thème ou sur les influences du jour, avec des réponses instantanées et personnalisées."
                },
                {
                  icon: <Clock className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />,
                  title: "Suivi & Notifications",
                  description: "Recevez des rappels, suivez l’historique de vos guidances et bénéficiez de notifications pour ne jamais manquer les moments clés ou les nouveaux messages."
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.5 }}
                >
                  <InteractiveCard
                    className="p-4 md:p-6 xl:p-10 2xl:p-14 h-full transition-transform duration-300 hover:scale-105 hover:shadow-cosmic hover:border-primary/40 relative group"
                  >
                    <div className="flex flex-col items-center text-center">
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4"
                      >
                        <div className="text-primary">{feature.icon}</div>
                      </motion.div>
                      <h3 className="text-lg md:text-xl font-cinzel font-semibold text-primary mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm md:text-base text-primary">{feature.description}</p>
                    </div>
                    <motion.div
                      className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <Sparkle className="w-5 h-5 text-primary animate-float" aria-hidden="true" />
                    </motion.div>
                  </InteractiveCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}