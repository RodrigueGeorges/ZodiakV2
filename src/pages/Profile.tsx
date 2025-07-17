import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CreditCard, Bell, LogOut, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../lib/hooks/useAuth.tsx';
import { supabase } from '../lib/supabase';
import PageLayout from '../components/PageLayout';
import InteractiveCard from '../components/InteractiveCard';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import CosmicLoader from '../components/CosmicLoader';
import { DESIGN_TOKENS } from '../lib/constants/design';
import { AstrologyService } from '../lib/astrology';
import type { Place } from '../lib/places';
import NatalSignature from '../components/NatalSignature';
import type { Profile } from '../lib/types/supabase';

// Types pour le thème natal
interface Planet {
  name: string;
  sign: string;
  degree?: number;
  house?: number;
}

interface Ascendant {
  sign: string;
  degree?: number;
}

interface NatalChart {
  planets: Planet[];
  ascendant: Ascendant;
  houses?: Array<{ number: number; sign: string }>;
}

// Animations pour les transitions
const cardVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  hover: { scale: 1.02, y: -2 }
};

const formVariants = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: 'auto' },
  exit: { opacity: 0, height: 0 }
};

export function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut, refreshProfile, isLoading: isAuthLoading } = useAuth();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    birth_date: '',
    birth_time: '',
    birth_place: '',
    daily_guidance_sms_enabled: true,
    guidance_sms_time: '08:00',
  });
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  // Calcul des jours restants d'essai
  const daysUntilTrialEnd = profile?.trial_ends_at 
    ? Math.max(0, Math.ceil((new Date(profile.trial_ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        birth_date: profile.birth_date || '',
        birth_time: profile.birth_time || '',
        birth_place: profile.birth_place || '',
        daily_guidance_sms_enabled: profile.daily_guidance_sms_enabled ?? true,
        guidance_sms_time: profile.guidance_sms_time || '08:00',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user) throw new Error('Non authentifié');

      let finalProfileData = { ...formData };

      // Si le thème natal n'existe pas et que les infos sont présentes, on le calcule
      if (!profile?.natal_chart && finalProfileData.birth_date && finalProfileData.birth_time && selectedPlace) {
        try {
          const birthData = {
            date_of_birth: finalProfileData.birth_date,
            time_of_birth: finalProfileData.birth_time,
            location: `${selectedPlace._geoloc.lat},${selectedPlace._geoloc.lng}`,
          };
          const natalChart = await AstrologyService.calculateNatalChart(birthData);
          (finalProfileData as Record<string, unknown>).natal_chart = natalChart;
        } catch (chartError) {
          console.error("Erreur de calcul du thème natal:", chartError);
          setError("Impossible de calculer le thème natal. Vérifiez les données de naissance.");
          // On ne bloque pas la sauvegarde du reste du profil
        }
      }

      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...finalProfileData,
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;

      await refreshProfile();
      setSuccess('Profil mis à jour avec succès');
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      if (!error || error.status !== 403) {
        console.error('Erreur lors de la déconnexion:', error);
      }
    } finally {
      localStorage.clear();
      navigate('/');
      window.location.reload();
    }
  };

  const formatDate = (date: string) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    return time;
  };

  const renderStatus = () => (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg border border-red-400/30"
        >
          <div className="flex items-center gap-2">
            <X className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </motion.div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg shadow-lg border border-green-400/30"
        >
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Fonction d'upload d'avatar
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Format non supporté. Utilisez jpg, png ou webp.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Image trop lourde (max 2 Mo).');
      return;
    }
    setAvatarUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'user'}_${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName).data;
      if (!publicUrl) throw new Error('Erreur lors de la récupération de l\'URL');
      // Mettre à jour le profil
      await supabase.from('profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', user?.id);
      await refreshProfile();
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setAvatarUploading(false);
    }
  };

  // Calcul des initiales pour l'avatar
  const initials = (profile?.name || user?.email || 'U')[0]?.toUpperCase() + (profile?.name?.split(' ')[1]?.[0]?.toUpperCase() || '');

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <CosmicLoader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <div className="text-red-400 text-center">Utilisateur non authentifié. Veuillez vous reconnecter.</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cosmic-900">
        <div className="text-red-400 text-center">Profil non disponible ou incomplet. Veuillez compléter votre profil.</div>
      </div>
    );
  }

  let natalChart: NatalChart | null = null;
  try {
    natalChart = typeof profile.natal_chart === 'string'
      ? JSON.parse(profile.natal_chart)
      : profile.natal_chart;
  } catch {
    natalChart = null;
  }

  // Affichage du thème natal uniquement si tous les signes sont présents
  const hasFullNatal = natalChart && natalChart.planets && natalChart.ascendant &&
    natalChart.planets.find((p: Planet) => p.name === 'Soleil')?.sign &&
    natalChart.planets.find((p: Planet) => p.name === 'Lune')?.sign &&
    natalChart.ascendant.sign;

  return (
    <PageLayout 
      title="Mon Profil" 
      subtitle="Gérez vos informations et votre abonnement"
      maxWidth="4xl"
    >
      {renderStatus()}
      
      {/* Header avec avatar et informations utilisateur */}
      <motion.div 
        className="w-full mb-8 flex flex-col md:flex-row items-center md:items-end gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="relative group w-16 h-16">
            {(profile as any)?.avatar_url ? (
              <img src={(profile as any).avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover border-4 border-cosmic-900 shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl font-bold text-cosmic-950 shadow-lg border-4 border-cosmic-900">
                {initials}
              </div>
            )}
            {/* Bouton d'upload en overlay */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
              <span className="text-xs text-white bg-cosmic-900/80 px-2 py-1 rounded shadow">Changer ma photo</span>
            </label>
            {avatarUploading && <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full"><span className="text-white text-xs">Chargement...</span></div>}
          </div>
          <div>
            <h2 className="text-2xl font-cinzel font-bold bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text mb-1">
              Bienvenue, {profile?.name || user?.email || 'Utilisateur'} !
            </h2>
            <div className="text-gray-400 text-sm">Gérez votre profil et vos préférences</div>
            {avatarError && <div className="text-xs text-red-400 mt-1">{avatarError}</div>}
          </div>
        </div>
        {/* Badge d'abonnement */}
        {profile?.subscription_status && (
          <span className={`px-4 py-1 rounded-full text-sm font-semibold shadow-md ${
            profile.subscription_status === 'trial' ? 'bg-[#D8CAB8]/80 text-black' : 'bg-green-600/80 text-white'
          }`}>
            {profile.subscription_status === 'trial' ? 'Essai' : 'Abonné'}
          </span>
        )}
      </motion.div>

      {/* Disposition responsive des cartes */}
      <div className="w-full flex flex-col md:flex-row gap-8">
        <div className="flex-1 min-w-0">
          {/* Carte infos utilisateur */}
          <InteractiveCard className="mb-8 shadow-xl rounded-2xl bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/10">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary">
                  <User className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="text-xl font-semibold font-cinzel bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
                  Informations personnelles
                </h3>
                {!editMode && (
                  <motion.button
                    onClick={() => setEditMode(true)}
                    className="ml-auto p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-primary/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Edit2 className="w-4 h-4 text-gray-400" />
                  </motion.button>
                )}
              </div>
              
              <AnimatePresence mode="wait">
                {editMode ? (
                  <motion.div 
                    key="edit"
                    variants={formVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={DESIGN_TOKENS.components.input.base}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Téléphone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className={DESIGN_TOKENS.components.input.base}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date de naissance
                        </label>
                        <input
                          type="date"
                          value={formData.birth_date}
                          onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                          className={DESIGN_TOKENS.components.input.base}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Heure de naissance
                        </label>
                        <input
                          type="time"
                          value={formData.birth_time}
                          onChange={(e) => setFormData({ ...formData, birth_time: e.target.value })}
                          className={DESIGN_TOKENS.components.input.base}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Lieu de naissance
                      </label>
                      <PlaceAutocomplete
                        value={formData.birth_place}
                        onChange={(value, place) => {
                          setFormData({ ...formData, birth_place: value });
                          setSelectedPlace(place);
                        }}
                        placeholder="Lieu de naissance"
                      />
                    </div>
                    
                    <motion.div 
                      className="flex justify-end gap-3 mt-6"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.button 
                        onClick={() => setEditMode(false)} 
                        className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-white/5 transition-all duration-200"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Annuler
                      </motion.button>
                      <motion.button 
                        onClick={handleSave} 
                        disabled={saving} 
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-black font-semibold hover:opacity-90 transition-all duration-200 shadow-lg flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Sauvegarder
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="view"
                    variants={formVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-sm text-gray-400 mb-1">Nom complet</p>
                          <p className="text-lg text-white font-medium">{profile?.name}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-sm text-gray-400 mb-1">Téléphone</p>
                          <p className="text-lg text-white font-medium">{profile?.phone}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-sm text-gray-400 mb-1">Date de naissance</p>
                          <p className="text-lg text-white font-medium">{formatDate(profile?.birth_date || '')}</p>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-sm text-gray-400 mb-1">Heure de naissance</p>
                          <p className="text-lg text-white font-medium">{formatTime(profile?.birth_time || '')}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <p className="text-sm text-gray-400 mb-1">Lieu de naissance</p>
                      <p className="text-lg text-white font-medium">{profile?.birth_place}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </InteractiveCard>

          {/* Carte thème natal si disponible */}
          {hasFullNatal && natalChart && (
            <InteractiveCard className="mb-8 shadow-xl rounded-2xl bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/10">
              <div className="relative z-10">
                <NatalSignature
                  sunSign={natalChart.planets.find((p: Planet) => p.name === 'Soleil')?.sign || 'Non disponible'}
                  moonSign={natalChart.planets.find((p: Planet) => p.name === 'Lune')?.sign || 'Non disponible'}
                  ascendantSign={natalChart.ascendant.sign || 'Non disponible'}
                />
              </div>
            </InteractiveCard>
          )}
        </div>

        <div className="w-full md:w-80 flex flex-col gap-6">
          {/* Carte abonnement */}
          <InteractiveCard className="mb-8 shadow-xl rounded-2xl bg-gradient-to-br from-cosmic-800/80 to-cosmic-900/80 border-primary/10">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-primary to-secondary">
                  <CreditCard className="w-6 h-6 text-gray-900" />
                </div>
                <h3 className="text-lg font-semibold font-cinzel bg-gradient-to-r from-primary to-secondary text-transparent bg-clip-text">
                  Abonnement
                </h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10">
                  <span className="text-sm text-gray-400">Statut</span>
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    profile.subscription_status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    profile.subscription_status === 'trial' ? 'bg-[#D8CAB8]/20 text-[#D8CAB8] border border-[#D8CAB8]/30' : 
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {profile.subscription_status === 'active' ? 'Actif' :
                     profile.subscription_status === 'trial' ? 'Essai' : 'Expiré'}
                  </span>
                </div>
                {profile.subscription_status === 'trial' && (
                  <motion.div 
                    className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/10"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <span className="text-sm text-gray-400">Jours restants</span>
                    <span className="text-sm font-semibold text-[#D8CAB8]">
                      {daysUntilTrialEnd} jours
                    </span>
                  </motion.div>
                )}
              </div>
            </div>
          </InteractiveCard>

          {/* Bouton Déconnexion harmonisé */}
          <motion.button 
            onClick={handleLogout}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary to-secondary text-cosmic-900 rounded-lg font-semibold shadow-lg hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 mb-24"
            style={{
              boxShadow: '0 0 32px 8px #D8CAB880',
              background: 'linear-gradient(120deg, #D8CAB8 0%, #E5E1C6 40%, #BFAF80 70%, #fffbe6 100%)',
              backgroundSize: '200% auto',
              animation: 'sheen 3s linear infinite',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-5 h-5 text-cosmic-900" /> 
            Déconnexion
          </motion.button>
        </div>
      </div>
    </PageLayout>
  );
}

export default Profile;