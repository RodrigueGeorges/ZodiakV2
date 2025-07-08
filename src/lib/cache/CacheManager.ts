interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  defaultTTL: number; // en millisecondes
  maxSize: number; // nombre maximum d'entrées
  cleanupInterval: number; // intervalle de nettoyage en millisecondes
}

export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, CacheEntry<unknown>>();
  private config: CacheConfig;
  private cleanupTimer?: NodeJS.Timeout;

  private constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 24 * 60 * 60 * 1000, // 24 heures par défaut
      maxSize: 1000,
      cleanupInterval: 60 * 60 * 1000, // 1 heure
      ...config
    };

    this.startCleanupTimer();
  }

  static getInstance(config?: Partial<CacheConfig>): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL
    };

    // Gérer la taille maximale du cache
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry) {
      return null;
    }

    // Vérifier si l'entrée a expiré
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  // Générer une clé de cache basée sur des paramètres
  static generateKey(prefix: string, params: Record<string, unknown>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}:${JSON.stringify(params[key])}`)
      .join('|');
    
    return `${prefix}:${sortedParams}`;
  }

  // Cache avec fonction de génération automatique
  async getOrSet<T>(
    key: string,
    generator: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await generator();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      console.error(`Error generating cache data for key ${key}:`, error);
      throw error;
    }
  }

  // Cache avec validation de données
  getWithValidation<T>(
    key: string,
    validator: (data: unknown) => data is T
  ): T | null {
    const data = this.get<unknown>(key);
    if (data === null || !validator(data)) {
      this.delete(key);
      return null;
    }
    return data;
  }

  // Statistiques du cache
  getStats() {
    const now = Date.now();
    let expiredCount = 0;
    let totalAge = 0;

    for (const [, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      totalAge += age;
      
      if (age > entry.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      expiredCount,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      hitRate: 0 // À implémenter avec un compteur de hits
    };
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    this.cache.clear();
  }
}

// Cache spécialisé pour les APIs
export class ApiCache {
  private static cache = CacheManager.getInstance({
    defaultTTL: 60 * 60 * 1000, // 1 heure pour les APIs
    maxSize: 500,
    cleanupInterval: 30 * 60 * 1000 // 30 minutes
  });

  static async getCachedApiResponse<T>(
    endpoint: string,
    params: Record<string, unknown>,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const key = CacheManager.generateKey(`api:${endpoint}`, params);
    return this.cache.getOrSet(key, fetcher, ttl);
  }

  static invalidateApiCache(endpoint: string, params?: Record<string, unknown>): void {
    if (params) {
      const key = CacheManager.generateKey(`api:${endpoint}`, params);
      this.cache.delete(key);
    } else {
      // Invalider toutes les entrées pour cet endpoint
      const keys = this.cache.keys().filter(key => key.startsWith(`api:${endpoint}`));
      keys.forEach(key => this.cache.delete(key));
    }
  }

  static getStats() {
    return this.cache.getStats();
  }
}

export default CacheManager; 