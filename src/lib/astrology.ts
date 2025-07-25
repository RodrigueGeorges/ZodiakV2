import { DateTime } from 'luxon';
import OpenAIService from './services/OpenAIService';
import { ApiError } from './errors';
import { z } from 'zod';

// Schéma de validation
const BirthDataSchema = z.object({
  date_of_birth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time_of_birth: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  location: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/)
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

export interface GuidanceResponse {
  summary: string;
  love: string;
  work: string;
  energy: string;
}

export class AstrologyService {
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 heures
  private static readonly RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
  private static readonly MAX_REQUESTS_PER_WINDOW = 10;
  private static requestCounts = new Map<string, { count: number; resetTime: number }>();

  private static getFromCache<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`astro_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > this.CACHE_DURATION) {
        localStorage.removeItem(`astro_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  private static setInCache<T>(key: string, data: T): void {
    try {
      const cacheData = {
        data,
        timestamp: Date.now()
      };
      localStorage.setItem(`astro_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  private static checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const limit = this.requestCounts.get(identifier);

    if (!limit || now > limit.resetTime) {
      this.requestCounts.set(identifier, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      });
      return true;
    }

    if (limit.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    limit.count++;
    return true;
  }

  private static parseLocation(location: string): { latitude: number; longitude: number } {
    const [lat, lng] = location.split(',').map(s => parseFloat(s.trim()));
    if (isNaN(lat) || isNaN(lng)) {
      throw new ApiError('Format de localisation invalide', 400);
    }
    return { latitude: lat, longitude: lng };
  }

  private static formatDateTime(date: string, time: string): string {
    return `${date}T${time}:00Z`;
  }

  private static async callProkeralaApi(endpoint: string, params: Record<string, string>) {
    // Appel sécurisé via la fonction Netlify serverless
    const response = await fetch('/.netlify/functions/astrology', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
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
      console.error(`Erreur de l'API astrologique (${response.status}) sur ${endpoint}:`, errorMessage);
      throw new ApiError(`Erreur de l'API astrologique: ${errorMessage}`, response.status);
    }

    return response.json();
  }

  private static transformNatalChart(data: Record<string, unknown>): NatalChart {
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
    const ascendantData = data.ascendant as {
      sign: string;
      degree: number;
    };

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
      ascendant: {
        sign: ascendantData.sign,
        degree: ascendantData.degree,
      },
    };
  }

  static async calculateNatalChart(birthData: BirthData): Promise<NatalChart> {
    try {
      // Validation des données
      const validatedData = BirthDataSchema.parse(birthData);
      
      const { latitude, longitude } = this.parseLocation(validatedData.location);
      const datetime = this.formatDateTime(validatedData.date_of_birth, validatedData.time_of_birth);
      
      // Clé de cache plus robuste
      const cacheKey = `natal_${validatedData.date_of_birth}_${validatedData.time_of_birth}_${Math.round(latitude * 10000).toString()}_${Math.round(longitude * 10000).toString()}`;
      const cached = this.getFromCache<NatalChart>(cacheKey);
      if (cached) {
              // console.log('✅ Thème natal récupéré du cache');
      return cached;
      }

      // Vérification du rate limit
      if (!this.checkRateLimit('natal_chart')) {
        throw new ApiError('Trop de requêtes. Veuillez réessayer dans quelques instants.', 429);
      }

      // console.log('🔄 Calcul du thème natal via API Prokerala...');
      const params = {
        datetime: datetime,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        house_system: 'placidus',
      };

      const apiResponse = await this.callProkeralaApi('western/chart', params);
      const chart = this.transformNatalChart(apiResponse);

      // Cache pour 24h (thème natal ne change jamais)
      this.setInCache(cacheKey, chart);
      // console.log('💾 Thème natal mis en cache');
      
      return chart;
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ApiError('Données de naissance invalides', 400);
      }
      console.error('Error calculating natal chart:', error);
      throw error instanceof ApiError ? error : new ApiError('Erreur lors du calcul du thème natal', 500);
    }
  }

  static async generateDailyGuidance(userId: string, natalChart: NatalChart, date: string, birthPlace?: string): Promise<GuidanceResponse> {
    try {
      // Clé de cache pour la guidance quotidienne
      const cacheKey = `guidance_${userId}_${date}`;
      const cached = this.getFromCache<GuidanceResponse>(cacheKey);
      if (cached) {
              // console.log('✅ Guidance quotidienne récupérée du cache');
      return cached;
      }

      // Vérification du rate limit
      if (!this.checkRateLimit(userId)) {
        throw new ApiError('Trop de requêtes. Veuillez réessayer dans quelques instants.', 429);
      }

      // console.log('🔄 Génération de la guidance quotidienne...');
      
      // Calculer les transits du jour avec le lieu de naissance de l'utilisateur
      const transits = await this.calculateDailyTransits(date, birthPlace);

      // Générer la guidance avec OpenAI
      const guidance = await OpenAIService.generateGuidance(natalChart, transits);
      
      // Cache pour 24h (guidance quotidienne)
      this.setInCache(cacheKey, guidance.data || guidance);
      // console.log('💾 Guidance quotidienne mise en cache');
      
      return guidance.data || guidance;
    } catch (error) {
      console.error('Error generating guidance:', error);
      throw error instanceof ApiError ? error : new ApiError('Erreur lors de la génération de la guidance', 500);
    }
  }

  // Méthode pour vérifier si un thème natal existe déjà
  static async getExistingNatalChart(birthData: BirthData): Promise<NatalChart | null> {
    try {
      const validatedData = BirthDataSchema.parse(birthData);
      const { latitude, longitude } = this.parseLocation(validatedData.location);
      
      const cacheKey = `natal_${validatedData.date_of_birth}_${validatedData.time_of_birth}_${Math.round(latitude * 10000).toString()}_${Math.round(longitude * 10000).toString()}`;
      return this.getFromCache<NatalChart>(cacheKey);
    } catch (error) {
      return null;
    }
  }

  // Méthode pour précharger la guidance du jour
  static async preloadDailyGuidance(userId: string, natalChart: NatalChart): Promise<void> {
    try {
      const today = DateTime.now().toISODate();
      const cacheKey = `guidance_${userId}_${today}`;
      
      // Vérifier si la guidance d'aujourd'hui existe déjà
      const existing = this.getFromCache<GuidanceResponse>(cacheKey);
      if (existing) {
        // console.log('✅ Guidance du jour déjà disponible');
        return;
      }

      // Précharger en arrière-plan
      // console.log('🔄 Préchargement de la guidance du jour...');
      this.generateDailyGuidance(userId, natalChart, today).catch(error => {
        console.warn('Erreur lors du préchargement de la guidance:', error);
      });
    } catch (error) {
      console.warn('Erreur lors du préchargement:', error);
    }
  }

  static async calculateDailyTransits(date: string, birthPlace?: string): Promise<Record<string, unknown>> {
    try {
      // Appel à l'API Prokerala pour obtenir les vrais transits du jour
      const response = await fetch('/.netlify/functions/astrology', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          type: 'transits',
          date: date,
          time: '12:00', // Transits calculés à midi par défaut
          place: birthPlace || '0,0' // Coordonnées par défaut (seront remplacées par le lieu de naissance)
        }),
      });

      if (!response.ok) {
        console.warn('Erreur lors du calcul des transits, utilisation des transits simulés');
        return this.getSimulatedTransits(date);
      }

      const transitsData = await response.json();
      return transitsData;
    } catch (error) {
      console.warn('Erreur lors du calcul des transits, utilisation des transits simulés:', error);
      return this.getSimulatedTransits(date);
    }
  }

  private static getSimulatedTransits(date: string): Record<string, unknown> {
    // Fallback : transits simulés si l'API échoue
    const dateObj = new Date(date);
    const dayOfYear = Math.floor((dateObj.getTime() - new Date(dateObj.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    const baseSunDegree = (dayOfYear * 0.9856) % 360;
    const baseMoonDegree = (dayOfYear * 13.2) % 360;
    
    const signs = ['Bélier', 'Taureau', 'Gémeaux', 'Cancer', 'Lion', 'Vierge', 'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons'];
    
    const getSignFromDegree = (degree: number): string => {
      const signIndex = Math.floor(degree / 30);
      return signs[signIndex % 12];
    };
    
    return {
      date: date,
      planets: [
        { name: 'Soleil', sign: getSignFromDegree(baseSunDegree), degree: Math.floor(baseSunDegree % 30) },
        { name: 'Lune', sign: getSignFromDegree(baseMoonDegree), degree: Math.floor(baseMoonDegree % 30) },
        { name: 'Mercure', sign: getSignFromDegree(baseSunDegree + (dayOfYear % 30)), degree: Math.floor((baseSunDegree + (dayOfYear % 30)) % 30) },
        { name: 'Vénus', sign: getSignFromDegree(baseSunDegree + (dayOfYear % 45)), degree: Math.floor((baseSunDegree + (dayOfYear % 45)) % 30) },
        { name: 'Mars', sign: getSignFromDegree(baseSunDegree + (dayOfYear % 60)), degree: Math.floor((baseSunDegree + (dayOfYear % 60)) % 30) }
      ],
      aspects: [
        { planet1: 'Soleil', planet2: 'Mars', type: dayOfYear % 2 === 0 ? 'trigone' : 'carré', orbe: (dayOfYear % 5) + 1 },
        { planet1: 'Vénus', planet2: 'Lune', type: dayOfYear % 3 === 0 ? 'sextile' : 'opposition', orbe: (dayOfYear % 3) + 1 }
      ]
    };
  }
}