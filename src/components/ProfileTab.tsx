import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  User,
  CreditCard,
  LogOut,
  Pencil,
  Check,
  X,
  ShieldCheck,
  Bell,
  BellOff,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import type { Profile } from '../lib/types/supabase';
import { useAuth } from '../lib/hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import DailyGuidanceChannel from './DailyGuidanceChannel';
import { usePushNotifications } from '../lib/hooks/usePushNotifications';
import { usePremium } from '../lib/hooks/usePremium';
import { vibrate } from '../lib/haptics';
import { track } from '../lib/analytics';

interface ProfileTabProps {
  profile: Profile;
  onLogout: () => void;
  /** Affiche les infos liées au thème natal (utilisé sur la page Natal). */
  showNatalInfo?: boolean;
}

function getInitials(name?: string | null) {
  if (!name) return 'Z';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfileTab({
  profile,
  onLogout,
}: ProfileTabProps) {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const push = usePushNotifications();
  const { isPremium, plan, trialDaysLeft } = usePremium();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name ?? '',
    phone: profile.phone ?? '',
    birth_date: profile.birth_date ?? '',
    birth_time: profile.birth_time ?? '',
    birth_place: profile.birth_place ?? '',
  });

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        name: formData.name,
        phone: formData.phone,
        birth_date: formData.birth_date,
        birth_time: formData.birth_time,
        birth_place: formData.birth_place,
      });
      if (error) throw error;
      await refreshProfile();
      toast.success('Profil mis à jour.');
      setEditMode(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erreur lors de la mise à jour.'
      );
    } finally {
      setSaving(false);
    }
  };

  const trialEndsAt = profile.trial_ends_at
    ? new Date(profile.trial_ends_at)
    : null;
  const daysUntilTrialEnd = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="space-y-8">
      {/* Bandeau confidentialité */}
      <div className="flex items-center gap-3 rounded-2xl border border-aurora-500/20 bg-aurora-500/5 px-4 py-3 text-caption text-ivory-200">
        <ShieldCheck className="w-4 h-4 text-aurora-300 shrink-0" aria-hidden="true" />
        <span>
          Tes données de naissance sont privées. Aucun partage, aucune revente.
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Colonne gauche — infos personnelles */}
        <div className="md:col-span-2">
          <Card variant="elevated" className="relative overflow-hidden">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/10 via-transparent to-magenta-500/5"
            />
            <div className="relative p-6">
              {/* Header carte */}
              <div className="flex items-start justify-between mb-6 gap-3">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-aurora-400 via-magenta-500 to-amber-400 flex items-center justify-center text-night-950 font-cinzel font-bold text-h3 shadow-glow-aurora">
                      {getInitials(profile.name)}
                    </div>
                  </div>
                  <div>
                    <p className="text-micro uppercase tracking-[0.18em] text-aurora-300">
                      Profil
                    </p>
                    <h3 className="font-cinzel text-h3 text-ivory-50">
                      {profile.name || 'Voyageur·euse'}
                    </h3>
                    <p className="text-caption text-ivory-400">
                      Membre depuis{' '}
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString(
                            'fr-FR',
                            { month: 'long', year: 'numeric' }
                          )
                        : '—'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditMode((v) => !v)}
                  aria-label={editMode ? 'Annuler' : 'Modifier le profil'}
                  className="p-2 rounded-full bg-ivory-50/[0.06] hover:bg-ivory-50/[0.12] text-ivory-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-aurora-300"
                >
                  {editMode ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Affichage / édition */}
              {!editMode ? (
                <dl className="space-y-3">
                  <Row
                    label="Prénom"
                    value={profile.name || 'Non renseigné'}
                  />
                  <Row
                    label="Téléphone"
                    value={profile.phone || 'Non renseigné'}
                  />
                  <Row
                    label="Date de naissance"
                    value={
                      profile.birth_date
                        ? new Date(profile.birth_date).toLocaleDateString(
                            'fr-FR'
                          )
                        : 'Non renseignée'
                    }
                  />
                  <Row
                    label="Lieu de naissance"
                    value={profile.birth_place || 'Non renseigné'}
                  />
                </dl>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                  className="space-y-3"
                >
                  <FieldRow
                    label="Prénom"
                    htmlFor="name"
                    input={
                      <input
                        id="name"
                        type="text"
                        className="input-cosmic"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    }
                  />
                  <FieldRow
                    label="Téléphone"
                    htmlFor="phone"
                    input={
                      <input
                        id="phone"
                        type="tel"
                        className="input-cosmic"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    }
                  />
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditMode(false)}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={saving}
                      iconLeft={!saving ? <Check className="w-4 h-4" /> : undefined}
                    >
                      Sauvegarder
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </Card>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">
          {/* Abonnement */}
          <Card variant="surface">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <CreditCard
                  className="w-5 h-5 text-aurora-300"
                  aria-hidden="true"
                />
                <h3 className="font-cinzel text-h3 text-ivory-50">Abonnement</h3>
              </div>
              <p className="text-caption text-ivory-300 mb-4">
                {daysUntilTrialEnd > 0
                  ? `Essai gratuit · ${daysUntilTrialEnd} jour${
                      daysUntilTrialEnd > 1 ? 's' : ''
                    } restant${daysUntilTrialEnd > 1 ? 's' : ''}`
                  : 'Essai terminé'}
              </p>
              <Button
                variant="primary"
                fullWidth
                onClick={() => navigate('/subscribe')}
              >
                Gérer mon abonnement
              </Button>
            </div>
          </Card>

          {/* Notifications navigateur */}
          {push.supported && (
            <Card variant="surface">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  {push.subscribed ? (
                    <Bell className="w-5 h-5 text-aurora-300" aria-hidden="true" />
                  ) : (
                    <BellOff className="w-5 h-5 text-ivory-400" aria-hidden="true" />
                  )}
                  <h3 className="font-cinzel text-h3 text-ivory-50">
                    Notifications
                  </h3>
                </div>
                <p className="text-caption text-ivory-300 mb-4">
                  {push.subscribed
                    ? 'Tu reçois un signal silencieux à chaque guidance.'
                    : "Active les notifications discrètes pour ne rien manquer."}
                </p>
                {push.permission === 'denied' ? (
                  <p className="text-caption text-magenta-300">
                    Les notifications sont bloquées dans ton navigateur. Active-les
                    dans les réglages du site pour recevoir les signaux.
                  </p>
                ) : push.subscribed ? (
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={async () => {
                      const ok = await push.disable();
                      if (ok) {
                        track('push_disabled');
                        toast.success('Notifications désactivées');
                      }
                    }}
                    loading={push.loading}
                  >
                    Désactiver
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={async () => {
                      const ok = await push.enable();
                      if (ok) {
                        vibrate('success');
                        track('push_enabled');
                        toast.success('Notifications activées ✦');
                      }
                    }}
                    loading={push.loading}
                  >
                    Activer
                  </Button>
                )}
              </div>
            </Card>
          )}

          {/* Plan premium summary */}
          {isPremium && (
            <Card variant="surface" className="relative overflow-hidden">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 to-magenta-500/10"
              />
              <div className="relative p-6 text-center">
                <p className="text-micro uppercase tracking-[0.22em] text-amber-300 mb-1">
                  {plan === 'lifetime' ? 'À vie' : trialDaysLeft && trialDaysLeft > 0 ? 'Essai' : 'Premium'}
                </p>
                <p className="font-cinzel text-h3 text-ivory-50">
                  Toutes les étoiles débloquées
                </p>
              </div>
            </Card>
          )}

          {/* Guidance quotidienne */}
          <DailyGuidanceChannel
            initial={{
              daily_guidance_enabled: profile.daily_guidance_enabled,
              preferred_channel: profile.preferred_channel,
              whatsapp_wa_id: profile.whatsapp_wa_id,
              instagram_igsid: profile.instagram_igsid,
              instagram_username: profile.instagram_username,
              guidance_hour: profile.guidance_hour,
              timezone: profile.timezone,
            }}
            zodiakWhatsAppNumber={
              import.meta.env.VITE_ZODIAK_WHATSAPP_NUMBER as string | undefined
            }
            zodiakInstagramHandle={
              import.meta.env.VITE_ZODIAK_INSTAGRAM_HANDLE as string | undefined
            }
          />

          {/* Logout */}
          <Card variant="surface">
            <div className="p-2">
              <motion.button
                type="button"
                onClick={onLogout}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-ivory-200 hover:text-magenta-400 hover:bg-magenta-500/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta-400"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="text-caption font-medium">Se déconnecter</span>
              </motion.button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface RowProps {
  label: string;
  value: string;
}
function Row({ label, value }: RowProps) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-night-700/60 pb-2.5">
      <dt className="text-caption text-ivory-400">{label}</dt>
      <dd className="text-body text-ivory-100 font-cinzel text-right">{value}</dd>
    </div>
  );
}

interface FieldRowProps {
  label: string;
  htmlFor: string;
  input: React.ReactNode;
}
function FieldRow({ label, htmlFor, input }: FieldRowProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-caption text-ivory-300">
        {label}
      </label>
      {input}
    </div>
  );
}

// Petit helper pour ne pas oublier l'icône d'utilisateur
export const ProfileIcon = User;
