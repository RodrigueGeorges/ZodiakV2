import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/hooks/useAuth.tsx';
import { useAuthRedirect } from '../lib/hooks/useAuthRedirect';
import { supabase } from '../lib/supabase';
import InteractiveCard from '../components/InteractiveCard';
import Logo from '../components/Logo';
import StarryBackground from '../components/StarryBackground';
import PlaceAutocomplete from '../components/PlaceAutocomplete';
import { getCoordsFromPlaceString, type Place } from '../lib/places';
import { AstrologyService } from '../lib/astrology';
import type { NatalChart } from '../lib/astrology';
import LoadingScreen from '../components/LoadingScreen';
import { StorageService } from '../lib/storage';

export default function RegisterComplete() {
  const navigate = useNavigate();
  const { user, profile, isLoading, refreshProfile } = useAuth();
  const { shouldRedirect } = useAuthRedirect();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    birthDate: '',
    birthTime: '',
    unknownTime: false,
    birthPlace: '',
    birthPlaceObj: null as Place | null,
    guidanceTime: '08:00',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [placeStatus, setPlaceStatus] = useState({ loading: false, error: null as string | null, valid: false });

  const params = new URLSearchParams(window.location.search);
  const justSignedUp = params.get('justSignedUp');

  useEffect(() => {
    // Pré-fill form with existing profile data
    if (user && profile) {
      setForm(prevForm => ({
        ...prevForm,
        name: profile.name || '',
        phone: profile.phone || '',
        birthDate: profile.birth_date || '',
        birthTime: profile.birth_time || '',
        birthPlace: profile.birth_place || '',
        guidanceTime: profile.guidance_sms_time || '08:00',
      }));
      // If a birth place is already set, consider it valid
      if (profile.birth_place) {
        setPlaceStatus({ loading: false, error: null, valid: true });
      }
    }
  }, [user, profile]);

  useEffect(() => {
    if (profile && !justSignedUp) {
      navigate('/profile', { replace: true });
    }
  }, [profile, navigate, justSignedUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) {
      setError('Veuillez remplir tous les champs correctement.');
      return;
    }

    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!user) {
        throw new Error("Utilisateur non trouvé. Veuillez vous reconnecter.");
      }

      const birthTime = form.unknownTime ? '12:00' : form.birthTime;
      const [hour, minute] = birthTime.split(':').map(Number);
      
      const coords = await getCoordsFromPlaceString(form.birthPlace);

      if (!coords) {
        throw new Error("Impossible de récupérer les coordonnées du lieu de naissance.");
      }

      const birthData = {
        date_of_birth: form.birthDate,
        time_of_birth: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        location: `${coords.latitude},${coords.longitude}`
      };

      const natalChart = await AstrologyService.calculateNatalChart(birthData);

      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: user.id,
        name: form.name,
        phone: form.phone,
        birth_date: form.birthDate,
        birth_time: form.unknownTime ? null : form.birthTime,
        birth_place: form.birthPlace,
        natal_chart: natalChart as NatalChart,
        guidance_sms_time: form.guidanceTime,
        updated_at: new Date().toISOString(),
      });

      if (upsertError) throw upsertError;

      // Vide le cache et force le refresh du profil depuis Supabase
      StorageService.clearUserCache(user.id);
      const refreshed = await refreshProfile();
      if (refreshed) {
        setSuccess('Profil complété avec succès ! Redirection...');
        navigate('/profile', { replace: true });
      } else {
        setError('Erreur lors de la récupération du profil après création.');
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return (
      form.name.trim() &&
      form.phone.trim() &&
      form.birthDate.trim() &&
      (form.birthTime.trim() || form.unknownTime) &&
      placeStatus.valid
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Chargement de votre profil..." />;
  }

  // Si l'utilisateur n'est PAS authentifié, redirige vers /login
  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  // Si l'utilisateur a déjà un profil, redirige vers /profile
  if (user && profile) {
    navigate('/profile', { replace: true });
    return null;
  }

  // Si l'utilisateur est authentifié mais n'a pas de profil, afficher le formulaire
  if (user && !profile) {
    return (
      <div className="min-h-screen overflow-hidden relative">
        <StarryBackground />
        <div className="container mx-auto px-4 md:px-8 xl:px-12 2xl:px-24 py-8 md:py-12 lg:py-16">
          <div className="max-w-md mx-auto mt-16">
            <InteractiveCard className="p-6 md:p-8 xl:p-10 2xl:p-16">
              <div className="mb-8 text-center">
                <Logo />
                <h2 className="text-2xl font-cinzel font-bold mt-4 mb-2">
                  Complétez votre profil
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Nom complet</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50"
                    placeholder="Votre nom"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Numéro de téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50"
                    placeholder="+33612345678"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Date de naissance</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={e => setForm({ ...form, birthDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Heure de naissance</label>
                  <input
                    type="time"
                    value={form.birthTime}
                    onChange={e => setForm({ ...form, birthTime: e.target.value, unknownTime: false })}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50"
                    placeholder="HH:mm"
                    disabled={form.unknownTime}
                  />
                  <div className="flex items-center mt-1">
                    <input
                      type="checkbox"
                      id="unknownTime"
                      checked={form.unknownTime}
                      onChange={e => setForm({ ...form, unknownTime: e.target.checked, birthTime: '' })}
                      className="mr-2"
                    />
                    <label htmlFor="unknownTime" className="text-sm text-primary">Je ne connais pas l'heure</label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Lieu de naissance</label>
                  <PlaceAutocomplete
                    value={form.birthPlace}
                    onChange={(value, place) => setForm({ ...form, birthPlace: value, birthPlaceObj: place })}
                    placeholder="Ville, Pays (ex: Paris, France)"
                    onStatusChange={setPlaceStatus}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Heure d'envoi de la guidance</label>
                  <input
                    type="time"
                    value={form.guidanceTime}
                    onChange={e => setForm({ ...form, guidanceTime: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-cosmic-900 border border-primary text-primary placeholder-primary focus:border-primary focus:ring-2 focus:ring-primary/50"
                    required
                  />
                  <span className="text-xs text-primary">Par défaut : 08:00</span>
                </div>
                {error && <div className="text-primary text-sm mb-2">{error}</div>}
                {success && <div className="text-primary text-sm mb-2">{success}</div>}
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-primary to-secondary text-cosmic-900 font-semibold hover:opacity-90 transition-colors"
                  disabled={loading || !isFormValid()}
                >
                  Compléter le profil
                </button>
              </form>
            </InteractiveCard>
          </div>
        </div>
      </div>
    );
  }

  return null;
} 