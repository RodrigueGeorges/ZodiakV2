import { ApiRateLimiter } from '../security/RateLimiter';
import { ApiMonitor } from '../monitoring/ApiMonitor';
import { CacheManager } from '../cache/CacheManager';

/**
 * Initialise tous les systèmes de gestion des APIs
 * À appeler au démarrage de l'application
 */
export function initializeApiSystems(): void {
  console.log('🚀 Initialisation des systèmes API...');

  // Initialiser le rate limiting
  try {
    ApiRateLimiter.initialize();
    console.log('✅ Rate limiting initialisé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du rate limiting:', error);
  }

  // Initialiser le monitoring
  try {
    const monitor = ApiMonitor.getInstance();
    
    // Ajouter un gestionnaire d'alertes par défaut
    monitor.addAlertHandler((alert) => {
      console.warn(`🚨 API Alert: ${alert}`);
      // Ici vous pourriez ajouter l'envoi d'alertes vers un service externe
      // comme Sentry, Slack, ou un système de monitoring
    });

    console.log('✅ Monitoring API initialisé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du monitoring:', error);
  }

  // Initialiser le cache
  try {
    const cache = CacheManager.getInstance();
    console.log('✅ Cache manager initialisé');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation du cache:', error);
  }

  // Nettoyer périodiquement les systèmes
  setInterval(() => {
    try {
      const monitor = ApiMonitor.getInstance();
      monitor.cleanup();
    } catch (error) {
      console.error('Erreur lors du nettoyage du monitoring:', error);
    }
  }, 10 * 60 * 1000); // Toutes les 10 minutes

  console.log('🎉 Tous les systèmes API sont initialisés');
}

/**
 * Obtient un rapport de santé de tous les systèmes API
 */
export function getApiHealthReport(): {
  rateLimiting: {
    openai: ReturnType<typeof ApiRateLimiter.getApiStats>;
    prokerala: ReturnType<typeof ApiRateLimiter.getApiStats>;
    brevo: ReturnType<typeof ApiRateLimiter.getApiStats>;
    nominatim: ReturnType<typeof ApiRateLimiter.getApiStats>;
    supabase: ReturnType<typeof ApiRateLimiter.getApiStats>;
  };
  monitoring: {
    performance: ReturnType<typeof ApiMonitor.prototype.getPerformanceReport>;
    health: ReturnType<typeof ApiMonitor.prototype.getAllHealthStatuses>;
  };
  cache: ReturnType<typeof CacheManager.prototype.getStats>;
} {
  const monitor = ApiMonitor.getInstance();
  const cache = CacheManager.getInstance();

  return {
    rateLimiting: {
      openai: ApiRateLimiter.getApiStats('openai'),
      prokerala: ApiRateLimiter.getApiStats('prokerala'),
      brevo: ApiRateLimiter.getApiStats('brevo'),
      nominatim: ApiRateLimiter.getApiStats('nominatim'),
      supabase: ApiRateLimiter.getApiStats('supabase'),
    },
    monitoring: {
      performance: monitor.getPerformanceReport(),
      health: monitor.getAllHealthStatuses(),
    },
    cache: cache.getStats(),
  };
}

/**
 * Réinitialise tous les systèmes (utile pour les tests)
 */
export function resetApiSystems(): void {
  console.log('🔄 Réinitialisation des systèmes API...');

  try {
    // Réinitialiser le rate limiting
    const rateLimiter = ApiRateLimiter['rateLimiter'];
    rateLimiter.resetAll();

    // Réinitialiser le cache
    const cache = CacheManager.getInstance();
    cache.clear();

    // Réinitialiser le monitoring
    const monitor = ApiMonitor.getInstance();
    // Note: Le monitoring ne peut pas être complètement réinitialisé
    // car il maintient l'historique des métriques

    console.log('✅ Systèmes API réinitialisés');
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
  }
}

export default {
  initializeApiSystems,
  getApiHealthReport,
  resetApiSystems,
}; 