import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Clock, MapPin, Heart, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import type { FriendRelationship } from '../lib/types/supabase';
import { supabase } from '../lib/supabase';

interface AddFriendFormProps {
  onAdded: (data: {
    name: string;
    relationship: FriendRelationship;
    birth_date: string;
    birth_time?: string;
    birth_place?: string;
    avatar_emoji?: string;
    natal_chart: unknown;
    natal_summary?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

const RELATIONSHIPS: { key: FriendRelationship; label: string; emoji: string }[] = [
  { key: 'partner', label: 'Partenaire', emoji: '♥' },
  { key: 'crush', label: 'Crush', emoji: '✶' },
  { key: 'friend', label: 'Ami·e', emoji: '☽' },
  { key: 'family', label: 'Famille', emoji: '◆' },
  { key: 'colleague', label: 'Collègue', emoji: '△' },
  { key: 'other', label: 'Autre', emoji: '…' },
];

/**
 * Formulaire d'ajout d'un proche pour calculer une synastrie.
 *
 * Côté client on collecte les données, côté serveur (compute-friend-chart)
 * on calcule la carte natale via astronomy-engine puis on persiste tout via
 * `useFriends.addFriend` qui calcule la synastrie en local.
 */
export default function AddFriendForm({ onAdded, onCancel }: AddFriendFormProps) {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<FriendRelationship>('friend');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [emoji, setEmoji] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !birthDate) {
      toast.error('Au moins un prénom et une date de naissance.');
      return;
    }
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Session expirée');

      const res = await fetch('/.netlify/functions/compute-friend-chart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          birth_date: birthDate,
          birth_time: birthTime || undefined,
          birth_place: birthPlace || undefined,
          relationship,
        }),
      });
      if (!res.ok) {
        throw new Error(`Erreur calcul (${res.status})`);
      }
      const json = (await res.json()) as { chart: unknown };

      await onAdded({
        name,
        relationship,
        birth_date: birthDate,
        birth_time: birthTime || undefined,
        birth_place: birthPlace || undefined,
        avatar_emoji: emoji || undefined,
        natal_chart: json.chart,
      });
      toast.success(`${name} ajouté·e`);
    } catch (err) {
      console.error(err);
      toast.error('Impossible de calculer la carte. Réessaie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="elevated" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-aurora-500/12 via-transparent to-magenta-500/12"
      />
      <form onSubmit={handleSubmit} className="relative p-6 md:p-8 space-y-5">
        <div className="text-center">
          <p className="text-micro uppercase tracking-[0.22em] text-aurora-300 mb-1">
            Synastrie
          </p>
          <h2 className="font-display font-light text-h2 text-ivory-50 tracking-[-0.02em]">Lis vos étoiles ensemble</h2>
          <p className="text-caption text-ivory-300 mt-1">
            Quelques infos sur la personne — ses données restent privées.
          </p>
        </div>

        <Field icon={<User className="w-4 h-4 text-aurora-300" />} label="Prénom">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mathilde"
            className="input-cosmic"
            required
          />
        </Field>

        <div>
          <p className="text-caption text-ivory-300 mb-2">Lien</p>
          <div className="grid grid-cols-3 gap-2">
            {RELATIONSHIPS.map((r) => {
              const active = relationship === r.key;
              return (
                <motion.button
                  key={r.key}
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setRelationship(r.key)}
                  className={`rounded-2xl px-2 py-2 text-caption font-mono uppercase tracking-wider ring-1 transition ${
                    active
                      ? 'bg-aurora-500/20 ring-aurora-400/50 text-ivory-50'
                      : 'bg-night-900/60 ring-night-700/70 text-ivory-300'
                  }`}
                  aria-pressed={active}
                >
                  <span className="mr-1.5" aria-hidden="true">
                    {r.emoji}
                  </span>
                  {r.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field icon={<Calendar className="w-4 h-4 text-aurora-300" />} label="Naissance">
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="input-cosmic"
              required
            />
          </Field>
          <Field
            icon={<Clock className="w-4 h-4 text-aurora-300" />}
            label="Heure"
            help="Pas obligatoire — l'Asc sera approximé."
          >
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="input-cosmic"
            />
          </Field>
        </div>

        <Field icon={<MapPin className="w-4 h-4 text-aurora-300" />} label="Lieu de naissance">
          <input
            value={birthPlace}
            onChange={(e) => setBirthPlace(e.target.value)}
            placeholder="Lyon, France"
            className="input-cosmic"
          />
        </Field>

        <Field
          icon={<Heart className="w-4 h-4 text-magenta-300" />}
          label="Marqueur (optionnel)"
        >
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
            placeholder="★"
            maxLength={2}
            className="input-cosmic"
          />
        </Field>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              fullWidth
              disabled={submitting}
            >
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            loading={submitting}
            fullWidth
            iconLeft={!submitting ? <Sparkles className="w-4 h-4" /> : undefined}
          >
            Calculer la synastrie
          </Button>
        </div>
      </form>
    </Card>
  );
}

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  help?: string;
  children: React.ReactNode;
}
function Field({ icon, label, help, children }: FieldProps) {
  return (
    <label className="block">
      <span className="flex items-center gap-2 text-caption text-ivory-200 mb-1.5">
        {icon}
        {label}
      </span>
      {children}
      {help && <span className="block mt-1 text-micro text-ivory-400">{help}</span>}
    </label>
  );
}
