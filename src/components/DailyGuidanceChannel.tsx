import { useState, useMemo } from 'react';
import {
  MessageCircle,
  Instagram,
  Clock,
  Globe2,
  Check,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '../lib/toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/hooks/useAuth';
import { Card } from './ui/Card';
import PairingCode from './PairingCode';
import { cn } from '../lib/utils';

/**
 * Carte "Guidance quotidienne" — DA aurora.
 *
 * Permet à l'utilisateur :
 *   - d'activer / désactiver la livraison quotidienne
 *   - de choisir son canal (WhatsApp ou Instagram)
 *   - de paramétrer son heure et son fuseau horaire
 *   - de jumeler son compte via un code 6 chiffres (PairingCode)
 */
type Channel = 'whatsapp' | 'instagram';

interface DailyGuidanceChannelProps {
  initial: {
    daily_guidance_enabled: boolean | null;
    preferred_channel: Channel | null;
    whatsapp_wa_id: string | null;
    instagram_igsid: string | null;
    instagram_username: string | null;
    guidance_hour: number | null;
    timezone: string | null;
  };
  zodiakWhatsAppNumber?: string;
  zodiakInstagramHandle?: string;
}

const COMMON_TIMEZONES = [
  'Europe/Paris',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Berlin',
  'Africa/Casablanca',
  'America/New_York',
  'America/Los_Angeles',
  'America/Sao_Paulo',
  'Asia/Dubai',
  'Asia/Tokyo',
];

export default function DailyGuidanceChannel({
  initial,
  zodiakWhatsAppNumber = '33000000000',
  zodiakInstagramHandle = 'zodiakastro',
}: DailyGuidanceChannelProps) {
  const { user, refreshProfile } = useAuth();

  const [enabled, setEnabled] = useState<boolean>(
    Boolean(initial.daily_guidance_enabled)
  );
  const [channel, setChannel] = useState<Channel | null>(
    initial.preferred_channel
  );
  const [hour, setHour] = useState<number>(
    typeof initial.guidance_hour === 'number' ? initial.guidance_hour : 8
  );
  const [tz, setTz] = useState<string>(initial.timezone || 'Europe/Paris');
  const [saving, setSaving] = useState(false);

  const isConnected = useMemo(() => {
    if (channel === 'whatsapp') return Boolean(initial.whatsapp_wa_id);
    if (channel === 'instagram') return Boolean(initial.instagram_igsid);
    return false;
  }, [channel, initial.whatsapp_wa_id, initial.instagram_igsid]);

  const persist = async (patch: Record<string, unknown>) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur de sauvegarde.');
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const onToggleEnabled = async (next: boolean) => {
    setEnabled(next);
    try {
      await persist({ daily_guidance_enabled: next });
      toast.success(next ? 'Guidance quotidienne activée.' : 'Guidance désactivée.');
    } catch {
      setEnabled(!next);
    }
  };

  const onChannelChange = async (next: Channel) => {
    setChannel(next);
    try {
      await persist({ preferred_channel: next });
    } catch {
      setChannel(channel);
    }
  };

  const onHourChange = async (next: number) => {
    setHour(next);
    try {
      await persist({ guidance_hour: next });
      toast.success(`Heure d'envoi · ${String(next).padStart(2, '0')}:00`);
    } catch {
      setHour(hour);
    }
  };

  const onTzChange = async (next: string) => {
    setTz(next);
    try {
      await persist({ timezone: next });
    } catch {
      setTz(tz);
    }
  };

  return (
    <Card id="guidance-channel" variant="elevated" className="relative overflow-hidden scroll-mt-24">
      <div className="relative p-7 space-y-6">
        <div className="flex items-center gap-4">
          <div
            aria-hidden="true"
            className="flex items-center justify-center w-10 h-10 rounded-full border border-aurora-400/30 text-aurora-400"
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="eyebrow-ritual text-aurora-400/80">Quotidien</p>
            <h3 className="font-display font-light text-h2 text-ivory-50 leading-tight mt-1">
              Ma guidance du matin
            </h3>
          </div>
        </div>

        {/* Toggle */}
        <label
          className="flex items-center justify-between gap-4 cursor-pointer rounded-xl bg-night-900/40 border border-night-700/60 px-4 py-3"
          htmlFor="dgc-enabled"
        >
          <span className="text-body text-ivory-100">
            Recevoir ma guidance chaque jour
          </span>
          <span className="relative inline-flex shrink-0">
            <input
              id="dgc-enabled"
              type="checkbox"
              checked={enabled}
              onChange={(e) => onToggleEnabled(e.target.checked)}
              className="sr-only peer"
              aria-label="Activer la guidance quotidienne"
              disabled={saving}
            />
            <span className="block w-11 h-6 rounded-full bg-night-700 peer-checked:bg-aurora-500 transition-colors" />
            <span className="absolute left-1 top-1 w-4 h-4 rounded-full bg-ivory-50 peer-checked:translate-x-5 transition-transform shadow" />
          </span>
        </label>

        {enabled && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-5"
          >
            {/* Choix canal */}
            <fieldset>
              <legend className="text-caption text-ivory-300 mb-2">
                Sur quel canal ?
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'whatsapp' as const, label: 'WhatsApp', Icon: MessageCircle, accent: 'aurora' },
                  { id: 'instagram' as const, label: 'Instagram', Icon: Instagram, accent: 'magenta' },
                ].map(({ id, label, Icon, accent }) => {
                  const active = channel === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => onChannelChange(id)}
                      aria-pressed={active}
                      className={cn(
                        'flex items-center justify-center gap-2 py-3 rounded-xl border text-caption font-mono uppercase tracking-[0.14em] transition-colors',
                        active
                          ? accent === 'aurora'
                            ? 'bg-aurora-500/15 border-aurora-400/50 text-aurora-100'
                            : 'bg-magenta-500/15 border-magenta-400/50 text-magenta-100'
                          : 'bg-night-900/40 border-night-700/60 text-ivory-300 hover:bg-night-900/70 hover:text-ivory-100'
                      )}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* Statut connexion */}
            {channel && isConnected && (
              <div
                className="rounded-xl border bg-aurora-500/10 border-aurora-500/30 text-aurora-200 text-caption px-4 py-3 inline-flex items-center gap-2 w-full"
                role="status"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                {channel === 'whatsapp'
                  ? 'WhatsApp connecté · Ta guidance arrive chaque matin.'
                  : `Instagram connecté${
                      initial.instagram_username
                        ? ` (@${initial.instagram_username})`
                        : ''
                    } · Ta guidance arrive chaque matin.`}
              </div>
            )}

            {/* Pairing */}
            {channel && !isConnected && user && (
              <PairingCode
                channel={channel}
                userId={user.id}
                zodiakWhatsAppNumber={zodiakWhatsAppNumber}
                zodiakInstagramHandle={zodiakInstagramHandle}
              />
            )}

            {/* Heure + fuseau */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="dgc-hour"
                  className="block text-caption text-ivory-300 mb-2"
                >
                  <Clock
                    className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-aurora-300"
                    aria-hidden="true"
                  />
                  Heure d'envoi
                </label>
                <select
                  id="dgc-hour"
                  value={hour}
                  onChange={(e) => onHourChange(parseInt(e.target.value, 10))}
                  className="input-cosmic"
                  disabled={saving}
                >
                  {Array.from({ length: 24 }, (_, h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="dgc-tz"
                  className="block text-caption text-ivory-300 mb-2"
                >
                  <Globe2
                    className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-aurora-300"
                    aria-hidden="true"
                  />
                  Fuseau
                </label>
                <select
                  id="dgc-tz"
                  value={tz}
                  onChange={(e) => onTzChange(e.target.value)}
                  className="input-cosmic"
                  disabled={saving}
                >
                  {COMMON_TIMEZONES.map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                  {!COMMON_TIMEZONES.includes(tz) && (
                    <option value={tz}>{tz}</option>
                  )}
                </select>
              </div>
            </div>
          </motion.div>
        )}

        <p className="text-micro text-ivory-400 text-center">
          · Personnalisée selon ton thème natal et les transits du jour
        </p>
      </div>
    </Card>
  );
}
