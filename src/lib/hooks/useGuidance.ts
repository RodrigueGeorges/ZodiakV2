import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { StorageService } from '../storage';
import { AstrologyService } from '../astrology';
import { DateTime } from 'luxon';
import { toast } from 'react-hot-toast';
import type { DailyGuidance, NatalChart } from '../types/supabase';

interface GuidanceData {
  summary: string;
  love: { text: string; score: number };
  work: { text: string; score: number };
  energy: { text: string; score: number };
}

interface UseGuidanceReturn {
  guidance: GuidanceData | null;
  loading: boolean;
  error: string | null;
  generateGuidance: () => Promise<void>;
  refreshGuidance: () => Promise<void>;
}

export function useGuidance(): UseGuidanceReturn {
  const { user, profile } = useAuth();
  const [guidance, setGuidance] = useState<GuidanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastAttemptDate, setLastAttemptDate] = useState<string | null>(null);

  const today = DateTime.now().toISODate();

  // Vérifier si on a déjà tenté de générer une guidance aujourd'hui
  // const hasAttemptedToday = lastAttemptDate === today;

  const loadGuidanceFromStorage = useCallback(async () => {
    if (!user?.id) return null;

    try {
      // console.log('🔍 Recherche de guidance existante dans Supabase...');
      const storedGuidance = await StorageService.getDailyGuidance(user.id, today);
      
      if (storedGuidance) {
        // console.log('✅ Guidance trouvée dans Supabase');
        return {
          summary: storedGuidance.summary,
          love: typeof storedGuidance.love === 'string' 
            ? { text: storedGuidance.love, score: 75 } 
            : storedGuidance.love as { text: string; score: number },
          work: typeof storedGuidance.work === 'string' 
            ? { text: storedGuidance.work, score: 75 } 
            : storedGuidance.work as { text: string; score: number },
          energy: typeof storedGuidance.energy === 'string' 
            ? { text: storedGuidance.energy, score: 75 } 
            : storedGuidance.energy as { text: string; score: number }
        };
      }
      
      // console.log('⚠️ Aucune guidance trouvée dans Supabase');
      return null;
    } catch (error) {
      console.error('Erreur lors du chargement de la guidance:', error);
      return null;
    }
  }, [user?.id, today]);

  const generateGuidance = useCallback(async () => {
    if (!user?.id || !profile) {
      setError('Utilisateur non connecté ou profil incomplet');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Vérifier si une guidance existe déjà pour aujourd'hui
      const existingGuidance = await StorageService.getDailyGuidance(user.id, today);
      if (existingGuidance) {
        setGuidance({
          summary: existingGuidance.summary,
          love: typeof existingGuidance.love === 'string' 
            ? { text: existingGuidance.love, score: 75 } 
            : existingGuidance.love as { text: string; score: number },
          work: typeof existingGuidance.work === 'string' 
            ? { text: existingGuidance.work, score: 75 } 
            : existingGuidance.work as { text: string; score: number },
          energy: typeof existingGuidance.energy === 'string' 
            ? { text: existingGuidance.energy, score: 75 } 
            : existingGuidance.energy as { text: string; score: number }
        });
        setLoading(false);
        toast('Une guidance existe déjà pour aujourd\'hui.');
        return;
      }

      // console.log('🚀 Génération d\'une nouvelle guidance...');
      if (!profile.natal_chart || typeof profile.natal_chart === 'string') {
        throw new Error('Thème natal non disponible. Veuillez compléter votre profil.');
      }
      
      // Utiliser AstrologyService.generateDailyGuidance qui gère les transits et la génération
      const guidanceData = await AstrologyService.generateDailyGuidance(
        user.id,
        profile.natal_chart as NatalChart,
        today,
        profile.birth_place
      );
      
      // Vérification stricte des champs requis
      if (!guidanceData || !guidanceData.summary || !guidanceData.love || !guidanceData.work || !guidanceData.energy) {
        throw new Error('La génération de la guidance a échoué (données incomplètes ou erreur API). Veuillez réessayer plus tard.');
      }
      
      const { summary, love, work, energy } = guidanceData;
      if (
        typeof summary !== 'string' || summary.trim() === '' ||
        typeof love !== 'string' || love.trim() === '' ||
        typeof work !== 'string' || work.trim() === '' ||
        typeof energy !== 'string' || energy.trim() === ''
      ) {
        throw new Error('La génération de la guidance a échoué (texte vide). Veuillez réessayer plus tard.');
      }
      
      const guidanceToSave: DailyGuidance = {
        id: crypto.randomUUID(),
        user_id: user.id,
        date: today,
        summary,
        love,
        work,
        energy,
        created_at: new Date().toISOString()
      };
      const saved = await StorageService.saveDailyGuidance(guidanceToSave);
      if (saved) {
        setGuidance(guidanceData);
        toast.success('Guidance générée avec succès !');
      } else {
        throw new Error('Erreur lors de la sauvegarde de la guidance');
      }
    } catch (error) {
      console.error('Erreur lors de la génération de la guidance:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [user?.id, profile, today]);

  const refreshGuidance = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // console.log('🔄 Actualisation de la guidance...');
      
      // Vider le cache pour forcer le rechargement depuis Supabase
      StorageService.clearUserCache(user.id);
      
      const storedGuidance = await loadGuidanceFromStorage();
      
      if (storedGuidance) {
        setGuidance(storedGuidance);
        // console.log('✅ Guidance actualisée');
      } else {
        setGuidance(null);
        // console.log('⚠️ Aucune guidance trouvée après actualisation');
      }
    } catch (error) {
      console.error('Erreur lors de l\'actualisation:', error);
      setError('Erreur lors de l\'actualisation');
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadGuidanceFromStorage]);

  // Charger la guidance au montage du composant
  useEffect(() => {
    const loadGuidance = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const storedGuidance = await loadGuidanceFromStorage();
        
        if (storedGuidance) {
          setGuidance(storedGuidance);
          // console.log('✅ Guidance chargée depuis Supabase');
        } else {
          // console.log('⚠️ Aucune guidance disponible pour aujourd\'hui');
          setGuidance(null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement initial:', error);
        setError('Erreur lors du chargement de la guidance');
      } finally {
        setLoading(false);
      }
    };

    loadGuidance();
  }, [user?.id, loadGuidanceFromStorage]);

  // Charger la date de dernière tentative depuis localStorage
  useEffect(() => {
    const savedAttemptDate = localStorage.getItem(`guidance_attempt_${user?.id}_${today}`);
    if (savedAttemptDate) {
      setLastAttemptDate(savedAttemptDate);
    }
  }, [user?.id, today]);

  // Sauvegarder la date de tentative
  useEffect(() => {
    if (lastAttemptDate && user?.id) {
      localStorage.setItem(`guidance_attempt_${user.id}_${today}`, lastAttemptDate);
    }
  }, [lastAttemptDate, user?.id, today]);

  return {
    guidance,
    loading,
    error,
    generateGuidance,
    refreshGuidance
  };
}