import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ButtonZodiak } from '../components/ButtonZodiak';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/register/complete');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cosmic-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full"
      >
        <div className="bg-cosmic-800 rounded-2xl shadow-xl border border-primary/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-cinzel text-primary mb-2">
              Inscription
            </h1>
            <p className="text-gray-300">
              Rejoignez l'aventure astrale
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-cosmic-700 border border-cosmic-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-cosmic-700 border border-cosmic-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                placeholder="Votre mot de passe"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-cosmic-700 border border-cosmic-600 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/50 transition-colors"
                placeholder="Confirmez votre mot de passe"
                required
                minLength={6}
              />
            </div>

            <ButtonZodiak
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary to-secondary text-cosmic-900 font-semibold py-3"
            >
              {loading ? 'Inscription...' : 'Créer un compte'}
            </ButtonZodiak>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Déjà un compte ?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary hover:text-secondary transition-colors font-medium"
              >
                Se connecter
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}