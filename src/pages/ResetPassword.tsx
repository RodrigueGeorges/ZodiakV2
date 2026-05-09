import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Eye, EyeOff, Check, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { cn } from '../lib/utils';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  // Supabase parse le hash et établit la session "recovery". On attend que ce
  // soit fait avant d'afficher le form, pour éviter les "Auth session missing".
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });
    // Cas où la session est déjà active au mount.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Mot de passe trop court (8 caractères minimum).");
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(error.message);
      } else {
        navigate('/guidance');
      }
    } catch {
      setError("Une erreur est survenue. Réessaie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Nouveau mot de passe"
      title="Reprends la main"
      subtitle="Choisis un mot de passe que toi seul connais. On chiffre et stocke en sécurité."
    >
      {!ready ? (
        <div className="flex items-center justify-center py-10 text-ivory-300 text-caption">
          <span className="inline-block w-2 h-2 rounded-full bg-aurora-400 animate-ping mr-2" />
          Vérification du lien…
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
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
              htmlFor="password"
              className="block text-caption text-ivory-300 mb-2"
            >
              Nouveau mot de passe
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ivory-400"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-cosmic !pl-9 !pr-11"
                placeholder="Au moins 8 caractères"
                autoFocus
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
            <PasswordStrengthMeter password={password} />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-caption text-ivory-300 mb-2"
            >
              Confirme
            </label>
            <div className="relative">
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={cn(
                  'input-cosmic !pr-10',
                  confirm && confirm !== password && 'border-magenta-500/40',
                )}
                placeholder="Répète ton mot de passe"
              />
              {confirm && confirm === password && (
                <Check
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400"
                  aria-label="Les mots de passe correspondent"
                />
              )}
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
          >
            Mettre à jour le mot de passe
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
