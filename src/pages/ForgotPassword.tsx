import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Mail, MailCheck, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import { Button } from '../components/ui/Button';
import { useDocumentSeo } from '../lib/documentSeo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useDocumentSeo({
    title: sent
      ? 'Email envoyé · Zodiak — mot de passe'
      : 'Mot de passe oublié · Zodiak',
    description: sent
      ? 'Vérifie ta boîte mail : lien sécurisé pour réinitialiser ton accès à Zodiak et ta guidance personnalisée.'
      : 'Réinitialiser ton mot de passe pour retrouver ton compte Zodiak — horoscope personnalisé et chat astral.',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setError(error.message);
      } else {
        setSent(true);
      }
    } catch {
      setError('Une erreur est survenue. Réessaie.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        eyebrow="Email envoyé"
        title="Vérifie ta boîte de réception"
        subtitle="Si un compte existe pour cette adresse, tu vas recevoir un lien sécurisé pour réinitialiser ton mot de passe."
        footer={
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-aurora-300 hover:text-aurora-200 underline-offset-4 hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            Retour à la connexion
          </Link>
        }
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="flex flex-col items-center text-center py-8"
        >
          <div className="w-20 h-20 rounded-full bg-aurora-500/15 border border-aurora-500/30 flex items-center justify-center mb-4">
            <MailCheck className="w-9 h-9 text-aurora-300" aria-hidden="true" />
          </div>
          <p className="text-body text-ivory-200 max-w-sm">
            Le lien expire dans 1 heure. Pense à vérifier ton dossier{' '}
            <span className="text-ivory-50 font-medium">spam</span> si tu ne le
            trouves pas.
          </p>
          <Button
            variant="ghost"
            size="md"
            className="mt-6"
            onClick={() => {
              setSent(false);
              setEmail('');
            }}
          >
            Renvoyer le lien
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Mot de passe oublié"
      title="Pas de panique, on le retrouve"
      subtitle="Indique ton email, on t'envoie un lien sécurisé pour en créer un nouveau."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-aurora-300 hover:text-aurora-200 underline-offset-4 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Retour à la connexion
        </Link>
      }
    >
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
            htmlFor="email"
            className="block text-caption text-ivory-300 mb-2"
          >
            Email du compte
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
              autoFocus
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          loading={loading}
        >
          Envoyer le lien
        </Button>
      </form>
    </AuthLayout>
  );
}
