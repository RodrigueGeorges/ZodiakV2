import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Calendar, Clock, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { StorageService } from '../lib/storage';
import { AstrologyService } from '../lib/astrology';
import AuthLayout from '../components/AuthLayout';
import LoadingScreen from '../components/LoadingScreen';
import { Button } from '../components/ui/Button';
import NatalRevealSplash from '../components/NatalRevealSplash';
import { track } from '../lib/analytics';
import { vibrate } from '../lib/haptics';

interface RevealData {
  firstName: string;
  sunSign?: string;
  moonSign?: string;
  ascSign?: string;
}

export default function RegisterComplete() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { redirectTo } = useAuthRedirect();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<RevealData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    birth_time: '',
    birth_place: '',
  });

  useEffect(() => {
    const load = async () => {
      try {
        const saved = StorageService.getFormData();
        if (saved) {
          setFormData((prev) => ({
            ...prev,
            name: saved.name || '',
            birth_date: saved.birth_date || '',
            birth_time: saved.birth_time || '',
            birth_place: saved.birth_place || '',
          }));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("Tu n'es pas connecté·e.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const natalChart = await AstrologyService.calculateNatalChart({
        date_of_birth: formData.birth_date,
        time_of_birth: formData.birth_time,
        location: formData.birth_place,
      });

      await StorageService.saveProfile({
        id: user.id,
        name: formData.name,
        birth_date: formData.birth_date,
        birth_time: formData.birth_time,
        birth_place: formData.birth_place,
        natal_chart: natalChart,
        subscription_status: 'trial',
        trial_ends_at: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      StorageService.clearFormData();
      track('onboarding_completed', {
        has_birth_time: Boolean(formData.birth_time),
      });
      vibrate('success');

      // Récupère Soleil/Lune/Asc pour le splash reveal — formats possibles
      // (a) NatalChart de _astroEngine.ts : `sun.sign` / `moon.sign` / `ascendant.sign`
      // (b) ancien format : `sun_sign`, `moon_sign`, etc.
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
        ascSign: chart.ascendant?.sign ?? chart.ascendant_sign,
      });
      // Le splash redirigera vers /guidance via onDone
      return;
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Erreur lors de la sauvegarde. Réessaie.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Préparation…" />;
  if (!user) {
    redirectTo('/login');
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
      eyebrow="Dernière étape"
      title="Donne-toi naissance"
      subtitle="Quelques infos pour calculer ta carte du ciel — précieusement gardées."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
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
              value={formData.birth_date}
              onChange={(e) =>
                setFormData({ ...formData, birth_date: e.target.value })
              }
              className="input-cosmic"
            />
          }
        />

        <FieldGroup
          label="Heure de naissance"
          icon={<Clock className="w-4 h-4 text-aurora-300" />}
          help="Précise au mieux — l'ascendant en dépend."
          input={
            <input
              type="time"
              required
              value={formData.birth_time}
              onChange={(e) =>
                setFormData({ ...formData, birth_time: e.target.value })
              }
              className="input-cosmic"
            />
          }
        />

        <FieldGroup
          label="Lieu de naissance"
          icon={<MapPin className="w-4 h-4 text-aurora-300" />}
          input={
            <input
              type="text"
              required
              value={formData.birth_place}
              onChange={(e) =>
                setFormData({ ...formData, birth_place: e.target.value })
              }
              className="input-cosmic"
              placeholder="Ville, Pays"
            />
          }
        />

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
            loading={saving}
            iconLeft={!saving ? <Sparkles className="w-4 h-4" /> : undefined}
          >
            Calculer ma carte
          </Button>
        </div>
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
