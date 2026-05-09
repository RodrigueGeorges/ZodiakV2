import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

type Provider = 'google' | 'apple';

interface OAuthButtonsProps {
  /** "register" → label "S'inscrire avec X" / "login" → "Continuer avec X" */
  mode?: 'register' | 'login';
  /** Liste des providers à afficher (par défaut Google + Apple). */
  providers?: Provider[];
  className?: string;
}

/**
 * Boutons OAuth premium pour authentification rapide.
 *
 * Important : ces providers doivent être activés côté Supabase Dashboard
 *   Authentication → Providers → Google / Apple → Enable
 * Avec les credentials Google Cloud Console / Apple Developer respectifs.
 *
 * Côté code : `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })`
 * suffit. Supabase gère le callback et redirige vers `redirectTo` après auth.
 */
export default function OAuthButtons({
  mode = 'login',
  providers = ['google', 'apple'],
  className,
}: OAuthButtonsProps) {
  const [loading, setLoading] = useState<Provider | null>(null);

  const handleOAuth = async (provider: Provider) => {
    setLoading(provider);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/guidance`,
        },
      });
      if (error) {
        console.error(`OAuth ${provider} error:`, error);
        setLoading(null);
      }
      // Sinon : redirection automatique vers le provider
    } catch (err) {
      console.error(`OAuth ${provider} crashed:`, err);
      setLoading(null);
    }
  };

  const verb = mode === 'register' ? "S'inscrire avec" : 'Continuer avec';

  return (
    <div className={cn('space-y-2.5', className)}>
      {providers.includes('google') && (
        <OAuthButton
          loading={loading === 'google'}
          onClick={() => handleOAuth('google')}
          icon={<GoogleIcon />}
          label={`${verb} Google`}
        />
      )}
      {providers.includes('apple') && (
        <OAuthButton
          loading={loading === 'apple'}
          onClick={() => handleOAuth('apple')}
          icon={<AppleIcon />}
          label={`${verb} Apple`}
        />
      )}
    </div>
  );
}

interface OAuthButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  loading?: boolean;
}
function OAuthButton({ onClick, icon, label, loading }: OAuthButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full inline-flex items-center justify-center gap-3 h-12 px-6 rounded-full',
        'border border-ivory-50/15 bg-night-900/40 backdrop-blur-md',
        'text-body text-ivory-50 font-medium',
        'hover:bg-night-800/60 hover:border-ivory-50/25 transition-all',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300 focus-visible:ring-offset-2 focus-visible:ring-offset-night-950',
        'disabled:opacity-60 disabled:cursor-wait',
      )}
    >
      <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          icon
        )}
      </span>
      <span>{label}</span>
    </motion.button>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
