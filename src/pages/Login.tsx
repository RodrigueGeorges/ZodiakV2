import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import OAuthButtons from '../components/OAuthButtons';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        setError(
          error.message === 'Invalid login credentials'
            ? 'Email ou mot de passe incorrect.'
            : error.message,
        );
      } else {
        navigate('/guidance');
      }
    } catch {
      setError('Une erreur est survenue lors de la connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Bon retour"
      title="Reconnecte-toi aux étoiles"
      subtitle="Ta guidance t'attend, exactement où tu l'avais laissée."
      footer={
        <>
          Pas encore de compte ?{' '}
          <Link
            to="/register"
            className="text-aurora-300 hover:text-aurora-200 underline-offset-4 hover:underline"
          >
            Crée-le ici
          </Link>
        </>
      }
    >
      <OAuthButtons mode="login" className="mb-5" />

      <div className="relative my-8 flex items-center gap-4">
        <span className="flex-1 h-px bg-ivory-50/[0.10]" />
        <span className="eyebrow-ritual text-ivory-400/80 whitespace-nowrap">
          ou avec ton email
        </span>
        <span className="flex-1 h-px bg-ivory-50/[0.10]" />
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-magenta-500/30 bg-magenta-500/10 px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 text-magenta-400 flex-shrink-0 mt-0.5" />
            <p className="text-caption text-magenta-200">{error}</p>
          </motion.div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-caption text-ivory-300 mb-2"
          >
            Email
          </label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-400"
              aria-hidden="true"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-cosmic !pl-9"
              placeholder="toi@email.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="text-caption text-ivory-300"
            >
              Mot de passe
            </label>
            <Link
              to="/forgot-password"
              className="text-micro text-aurora-300 hover:text-aurora-200 underline-offset-4 hover:underline"
            >
              Oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-cosmic !pr-11"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Masquer' : 'Afficher'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory-400 hover:text-ivory-100 transition-colors p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300 rounded-md"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={loading}
        >
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  );
}
