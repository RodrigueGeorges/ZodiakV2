import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { StorageService } from '../storage';
import { AstrologyService } from '../astrology';
import { DateTime } from 'luxon';
import { toast } from 'react-hot-toast';
import type { DailyGuidance, NatalChart } from '../types/supabase';

interface PillarData {
  text: string;
  score: number;
  /** Pourquoi ce message — cite un transit. */
  why?: string;
}

interface GuidanceData {
  summary: string;
  love: PillarData;
  work: PillarData;
  energy: PillarData;
  /** 4ème pilier (optionnel) — finances / argent. */
  money?: PillarData;
  /** Boussole du jour : actions à privilégier / éviter. */
  dos?: string[];
  donts?: string[];
  /** Phrase courte personnalisée préfixée du prénom. */
  mantra?: string;
}

function toScoredSection(
  raw: unknown,
  defaultScore = 75,
): PillarData | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return undefined;
    return { text: trimmed, score: defaultScore };
  }
  if (typeof raw === 'object') {
    const obj = raw as { text?: unknown; score?: unknown; why?: unknown };
    return {
      text: typeof obj.text === 'string' ? obj.text : '',
      score: typeof obj.score === 'number' ? obj.score : defaultScore,
      why:
        typeof obj.why === 'string' && obj.why.trim() ? obj.why : undefined,
    };
  }
  return undefined;
}

function toStringList(raw: unknown): string[] | undefined {
  if (raw == null) return undefined;
  if (Array.isArray(raw)) {
    const cleaned = raw
      .map((it) => (typeof it === 'string' ? it.trim() : String(it ?? '').trim()))
      .filter(Boolean);
    return cleaned.length > 0 ? cleaned : undefined;
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return toStringList(parsed);
    } catch {
      /* ignore */
    }
    const split = raw
      .split(/\r?\n|·|•/)
      .map((s) => s.trim())
      .filter(Boolean);
    return split.length > 0 ? split : undefined;
  }
  return undefined;
}

function mapStoredToGuidance(stored: any): GuidanceData {
  return {
    summary: stored.summary,
    love: toScoredSection(stored.love) ?? { text: '', score: 0 },
    work: toScoredSection(stored.work) ?? { text: '', score: 0 },
    energy: toScoredSection(stored.energy) ?? { text: '', score: 0 },
    money: toScoredSection(stored.money),
    dos: toStringList(stored.dos),
    donts: toStringList(stored.donts),
    mantra: typeof stored.mantra === 'string' && stored.mantra.trim()
      ? stored.mantra
      : undefined,
  };
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
      const storedGuidance = await StorageService.getDailyGuidance(user.id, today);
      if (storedGuidance) {
        return mapStoredToGuidance(storedGuidance);
      }
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
      const existingGuidance = await StorageService.getDailyGuidance(user.id, today);
      if (existingGuidance) {
        setGuidance(mapStoredToGuidance(existingGuidance));
        setLoading(false);
        toast('Une guidance existe déjà pour aujourd\'hui.');
        return;
      }

      if (!profile.natal_chart || (typeof profile.natal_chart === 'string' && profile.natal_chart.trim() === '')) {
        throw new Error('Thème natal non disponible. Veuillez compléter votre profil.');
      }

      const firstName = profile.name?.split(' ')[0]?.trim() || undefined;

      const guidanceData = await AstrologyService.generateDailyGuidance(
        user.id,
        profile.natal_chart as NatalChart,
        today,
        profile.birth_place,
        firstName,
      );

      if (!guidanceData || !guidanceData.summary || !guidanceData.love || !guidanceData.work || !guidanceData.energy) {
        throw new Error('La génération de la guidance a échoué (données incomplètes ou erreur API). Veuillez réessayer plus tard.');
      }

      const { summary, love, work, energy, money, dos, donts, mantra } = guidanceData;
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
        money: money ?? null,
        mantra: mantra ?? null,
        dos: dos ?? null,
        donts: donts ?? null,
        created_at: new Date().toISOString(),
      };
      const saved = await StorageService.saveDailyGuidance(guidanceToSave);
      if (saved) {
        setGuidance(mapStoredToGuidance(guidanceToSave));
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