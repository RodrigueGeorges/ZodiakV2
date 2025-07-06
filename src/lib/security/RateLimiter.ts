// ATTENTION: NE PAS MODIFIER CE FICHIER
// Système de rate limiting avancé pour protéger l'API

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // fenêtre de temps en millisecondes
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private static instance: RateLimiter;
  private limits = new Map<string, RateLimitEntry>();
  private configs = new Map<string, RateLimitConfig>();

  private constructor() {}

  static getInstance(): RateLimiter {
    if (!RateLimiter.instance) {
      RateLimiter.instance = new RateLimiter();
    }
    return RateLimiter.instance;
  }

  // Configurer un rate limit pour un service
  configureLimit(service: string, config: RateLimitConfig): void {
    this.configs.set(service, config);
  }

  // Vérifier si une requête est autorisée
  checkLimit(service: string, identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const config = this.configs.get(service);
    if (!config) {
      return { allowed: true, remaining: -1, resetTime: Date.now() };
    }

    const key = `${service}:${identifier}`;
    const now = Date.now();
    const entry = this.limits.get(key);

    // Si pas d'entrée ou fenêtre expirée, créer une nouvelle
    if (!entry || now > entry.resetTime) {
      const newEntry: RateLimitEntry = {
        count: 1,
        resetTime: now + config.windowMs
      };
      this.limits.set(key, newEntry);
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: newEntry.resetTime
      };
    }

    // Vérifier si la limite est dépassée
    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      };
    }

    // Incrémenter le compteur
    entry.count++;
    this.limits.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  // Marquer une requête comme réussie ou échouée
  recordRequest(service: string, identifier: string, success: boolean): void {
    const config = this.configs.get(service);
    if (!config) return;

    const key = `${service}:${identifier}`;
    const entry = this.limits.get(key);

    if (entry) {
      // Si configuré pour ignorer les requêtes réussies/échouées
      if ((success && config.skipSuccessfulRequests) || 
          (!success && config.skipFailedRequests)) {
        entry.count = Math.max(0, entry.count - 1);
        this.limits.set(key, entry);
      }
    }
  }

  // Obtenir les statistiques pour un service
  getStats(service: string): {
    activeLimits: number;
    totalRequests: number;
    blockedRequests: number;
  } {
    let activeLimits = 0;
    let totalRequests = 0;
    let blockedRequests = 0;

    for (const [key, entry] of this.limits.entries()) {
      if (key.startsWith(`${service}:`)) {
        activeLimits++;
        totalRequests += entry.count;
        
        const config = this.configs.get(service);
        if (config && entry.count >= config.maxRequests) {
          blockedRequests++;
        }
      }
    }

    return { activeLimits, totalRequests, blockedRequests };
  }

  // Nettoyer les entrées expirées
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.limits.delete(key));
  }

  // Réinitialiser les limites pour un identifiant
  reset(service: string, identifier: string): void {
    const key = `${service}:${identifier}`;
    this.limits.delete(key);
  }

  // Réinitialiser toutes les limites
  resetAll(): void {
    this.limits.clear();
  }
}

// Rate limiter spécialisé pour les APIs
export class ApiRateLimiter {
  private static rateLimiter = RateLimiter.getInstance();

  // Configuration par défaut pour différents services
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    'openai': {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
      skipFailedRequests: true
    },
    'prokerala': {
      maxRequests: 20,
      windowMs: 60 * 1000, // 1 minute
      skipFailedRequests: true
    },
    'brevo': {
      maxRequests: 50,
      windowMs: 60 * 1000, // 1 minute
      skipFailedRequests: true
    },
    'nominatim': {
      maxRequests: 30,
      windowMs: 60 * 1000, // 1 minute
      skipFailedRequests: true
    },
    'supabase': {
      maxRequests: 100,
      windowMs: 60 * 1000, // 1 minute
      skipFailedRequests: true
    }
  };

  static initialize(): void {
    // Configurer les limites par défaut
    Object.entries(this.DEFAULT_CONFIGS).forEach(([service, config]) => {
      this.rateLimiter.configureLimit(service, config);
    });

    // Nettoyer périodiquement
    setInterval(() => {
      this.rateLimiter.cleanup();
    }, 5 * 60 * 1000); // Toutes les 5 minutes
  }

  static checkApiLimit(service: string, userId: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    return this.rateLimiter.checkLimit(service, userId);
  }

  static recordApiRequest(service: string, userId: string, success: boolean): void {
    this.rateLimiter.recordRequest(service, userId, success);
  }

  static getApiStats(service: string) {
    return this.rateLimiter.getStats(service);
  }

  // Wrapper pour les appels API avec rate limiting
  static async withRateLimit<T>(
    service: string,
    userId: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const limitCheck = this.checkApiLimit(service, userId);
    
    if (!limitCheck.allowed) {
      throw new Error(`Rate limit exceeded. Retry after ${limitCheck.retryAfter} seconds.`);
    }

    try {
      const result = await apiCall();
      this.recordApiRequest(service, userId, true);
      return result;
    } catch (error) {
      this.recordApiRequest(service, userId, false);
      throw error;
    }
  }
}

export default RateLimiter;