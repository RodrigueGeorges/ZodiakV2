import { useState } from 'react';
import { User, CreditCard, Bell, LogOut, Edit2, Check, X, Clock, Send, Sun } from 'lucide-react';
import type { Profile } from '../lib/types/supabase';
import { useNavigate } from 'react-router-dom';
import InteractiveCard from './InteractiveCard';
import { toast } from 'react-hot-toast';
import NatalSignature from './NatalSignature';
import { useAuth } from '../lib/hooks/useAuth';
import { supabase } from '../lib/supabase';
import PageLayout from './PageLayout';

interface ProfileTabProps {
  profile: Profile;
  onLogout: () => void;
  showNatalInfo?: boolean;
}

interface Planet {
  name: string;
  sign: string;
}

interface NatalChart {
  planets?: Planet[];
  ascendant?: { sign: string };
}

function ProfileTab({ profile, onLogout, showNatalInfo = false }: ProfileTabProps) {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name,
    phone: profile.phone,
    birth_date: profile.birth_date,
    birth_time: profile.birth_time,
    birth_place: profile.birth_place,
    guidance_sms_time: profile.guidance_sms_time,
    daily_guidance_sms_enabled: profile.daily_guidance_sms_enabled || false,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // État pour la guidance quotidienne
  const [guidanceSettings, setGuidanceSettings] = useState({
    enabled: profile.daily_guidance_sms_enabled || false,
    time: profile.guidance_sms_time || '08:00',
    testing: false
  });

  const handleNotificationChange = async (type: 'sms' | 'daily', value: boolean) => {
    if (type === 'daily') {
      // Mise à jour de la guidance quotidienne
      const newSettings = { ...guidanceSettings, enabled: value };
      setGuidanceSettings(newSettings);
      
      try {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            daily_guidance_sms_enabled: value,
            updated_at: new Date().toISOString()
          })
          .eq('id', user?.id);

        if (updateError) throw updateError;
        
        toast.success(`Guidance quotidienne ${value ? 'activée' : 'désactivée'}`);
        await refreshProfile();
      } catch (err) {
        toast.error('Erreur lors de la mise à jour');
        setGuidanceSettings(prev => ({ ...prev, enabled: !value }));
      }
    } else {
      // Notifications SMS générales (à implémenter)
      toast.success(`Notifications ${type === 'sms' ? 'SMS' : 'quotidiennes'} ${value ? 'activées' : 'désactivées'}`);
    }
  };

  const handleTimeChange = async (newTime: string) => {
    const newSettings = { ...guidanceSettings, time: newTime };
    setGuidanceSettings(newSettings);
    
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          guidance_sms_time: newTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;
      
      toast.success(`Heure de guidance mise à jour : ${newTime}`);
      await refreshProfile();
    } catch (err) {
      toast.error('Erreur lors de la mise à jour de l\'heure');
      setGuidanceSettings(prev => ({ ...prev, time: guidanceSettings.time }));
    }
  };

  const handleTestSms = async () => {
    if (!profile.phone) {
      toast.error('Veuillez d\'abord ajouter votre numéro de téléphone');
      return;
    }

    setGuidanceSettings(prev => ({ ...prev, testing: true }));
    
    try {
      const response = await fetch('/.netlify/functions/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: profile.phone,
          text: `✨ Test Zodiak : Votre guidance quotidienne fonctionne parfaitement ! Découvrez vos conseils personnalisés : ${window.location.origin}/guidance`,
          from: 'Zodiak'
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erreur d\'envoi');
      }
      
      toast.success('SMS de test envoyé ! Vérifiez votre téléphone.');
    } catch (err) {
      console.error('Erreur SMS de test:', err);
      toast.error('Erreur lors de l\'envoi du SMS de test');
    } finally {
      setGuidanceSettings(prev => ({ ...prev, testing: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (!user) throw new Error('Non authentifié');

      const finalProfileData: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone,
        birth_date: formData.birth_date,
        birth_time: formData.birth_time,
        birth_place: formData.birth_place,
        guidance_sms_time: formData.guidance_sms_time,
        daily_guidance_sms_enabled: formData.daily_guidance_sms_enabled
      };

      const { error: upsertError } = await supabase.from('profiles').upsert(finalProfileData);

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

  const handleSubscribe = () => {
    navigate('/subscribe');
  };

  const daysUntilTrialEnd = Math.max(0, Math.ceil(
    (new Date(profile.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  ));

  // Infos de thème natal affichées uniquement si explicitement demandé
  const natalChart = (showNatalInfo ? (profile.natal_chart as NatalChart) : undefined);
  const sunSign = showNatalInfo ? (natalChart?.planets?.find((p: Planet) => p.name === 'Soleil')?.sign || 'N/A') : undefined;
  const moonSign = showNatalInfo ? (natalChart?.planets?.find((p: Planet) => p.name === 'Lune')?.sign || 'N/A') : undefined;
  const ascendantSign = showNatalInfo ? (natalChart?.ascendant?.sign || 'N/A') : undefined;

  // Avatar avec initiales ou photo
  const getInitials = (name: string) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';
  };

  return (
    <PageLayout 
      title="Mon Profil"
      subtitle="Gérez vos informations personnelles et préférences"
      maxWidth="4xl"
    >
      <div className="space-y-8">
        {/* Bandeau de confidentialité */}
        <div className="info-banner">
          🔒 Vos données de naissance sont 100% privées et ne seront jamais partagées.
        </div>

        {/* Signature astrale (affichée uniquement sur la page Natal) */}
        {showNatalInfo && (
          <div className="mb-8">
            <NatalSignature sunSign={sunSign!} moonSign={moonSign!} ascendantSign={ascendantSign!} />
          </div>
        )}

        {/* Résumé et interprétation du thème natal (affichés uniquement sur la page Natal) */}
        {showNatalInfo && (profile.natal_summary || profile.natal_chart_interpretation) && (
          <div className="mb-8">
            <InteractiveCard className="card-premium-glow max-w-3xl mx-auto text-center">
              {profile.natal_summary && (
                <div className="mb-4">
                                <h3 className="text-xl md:text-2xl font-cinzel font-bold bg-gradient-to-r from-blue-300 via-blue-200 to-cyan-300 text-transparent bg-clip-text mb-2 animate-blue-glow">Signature astrale</h3>
              <p className="text-lg font-cinzel leading-relaxed text-blue-300">{profile.natal_summary}</p>
                </div>
              )}
              {profile.natal_chart_interpretation && (
                <div>
                  <h3 className="text-xl md:text-2xl font-cinzel font-bold bg-gradient-to-r from-blue-300 via-blue-200 to-cyan-300 text-transparent bg-clip-text mb-2 animate-blue-glow">Interprétation détaillée</h3>
                  <p className="text-base leading-relaxed whitespace-pre-line text-blue-300">{profile.natal_chart_interpretation}</p>
                </div>
              )}
            </InteractiveCard>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          {/* Informations personnelles */}
          <div className="md:col-span-2">
            <InteractiveCard className="card-premium">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-cinzel font-bold text-primary">Informations Personnelles</h2>
                </div>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="p-2 hover:bg-primary/10 rounded-full transition-colors border border-primary/20"
                  aria-label="Modifier le profil"
                >
                  {editMode ? <X className="w-5 h-5 text-primary" /> : <Edit2 className="w-5 h-5 text-primary" />}
                </button>
              </div>

              {/* Avatar/Photo de profil */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-cosmic-700/50 rounded-xl">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {(profile as any).avatar_url ? (
                      <img 
                        src={(profile as any).avatar_url} 
                        alt="Photo de profil" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(profile.name || '')
                    )}
                  </div>
                  <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs hover:bg-primary/80 transition-colors">
                    <User className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <h3 className="text-lg font-cinzel text-white font-bold">{profile.name}</h3>
                  <p className="text-gray-400 text-sm">Membre Zodiak</p>
                </div>
              </div>

              {/* Affichage ou édition inline */}
              {!editMode ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-primary font-medium">Prénom</span>
                    <span className="text-lg font-cinzel text-primary">{profile.name}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-primary font-medium">Téléphone</span>
                    <span className="text-lg font-cinzel text-primary">{profile.phone || 'Non renseigné'}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="text-primary font-medium">Fin d'essai</span>
                    <span className="text-lg font-cinzel text-primary">
                      {profile.trial_ends_at ? new Date(profile.trial_ends_at).toLocaleDateString('fr-FR') : '—'}
                    </span>
                  </div>
                  {success && <div className="message-success">{success}</div>}
                  {error && <div className="message-error">{error}</div>}
                </div>
              ) : (
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <label className="text-gray-400 font-medium" htmlFor="name">Prénom</label>
                    <input
                      id="name"
                      type="text"
                      className="input-cosmic w-40 text-right"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <label className="text-gray-400 font-medium" htmlFor="phone">Téléphone</label>
                    <input
                      id="phone"
                      type="tel"
                      className="input-cosmic w-40 text-right"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-6">
                    <button
                      type="button"
                      className="py-2 px-4 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 transition-colors"
                      onClick={() => setEditMode(false)}
                    >Annuler</button>
                    <button
                      type="submit"
                      className="py-2 px-4 rounded-lg bg-primary text-white hover:bg-primary/80 transition-colors flex items-center gap-2"
                      disabled={saving}
                    >
                      {saving ? <span className="animate-spin"><Check className="w-4 h-4" /></span> : <Check className="w-4 h-4" />}
                      Sauvegarder
                    </button>
                  </div>
                  {success && <div className="message-success">{success}</div>}
                  {error && <div className="message-error">{error}</div>}
                </form>
              )}
            </InteractiveCard>
          </div>

          {/* Colonne de droite */}
          <div className="space-y-6 md:col-span-1">
            <InteractiveCard className="card-premium">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-cinzel font-bold text-primary">Abonnement</h2>
              </div>
              <div className="text-gray-400 text-sm mb-4">
                {daysUntilTrialEnd > 0 ? `Essai gratuit : ${daysUntilTrialEnd} jours restants` : 'Essai terminé'}
              </div>
              <button
                onClick={handleSubscribe}
                className="btn-compact w-full"
              >Gérer mon abonnement</button>
            </InteractiveCard>

            {/* Guidance Quotidienne - Section dédiée */}
            <InteractiveCard className="p-6 bg-gradient-to-br from-blue-900/30 to-blue-900/10 rounded-2xl shadow-xl border border-blue-400/20">
              <div className="flex items-center gap-3 mb-4">
                <Sun className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-cinzel font-bold text-blue-300">Guidance Quotidienne</h2>
              </div>
              {/* Statut */}
              <div className="mb-4 p-3 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300">Statut</span>
                  <span className={`status-badge ${
                    guidanceSettings.enabled ? 'status-active' : 'status-inactive'
                  }`}>
                    {guidanceSettings.enabled ? 'Activée' : 'Désactivée'}
                  </span>
                </div>
                {guidanceSettings.enabled && (
                  <div className="text-xs text-gray-400">
                    Envoi quotidien à {guidanceSettings.time || '08:00'}
                  </div>
                )}
              </div>
              {/* Toggle principal */}
              <div className="mb-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300 font-medium">Recevoir ma guidance par SMS</span>
                  <input
                    type="checkbox"
                    checked={guidanceSettings.enabled}
                    onChange={(e) => handleNotificationChange('daily', e.target.checked)}
                    className="sr-only peer"
                    aria-checked={guidanceSettings.enabled}
                    aria-label="Activer la guidance quotidienne par SMS"
                  />
                  <div className="relative w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-blue-500 transition-colors">
                    <div className="absolute inset-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                </label>
              </div>
              {/* Sélecteur d'heure */}
              {guidanceSettings.enabled && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Heure d'envoi
                  </label>
                  <input
                    type="time"
                    value={guidanceSettings.time || '08:00'}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    className="w-full bg-cosmic-900/60 border border-blue-400/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    aria-label="Choisir l'heure d'envoi de la guidance"
                  />
                </div>
              )}
              {/* Bouton test */}
              {guidanceSettings.enabled && (
                <button
                  onClick={handleTestSms}
                  disabled={guidanceSettings.testing || !profile.phone}
                  className="w-full py-2 px-4 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2 font-semibold disabled:opacity-50"
                  aria-disabled={guidanceSettings.testing || !profile.phone}
                >
                  {guidanceSettings.testing ? (
                    <>
                      <span className="animate-spin"><Send className="w-4 h-4" /></span>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Tester l'envoi
                    </>
                  )}
                </button>
              )}
              {/* Message d'aide si pas de téléphone */}
              {guidanceSettings.enabled && !profile.phone && (
                <div className="mt-2 text-xs text-red-400 text-center">
                  Veuillez renseigner votre numéro de téléphone dans votre profil pour activer l'envoi de SMS.
                </div>
              )}
              {/* Info */}
              <div className="mt-3 text-xs text-gray-400 text-center">
                Recevez chaque matin vos conseils astrologiques personnalisés
              </div>
            </InteractiveCard>

            {/* Notifications générales */}
            <InteractiveCard className="card-premium">
              <div className="flex items-center gap-3 mb-4">
                <Bell className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-cinzel font-bold text-primary">Notifications</h2>
              </div>
              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-300">Notifications SMS</span>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={(e) => handleNotificationChange('sms', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-700 rounded-full peer peer-checked:bg-primary transition-colors">
                    <div className="absolute inset-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform"></div>
                  </div>
                </label>
              </div>
            </InteractiveCard>

            <InteractiveCard className="card-premium">
              <button
                onClick={onLogout}
                className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-3 font-semibold text-primary"
              >
                <LogOut className="w-5 h-5 text-primary" />
                <span>Déconnexion</span>
              </button>
            </InteractiveCard>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default ProfileTab;