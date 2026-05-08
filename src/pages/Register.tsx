import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import { Button } from '../components/ui/Button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError('Choisis un mot de passe d\'au moins 8 caractères.');
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate('/register/complete');
      }
    } catch {
      setError("Une erreur est survenue lors de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Crée ton compte"
      title="Ouvre ta carte du ciel"
      subtitle="Quelques secondes, et ton voyage commence."
      footer={
        <>
          Déjà un compte ?{' '}
          <Link
            to="/login"
            className="text-aurora-300 hover:text-aurora-200 underline-offset-4 hover:underline"
          >
            Connecte-toi
          </Link>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-xl border border-magenta-500/30 bg-magenta-500/8 px-4 py-3"
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
          <label
            htmlFor="password"
            className="block text-caption text-ivory-300 mb-2"
          >
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-cosmic !pr-11"
              placeholder="Au moins 8 caractères"
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

        <div>
          <label
            htmlFor="confirm"
            className="block text-caption text-ivory-300 mb-2"
          >
            Confirme le mot de passe
          </label>
          <input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input-cosmic"
            placeholder="Répète ton mot de passe"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={loading}
        >
          Créer mon compte
        </Button>

        <div className="flex items-center gap-2 pt-2 text-micro text-ivory-400">
          <ShieldCheck className="w-3.5 h-3.5 text-aurora-300" aria-hidden="true" />
          <span>1 mois d'essai · Sans engagement</span>
        </div>
      </form>
    </AuthLayout>
  );
}
