import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { StorageService } from '../lib/storage';
import { AstrologyService } from '../lib/astrology';
import { ButtonZodiak } from '../components/ButtonZodiak';
import { LoadingScreen } from '../components/LoadingScreen';
import { PageLayout } from '../components/PageLayout';
import { motion } from 'framer-motion';
import { User, Calendar, Clock, MapPin, Star, CheckCircle } from 'lucide-react';

export default function RegisterComplete() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { redirectTo } = useAuthRedirect();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    birth_date: '',
    birth_time: '',
    birth_place: ''
  });

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const savedData = StorageService.getFormData();
        if (savedData) {
          setFormData({
            name: savedData.name || '',
            birth_date: savedData.birth_date || '',
            birth_time: savedData.birth_time || '',
            birth_place: savedData.birth_place || ''
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFormData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('Utilisateur non connecté');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Calculer le thème natal
      const birthData = {
        date_of_birth: formData.birth_date,
        time_of_birth: formData.birth_time,
        location: formData.birth_place
      };

      const natalChart = await AstrologyService.calculateNatalChart(birthData);

      // Sauvegarder le profil complet
      const profile = {
        id: user.id,
        name: formData.name,
        birth_date: formData.birth_date,
        birth_time: formData.birth_time,
        birth_place: formData.birth_place,
        natal_chart: natalChart,
        subscription_status: 'trial',
        trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours d'essai
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await StorageService.saveProfile(profile);

      // Nettoyer les données temporaires
      StorageService.clearFormData();

      // Rediriger vers la guidance
      redirectTo('/guidance');
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err);
      setError('Erreur lors de la sauvegarde du profil. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    redirectTo('/login');
    return <LoadingScreen />;
  }

  return (
    <PageLayout title="Compléter votre profil" subtitle="Dernière étape pour accéder à votre guidance">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gradient-to-br from-cosmic-800/50 to-cosmic-900/50 rounded-lg p-8 border border-primary/20"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-cosmic-900" />
            </div>
            <h2 className="text-2xl font-bold text-primary mb-2">
              Complétez votre profil
            </h2>
            <p className="text-gray-400">
              Ces informations nous permettront de calculer votre thème natal et de vous proposer une guidance personnalisée
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nom complet
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-cosmic-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                placeholder="Votre nom complet"
                required
              />
            </div>

            {/* Date de naissance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Date de naissance
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-4 py-3 bg-cosmic-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            {/* Heure de naissance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Clock className="w-4 h-4 inline mr-2" />
                Heure de naissance
              </label>
              <input
                type="time"
                value={formData.birth_time}
                onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                className="w-full px-4 py-3 bg-cosmic-800/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            {/* Lieu de naissance */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-2" />
                Lieu de naissance
              </label>
              <input
                type="text"
                value={formData.birth_place}
                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                className="w-full px-4 py-3 bg-cosmic-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                placeholder="Ville, Pays"
                required
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <ButtonZodiak
                type="button"
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1"
              >
                Retour à l'accueil
              </ButtonZodiak>
              <ButtonZodiak
                type="submit"
                disabled={saving}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Terminer l'inscription
                  </>
                )}
              </ButtonZodiak>
            </div>
          </form>
        </motion.div>
      </div>
    </PageLayout>
  );
} 