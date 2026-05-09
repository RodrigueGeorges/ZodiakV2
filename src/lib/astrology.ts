import { DateTime } from 'luxon';
import OpenAIService from './services/OpenAIService';
import { ApiError } from './errors';
import { z } from 'zod';

/**
 * Service astrologie côté client.
 *
 * NOTE D'ARCHITECTURE — converti de class statique → module de fonctions
 * (mai 2026). Raison : Terser + tree-shaking sur des classes 100% statiques
 * cassait le re-export ESM (`Uncaught SyntaxError: Export 'AstrologyService'
 * is not defined in module`). Les fonctions exportées + objet d'agrégation
 * `AstrologyService` permettent :
 *   - de garder la compat des imports existants (`AstrologyService.method()`)
 *   - tout en évitant les pièges de bundling sur les class statics.
 */

// ─── Validation ─────────────────────────────────────────────────────────
const BirthDataSchema = z.object({
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_of_birth: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  location: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/),
});

export interface BirthData {
  date_of_birth: string;
  time_of_birth: string;
  location: string;
}

export interface Planet {
  name: string;
  longitude: number;
  house: number;
  sign: string;
  retrograde: boolean;
}

export interface House {
  number: number;
  sign: string;
  degree: number;
}

export interface NatalChart {
  planets: Planet[];
  houses: House[];
  ascendant: {
    sign: string;
    degree: number;
  };
}

/**
 * Format moderne d'un pilier : objet structuré avec texte, score 0-100 et
 * une phrase "why" qui explique le transit déclencheur (pédagogie type Co-Star).
 *
 * Pour rester rétro-compat, on accepte aussi des chaînes simples côté
 * lecture (parseSection() côté UI gère les deux formats).
 */
export interface GuidancePillar {
  text: string;
  score: number;
  /** Pourquoi ce message ? Cite un transit / planète. */
  why?: string;
}

export interface GuidanceResponse {
  summary: string;
  love: string | GuidancePillar;
  work: string | GuidancePillar;
  energy: string | GuidancePillar;
  /** 4ème pilier (optionnel) — finances / argent. */
  money?: string | GuidancePillar;
  /** 3 actions courtes à privilégier ce jour. */
  dos?: string[];
  /** 3 actions courtes à éviter ce jour. */
  donts?: string[];
  /** Phrase courte personnalisée (préfixée du prénom de l'utilisateur). */
  mantra?: string;
}

// ─── Cache + rate-limit (état interne du module) ────────────────────────
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 h
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 min
const MAX_REQUESTS_PER_WINDOW = 10;
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function getFromCache<T>(key: string): T | null {
  try {
    const cached = localStorage.getItem(`astro_${key}`);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) {
      localStorage.removeItem(`astro_${key}`);
      return null;
    }
    return data;
  } catch (error) {
    console.warn('Cache read error:', error);
    return null;
  }
}

function setInCache<T>(key: string, data: T): void {
  try {
    const cacheData = { data, timestamp: Date.now() };
    localStorage.setItem(`astro_${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Cache write error:', error);
  }
}

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = requestCounts.get(identifier);
  if (!limit || now > limit.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }
  if (limit.count >= MAX_REQUESTS_PER_WINDOW) return false;
  limit.count++;
  return true;
}

function parseLocation(location: string): { latitude: number; longitude: number } {
  const [lat, lng] = location.split(',').map((s) => parseFloat(s.trim()));
  if (isNaN(lat) || isNaN(lng)) {
    throw new ApiError('Format de localisation invalide', 'INVALID_LOCATION');
  }
  return { latitude: lat, longitude: lng };
}

function formatDateTime(date: string, time: string): string {
  return `${date}T${time}:00Z`;
}

async function callProkeralaApi(
  endpoint: string,
  params: Record<string, string>
) {
  const response = await fetch('/.netlify/functions/astrology', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      type: endpoint === 'western/chart' ? 'natal_chart' : 'transits',
      birthDate: params.datetime?.split('T')[0],
      birthTime: params.datetime?.split('T')[1]?.replace('Z', ''),
      birthPlace: `${params.latitude},${params.longitude}`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData?.error || response.statusText;
    console.error(
      `Erreur de l'API astrologique (${response.status}) sur ${endpoint}:`,
      errorMessage
    );
    throw new ApiError(`Erreur de l'API astrologique: ${errorMessage}`);
  }
  return response.json();
}

function transformNatalChart(data: Record<string, unknown>): NatalChart {
  const planetsData = data.planets as Array<{
    name: string;
    longitude: number;
    house: number;
    sign: string;
    is_retrograde: string;
  }>;
  const housesData = data.houses as Array<{
    house_number: number;
    sign: string;
    degree: number;
  }>;
  const ascendantData = data.ascendant as { sign: string; degree: number };

  return {
    planets: planetsData.map((p) => ({
      name: p.name,
      longitude: p.longitude,
      house: p.house,
      sign: p.sign,
      retrograde: p.is_retrograde === 'true',
    })),
    houses: housesData.map((h) => ({
      number: h.house_number,
      sign: h.sign,
      degree: h.degree,
    })),
    ascendant: { sign: ascendantData.sign, degree: ascendantData.degree },
  };
}

function getSimulatedTransits(date: string): Record<string, unknown> {
  const dateObj = new Date(date);
  const dayOfYear = Math.floor(
    (dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const baseSunDegree = (dayOfYear * 0.9856) % 360;
  const baseMoonDegree = (dayOfYear * 13.2) % 360;
  const signs = [
    'Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge',
    'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons',
  ];
  const signFromDegree = (deg: number) => signs[Math.floor(deg / 30) % 12];

  return {
    date,
    planets: [
      { name: 'Soleil', sign: signFromDegree(baseSunDegree), degree: Math.floor(baseSunDegree % 30) },
      { name: 'Lune', sign: signFromDegree(baseMoonDegree), degree: Math.floor(baseMoonDegree % 30) },
      { name: 'Mercure', sign: signFromDegree(baseSunDegree + (dayOfYear % 30)), degree: Math.floor((baseSunDegree + (dayOfYear % 30)) % 30) },
      { name: 'Vénus', sign: signFromDegree(baseSunDegree + (dayOfYear % 45)), degree: Math.floor((baseSunDegree + (dayOfYear % 45)) % 30) },
      { name: 'Mars', sign: signFromDegree(baseSunDegree + (dayOfYear % 60)), degree: Math.floor((baseSunDegree + (dayOfYear % 60)) % 30) },
    ],
    aspects: [
      { planet1: 'Soleil', planet2: 'Mars', type: dayOfYear % 2 === 0 ? 'trigone' : 'carré', orbe: (dayOfYear % 5) + 1 },
      { planet1: 'Vénus', planet2: 'Lune', type: dayOfYear % 3 === 0 ? 'sextile' : 'opposition', orbe: (dayOfYear % 3) + 1 },
    ],
  };
}

// ─── API publique ───────────────────────────────────────────────────────

export async function calculateNatalChart(birthData: BirthData): Promise<NatalChart> {
  try {
    const validatedData = BirthDataSchema.parse(birthData);
    const { latitude, longitude } = parseLocation(validatedData.location);
    const datetime = formatDateTime(
      validatedData.date_of_birth,
      validatedData.time_of_birth
    );

    const cacheKey = `natal_${validatedData.date_of_birth}_${validatedData.time_of_birth}_${Math.round(latitude * 10000)}_${Math.round(longitude * 10000)}`;
    const cached = getFromCache<NatalChart>(cacheKey);
    if (cached) return cached;

    if (!checkRateLimit('natal_chart')) {
      throw new ApiError(
        'Trop de requêtes. Veuillez réessayer dans quelques instants.',
        'RATE_LIMITED'
      );
    }

    const params = {
      datetime,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      house_system: 'placidus',
    };
    const apiResponse = await callProkeralaApi('western/chart', params);
    const chart = transformNatalChart(apiResponse);
    setInCache(cacheKey, chart);
    return chart;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ApiError('Données de naissance invalides', 'INVALID_BIRTH_DATA');
    }
    console.error('Error calculating natal chart:', error);
    throw error instanceof ApiError
      ? error
      : new ApiError('Erreur lors du calcul du thème natal');
  }
}

export async function generateDailyGuidance(
  userId: string,
  natalChart: NatalChart,
  date: string,
  birthPlace?: string,
  firstName?: string,
): Promise<GuidanceResponse> {
  try {
    const cacheKey = `guidance_${userId}_${date}`;
    const cached = getFromCache<GuidanceResponse>(cacheKey);
    if (cached) return cached;

    if (!checkRateLimit(userId)) {
      throw new ApiError(
        'Trop de requêtes. Veuillez réessayer dans quelques instants.',
        'RATE_LIMITED'
      );
    }

    const transits = await calculateDailyTransits(date, birthPlace);
    const guidance = await OpenAIService.generateGuidance(
      natalChart,
      transits,
      userId,
      firstName,
    );
    const result = (guidance.data || guidance) as GuidanceResponse;
    setInCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error generating guidance:', error);
    throw error instanceof ApiError
      ? error
      : new ApiError('Erreur lors de la génération de la guidance');
  }
}

export async function getExistingNatalChart(
  birthData: BirthData
): Promise<NatalChart | null> {
  try {
    const validatedData = BirthDataSchema.parse(birthData);
    const { latitude, longitude } = parseLocation(validatedData.location);
    const cacheKey = `natal_${validatedData.date_of_birth}_${validatedData.time_of_birth}_${Math.round(latitude * 10000)}_${Math.round(longitude * 10000)}`;
    return getFromCache<NatalChart>(cacheKey);
  } catch {
    return null;
  }
}

export async function preloadDailyGuidance(
  userId: string,
  natalChart: NatalChart
): Promise<void> {
  try {
    const today = DateTime.now().toISODate();
    if (!today) return;
    const cacheKey = `guidance_${userId}_${today}`;
    const existing = getFromCache<GuidanceResponse>(cacheKey);
    if (existing) return;
    generateDailyGuidance(userId, natalChart, today).catch((error) => {
      console.warn('Erreur lors du préchargement de la guidance:', error);
    });
  } catch (error) {
    console.warn('Erreur lors du préchargement:', error);
  }
}

export async function calculateDailyTransits(
  date: string,
  birthPlace?: string
): Promise<Record<string, unknown>> {
  try {
    const response = await fetch('/.netlify/functions/astrology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        type: 'transits',
        date,
        time: '12:00',
        place: birthPlace || '0,0',
      }),
    });
    if (!response.ok) {
      console.warn('Erreur lors du calcul des transits, utilisation des transits simulés');
      return getSimulatedTransits(date);
    }
    return response.json();
  } catch (error) {
    console.warn(
      'Erreur lors du calcul des transits, utilisation des transits simulés:',
      error
    );
    return getSimulatedTransits(date);
  }
}

// ─── Compat : objet d'agrégation ────────────────────────────────────────
//
// Les imports historiques utilisent `AstrologyService.method()`. On garde
// cette surface en exposant un OBJET (et non plus une class statique). Du
// point de vue du bundler, c'est un plain object → aucun risque de tree-
// shaking pathologique sur les class statics.
//
// Les nouveaux usages devraient préférer les functions individuelles
// (import nommé direct), c'est plus simple et plus optimisable.

export const AstrologyService = {
  calculateNatalChart,
  generateDailyGuidance,
  getExistingNatalChart,
  preloadDailyGuidance,
  calculateDailyTransits,
} as const;
