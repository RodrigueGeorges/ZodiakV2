import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ButtonZodiak } from '../components/ButtonZodiak';
import { motion } from 'framer-motion';
import { AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/profile');
      }
    } catch (error) {
      setError('Une erreur est survenue lors de la connexion.');
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
              Connexion
            </h1>
            <p className="text-gray-300">
              Accédez à votre guidance astrale personnalisée
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

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-cosmic-700 border border-cosmic-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-colors"
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-cosmic-700 border border-cosmic-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-300 focus:ring-2 focus:ring-blue-300/50 transition-colors pr-12"
                  placeholder="Votre mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <ButtonZodiak
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-300 to-cyan-300 text-cosmic-900 font-semibold py-3"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </ButtonZodiak>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Pas encore de compte ?{' '}
              <button
                onClick={() => navigate('/register')}
                className="text-blue-300 hover:text-blue-200 transition-colors font-medium"
              >
                Créer un compte
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 