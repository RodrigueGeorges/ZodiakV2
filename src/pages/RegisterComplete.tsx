import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { StorageService } from '../lib/storage';
import { AstrologyService } from '../lib/astrology';
import AuthLayout from '../components/AuthLayout';
import LoadingScreen from '../components/LoadingScreen';
import { Button } from '../components/ui/Button';
import NatalRevealSplash from '../components/NatalRevealSplash';
import BirthPlaceInput from '../components/BirthPlaceInput';
import OnboardingStepper from '../components/OnboardingStepper';
import { track } from '../lib/analytics';
import { vibrate } from '../lib/haptics';
import { cn } from '../lib/utils';
import { getStoredReferral, clearReferral } from '../lib/referral';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { useDocumentSeo } from '../lib/documentSeo';

interface RevealData {
  firstName: string;
  sunSign?: string;
  moonSign?: string;
  ascSign?: string;
}

const TRIAL_DAYS = 7;
const REFERRED_BONUS_DAYS = 14;

/**
 * Récupère le nom le plus probable depuis les metadata d'un user OAuth
 * (Google, Apple, Facebook). Retourne `''` si rien n'est exploitable.
 */
function pickOAuthName(user: SupabaseUser | null): string {
  if (!user?.user_metadata) return '';
  const m = user.user_metadata as Record<string, unknown>;
  const candidates = [
    m.full_name,
    m.name,
    m.given_name,
    m.first_name,
    m.preferred_username,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      // On ne garde que la première partie (prénom uniquement, pas nom complet)
      return c.trim().split(/\s+/)[0];
    }
  }
  return '';
}

export default function RegisterComplete() {
  useDocumentSeo({
    title: 'Thème natal · étape 2 — Zodiak',
    description:
      'Saisie de ta naissance pour calculer ton thème natal et recevoir ton horoscope personnalisé chaque matin sur WhatsApp ou Instagram.',
  });

  const navigate = useNavigate();
  const { user } = useAuth();
  useAuthRedirect();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const [unknownTime, setUnknownTime] = useState(false);
  const [birthPlaceLabel, setBirthPlaceLabel] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    birth_time: '',
    birth_place: '', // format "lat,lng"
  });

  useEffect(() => {
    const load = async () => {
      try {
        const saved = StorageService.getFormData();
        // Pre-fill OAuth : si l'utilisateur arrive de Google/Apple, on a son
        // nom dans `user.user_metadata`. On l'utilise pour gagner une étape.
        const oauthName = pickOAuthName(user);

        if (saved) {
          setFormData((prev) => ({
            ...prev,
            name: saved.name || oauthName || '',
            birth_date: saved.birth_date || '',
            birth_time: saved.birth_time || '',
            birth_place: saved.birth_place || '',
          }));
          if (saved.birth_place_label) {
            setBirthPlaceLabel(saved.birth_place_label);
          }
        } else if (oauthName) {
          setFormData((prev) => ({ ...prev, name: oauthName }));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  // Validation
  const canSubmit =
    formData.name.trim().length > 0 &&
    formData.birth_date.length > 0 &&
    formData.birth_place.length > 0 &&
    (unknownTime || formData.birth_time.length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("Tu n'es pas connecté·e.");
      return;
    }
    if (!canSubmit) {
      setError('Complète tous les champs requis.');
      return;
    }

    setSaving(true);
    setError(null);

    // Si l'utilisateur ne connaît pas son heure, on calcule à 12:00
    // (mode solaire) — l'ascendant ne sera pas fiable mais le reste l'est.
    const effectiveTime = unknownTime ? '12:00' : formData.birth_time;

    try {
      const natalChart = await AstrologyService.calculateNatalChart({
        date_of_birth: formData.birth_date,
        time_of_birth: effectiveTime,
        location: formData.birth_place,
      });

      // Si l'utilisateur arrive d'un lien parrainage (/r/CODE), on lui
      // accorde la période d'essai bonus et on lie son profil au parrain.
      const referral = getStoredReferral();
      const isReferred = Boolean(referral?.inviterId);
      const trialDays = isReferred ? REFERRED_BONUS_DAYS : TRIAL_DAYS;

      await StorageService.saveProfile({
        id: user.id,
        name: formData.name.trim(),
        birth_date: formData.birth_date,
        birth_time: effectiveTime,
        birth_place: formData.birth_place,
        natal_chart: natalChart,
        subscription_status: 'trial',
        trial_ends_at: new Date(
          Date.now() + trialDays * 24 * 60 * 60 * 1000,
        ).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // On enregistre le lien parrain → filleul côté DB.
      // Le crédit du parrain (jours bonus) est attribué côté serveur
      // via une fonction Netlify qui surveille les nouveaux profils.
      if (isReferred && referral) {
        try {
          await supabase
            .from('profiles')
            .update({ referred_by: referral.inviterId })
            .eq('id', user.id);
          track('referral_signup_completed', {
            inviterId: referral.inviterId,
            code: referral.code,
          });
        } catch (e) {
          console.warn('[referral] linking failed:', e);
        }
        clearReferral();
      }

      StorageService.clearFormData();
      track('onboarding_completed', {
        has_birth_time: !unknownTime,
        used_solar_mode: unknownTime,
      });
      vibrate('success');

      type ChartShape = {
        sun?: { sign?: string };
        moon?: { sign?: string };
        ascendant?: { sign?: string };
        sun_sign?: string;
        moon_sign?: string;
        ascendant_sign?: string;
      };
      const chart = natalChart as unknown as ChartShape;
      setReveal({
        firstName: formData.name.split(' ')[0] || 'voyageur',
        sunSign: chart.sun?.sign ?? chart.sun_sign,
        moonSign: chart.moon?.sign ?? chart.moon_sign,
        ascSign: unknownTime
          ? undefined
          : chart.ascendant?.sign ?? chart.ascendant_sign,
      });
      return;
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors du calcul de ta carte. Réessaie.',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Préparation…" />;
  if (!user) {
    navigate('/login', { replace: true });
    return <LoadingScreen message="Redirection…" />;
  }

  if (reveal) {
    return (
      <NatalRevealSplash
        firstName={reveal.firstName}
        sunSign={reveal.sunSign}
        moonSign={reveal.moonSign}
        ascSign={reveal.ascSign}
        onDone={() => navigate('/guidance', { replace: true })}
      />
    );
  }

  return (
    <AuthLayout
      eyebrow="Étape 2 sur 2"
      title="Trace ton ciel de naissance"
      subtitle="Trois coordonnées suffisent pour ouvrir ton thème natal : prénom, moment, lieu. Ensuite Zodiak personnalise chaque guidance."
    >
      <OnboardingStepper currentStep={2} totalSteps={2} className="mb-7" />

      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          ['01', 'Identité'],
          ['02', 'Naissance'],
          ['03', 'Carte'],
        ].map(([index, label]) => (
          <div
            key={index}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-center"
          >
            <div className="font-mono text-[10px] tracking-[0.22em] text-aurora-300">{index}</div>
            <div className="mt-1 text-micro text-ivory-300 normal-case tracking-normal">{label}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-magenta-500/30 bg-magenta-500/10 px-4 py-3"
          >
            <AlertCircle className="w-4 h-4 text-magenta-400 flex-shrink-0 mt-0.5" />
            <p className="text-caption text-magenta-200">{error}</p>
          </motion.div>
        )}

        <FieldGroup
          label="Prénom"
          icon={<User className="w-4 h-4 text-aurora-300" />}
          input={
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-cosmic"
              placeholder="Ex : Camille"
              autoComplete="given-name"
            />
          }
        />

        <FieldGroup
          label="Date de naissance"
          icon={<Calendar className="w-4 h-4 text-aurora-300" />}
          input={
            <input
              type="date"
              required
              max={new Date().toISOString().split('T')[0]}
              value={formData.birth_date}
              onChange={(e) =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
              className="input-cosmic"
              autoComplete="bday"
            />
          }
        />

        <div>
          <label
            htmlFor="birth-time"
            className="flex items-center gap-2 text-caption text-ivory-300 mb-2"
          >
            <Clock className="w-4 h-4 text-aurora-300" />
            Heure de naissance
            {!unknownTime && (
              <span className="text-micro text-ivory-400">(au mieux possible)</span>
            )}
          </label>
          <input
            id="birth-time"
            type="time"
            disabled={unknownTime}
            required={!unknownTime}
            value={formData.birth_time}
            onChange={(e) =>
              setFormData({ ...formData, birth_time: e.target.value })
            }
            className={cn(
              'input-cosmic',
              unknownTime && 'opacity-40 cursor-not-allowed',
            )}
          />
          <button
            type="button"
            onClick={() => {
              setUnknownTime((v) => !v);
              if (!unknownTime) {
                setFormData((d) => ({ ...d, birth_time: '' }));
              }
            }}
            className={cn(
              'mt-2.5 flex items-center gap-2 text-micro text-ivory-300 hover:text-aurora-200 transition-colors',
              unknownTime && 'text-aurora-300',
            )}
          >
            <span
              className={cn(
                'w-4 h-4 rounded border flex items-center justify-center transition',
                unknownTime
                  ? 'border-aurora-400 bg-aurora-500/20'
                  : 'border-ivory-50/30',
              )}
              aria-hidden="true"
            >
              {unknownTime && <Check className="w-3 h-3 text-aurora-200" />}
            </span>
            Je ne connais pas mon heure
          </button>
          {unknownTime && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-start gap-1.5 text-micro text-ivory-300 leading-relaxed"
            >
              <Sparkles className="w-3.5 h-3.5 text-aurora-300 flex-shrink-0 mt-0.5" />
              <span>
                On calcule un thème solaire fiable (signes, planètes, transits).
                L'ascendant et les maisons resteront approximatifs — tu pourras
                préciser plus tard.
              </span>
            </motion.p>
          )}
        </div>

        <div>
          <label
            htmlFor="birth-place"
            className="flex items-center gap-2 text-caption text-ivory-300 mb-2"
          >
            Lieu de naissance
          </label>
          <BirthPlaceInput
            id="birth-place"
            value={formData.birth_place}
            initialLabel={birthPlaceLabel}
            onChange={(latLng, label) => {
              setFormData((d) => ({ ...d, birth_place: latLng }));
              setBirthPlaceLabel(label);
            }}
            required
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/')}
            fullWidth
          >
            Retour
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            disabled={!canSubmit || saving}
            loading={saving}
            iconLeft={!saving ? <Sparkles className="w-4 h-4" /> : undefined}
          >
            Calculer ma carte
          </Button>
        </div>

        <p className="pt-2 text-micro text-ivory-400 text-center">
          Tes données sont chiffrées et hébergées en Europe. Tu peux tout
          supprimer en 1 clic depuis ton profil.
        </p>
      </form>
    </AuthLayout>
  );
}

interface FieldGroupProps {
  label: string;
  icon?: React.ReactNode;
  help?: string;
  input: React.ReactNode;
}
function FieldGroup({ label, icon, help, input }: FieldGroupProps) {
  return (
    <div>
      <label className="flex items-center gap-2 text-caption text-ivory-300 mb-2">
        {icon}
        {label}
      </label>
      {input}
      {help && <p className="mt-1.5 text-micro text-ivory-400">{help}</p>}
    </div>
  );
}
