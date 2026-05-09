import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, Check, Share2, Users } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import { buildReferralUrl } from '../lib/referral';
import { toast } from 'react-hot-toast';
import { track } from '../lib/analytics';

interface ReferralCardProps {
  userId: string;
  /** Code parrainage déjà connu (sinon on le va chercher en DB). */
  referralCode?: string | null;
  className?: string;
}

interface RefStats {
  referredCount: number;
  referredActiveCount: number;
  creditDays: number;
}

/**
 * Carte parrainage à afficher dans le profil :
 *   - Code unique copiable
 *   - Bouton de partage natif
 *   - Compteur de filleuls actifs et crédit cumulé
 */
export default function ReferralCard({
  userId,
  referralCode: codeProp,
  className,
}: ReferralCardProps) {
  const [code, setCode] = useState<string | null>(codeProp ?? null);
  const [stats, setStats] = useState<RefStats | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Si on n'a pas le code en prop, on le récupère
        if (!code) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('referral_code')
            .eq('id', userId)
            .maybeSingle();
          if (!cancelled && profile?.referral_code) {
            setCode(profile.referral_code);
          }
        }
        // Stats parrainage
        const { data: row } = await supabase
          .from('referral_stats')
          .select('referred_count, referred_active_count, referral_credit_days')
          .eq('user_id', userId)
          .maybeSingle();
        if (!cancelled && row) {
          setStats({
            referredCount: Number(row.referred_count ?? 0),
            referredActiveCount: Number(row.referred_active_count ?? 0),
            creditDays: Number(row.referral_credit_days ?? 0),
          });
        }
      } catch (e) {
        console.warn('[ReferralCard] fetch failed:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, code]);

  if (!code) {
    return (
      <Card variant="surface" className={className}>
        <div className="p-6 text-caption text-ivory-300">
          Ton code parrainage est en cours de génération. Recharge la page dans
          quelques secondes.
        </div>
      </Card>
    );
  }

  const url = buildReferralUrl(code);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Lien copié.');
      track('referral_link_copied');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Impossible de copier.');
    }
  };

  const share = async () => {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: 'Rejoins-moi sur Zodiak',
          text:
            'Une lecture personnalisée du ciel chaque matin sur WhatsApp/Instagram. Avec mon lien tu reçois 14 jours offerts.',
          url,
        });
        track('referral_link_shared');
      } else {
        copy();
      }
    } catch {
      /* annulé */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className={className}
    >
      <Card variant="elevated" className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/14 via-transparent to-magenta-500/12"
        />
        <div className="relative p-6 md:p-8">
          <div className="flex items-start gap-4 mb-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-aurora-500/20 ring-1 ring-aurora-400/40 flex items-center justify-center text-aurora-200">
              <Gift className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-1">
                Parrainage · gagnant-gagnant
              </p>
              <h3 className="font-cinzel text-h2 leading-tight">
                <span className="text-ivory-50">Invite, </span>
                <span className="text-gradient-aurora">gagnez ensemble.</span>
              </h3>
              <p className="mt-2 text-caption text-ivory-300 max-w-md">
                À chaque ami qui s'inscrit avec ton lien, vous recevez{' '}
                <span className="text-aurora-200 font-medium">14 jours premium</span>{' '}
                chacun.
              </p>
            </div>
          </div>

          {/* Code + bouton copier */}
          <div className="flex flex-col sm:flex-row gap-2 mb-5">
            <div className="flex-1 flex items-center justify-between gap-3 px-4 h-12 rounded-2xl bg-night-900/60 ring-1 ring-night-700/60 font-mono text-body text-ivory-50">
              <span className="truncate">{url}</span>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={copy}
              iconLeft={
                copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />
              }
            >
              {copied ? 'Copié' : 'Copier'}
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={share}
              iconLeft={<Share2 className="w-4 h-4" />}
            >
              Partager
            </Button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-3">
              <Stat
                icon={<Users className="w-3.5 h-3.5" />}
                label="Invités"
                value={stats.referredCount}
              />
              <Stat
                icon={<Check className="w-3.5 h-3.5" />}
                label="Actifs"
                value={stats.referredActiveCount}
                accent
              />
              <Stat
                icon={<Gift className="w-3.5 h-3.5" />}
                label="Jours gagnés"
                value={stats.creditDays}
                accent
              />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}
function Stat({ icon, label, value, accent }: StatProps) {
  return (
    <div className="rounded-2xl bg-night-900/50 ring-1 ring-night-700/50 px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5 text-aurora-300 mb-1">
        {icon}
        <span className="text-micro uppercase tracking-[0.18em]">{label}</span>
      </div>
      <p
        className={
          accent
            ? 'font-cinzel text-h2 text-gradient-aurora tabular-nums'
            : 'font-cinzel text-h2 text-ivory-50 tabular-nums'
        }
      >
        {value}
      </p>
    </div>
  );
}
