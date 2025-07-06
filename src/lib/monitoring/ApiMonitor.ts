interface ApiCallMetrics {
  service: string;
  endpoint: string;
  method: string;
  duration: number;
  statusCode: number;
  success: boolean;
  timestamp: string;
  userId?: string;
  errorMessage?: string;
}

interface ApiHealthStatus {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastCheck: string;
  uptime: number;
}

interface AlertConfig {
  errorRateThreshold: number; // pourcentage
  responseTimeThreshold: number; // millisecondes
  consecutiveFailuresThreshold: number;
}

export class ApiMonitor {
  private static instance: ApiMonitor;
  private metrics: ApiCallMetrics[] = [];
  private healthStatus = new Map<string, ApiHealthStatus>();
  private alertConfig: AlertConfig = {
    errorRateThreshold: 10, // 10%
    responseTimeThreshold: 5000, // 5 secondes
    consecutiveFailuresThreshold: 3
  };
  private consecutiveFailures = new Map<string, number>();
  private alertHandlers: ((alert: string) => void)[] = [];

  private constructor() {
    this.startPeriodicHealthCheck();
  }

  static getInstance(): ApiMonitor {
    if (!ApiMonitor.instance) {
      ApiMonitor.instance = new ApiMonitor();
    }
    return ApiMonitor.instance;
  }

  // Enregistrer un appel API
  recordApiCall(metrics: Omit<ApiCallMetrics, 'timestamp'>): void {
    const fullMetrics: ApiCallMetrics = {
      ...metrics,
      timestamp: new Date().toISOString()
    };

    this.metrics.push(fullMetrics);
    
    // Limiter la taille du tableau de métriques
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }

    // Mettre à jour le statut de santé
    this.updateHealthStatus(metrics.service, fullMetrics);

    // Vérifier les alertes
    this.checkAlerts(metrics.service);
  }

  // Obtenir les métriques pour un service
  getServiceMetrics(service: string, timeWindow: number = 60 * 60 * 1000): {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
    errorRate: number;
    recentCalls: ApiCallMetrics[];
  } {
    const now = Date.now();
    const windowStart = now - timeWindow;
    
    const recentMetrics = this.metrics.filter(
      m => m.service === service && new Date(m.timestamp).getTime() > windowStart
    );

    const totalCalls = recentMetrics.length;
    const successfulCalls = recentMetrics.filter(m => m.success).length;
    const failedCalls = totalCalls - successfulCalls;
    const averageResponseTime = totalCalls > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls 
      : 0;
    const errorRate = totalCalls > 0 ? (failedCalls / totalCalls) * 100 : 0;

    return {
      totalCalls,
      successfulCalls,
      failedCalls,
      averageResponseTime,
      errorRate,
      recentCalls: recentMetrics.slice(-100) // Derniers 100 appels
    };
  }

  // Obtenir le statut de santé d'un service
  getHealthStatus(service: string): ApiHealthStatus | null {
    return this.healthStatus.get(service) || null;
  }

  // Obtenir le statut de santé de tous les services
  getAllHealthStatuses(): ApiHealthStatus[] {
    return Array.from(this.healthStatus.values());
  }

  // Configurer les alertes
  configureAlerts(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
  }

  // Ajouter un gestionnaire d'alertes
  addAlertHandler(handler: (alert: string) => void): void {
    this.alertHandlers.push(handler);
  }

  // Wrapper pour les appels API avec monitoring
  static async withMonitoring<T>(
    service: string,
    endpoint: string,
    method: string,
    userId: string | undefined,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const monitor = ApiMonitor.getInstance();
    const startTime = Date.now();
    let success = false;
    let statusCode = 200;
    let errorMessage: string | undefined;

    try {
      const result = await apiCall();
      success = true;
      return result;
    } catch (error) {
      success = false;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Essayer d'extraire le code de statut
      if (error instanceof Response) {
        statusCode = error.status;
      }
      
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      
      monitor.recordApiCall({
        service,
        endpoint,
        method,
        duration,
        statusCode,
        success,
        userId,
        errorMessage
      });
    }
  }

  private updateHealthStatus(service: string, metrics: ApiCallMetrics): void {
    const existing = this.healthStatus.get(service);
    const now = Date.now();
    
    // Calculer les métriques sur les 5 dernières minutes
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const recentMetrics = this.metrics.filter(
      m => m.service === service && new Date(m.timestamp).getTime() > fiveMinutesAgo
    );

    const totalCalls = recentMetrics.length;
    const successfulCalls = recentMetrics.filter(m => m.success).length;
    const errorRate = totalCalls > 0 ? ((totalCalls - successfulCalls) / totalCalls) * 100 : 0;
    const averageResponseTime = totalCalls > 0 
      ? recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls 
      : 0;

    // Déterminer le statut
    let status: 'healthy' | 'degraded' | 'down' = 'healthy';
    
    if (errorRate > this.alertConfig.errorRateThreshold || 
        averageResponseTime > this.alertConfig.responseTimeThreshold) {
      status = 'degraded';
    }
    
    if (errorRate > 50) { // Plus de 50% d'erreurs = down
      status = 'down';
    }

    const healthStatus: ApiHealthStatus = {
      service,
      status,
      responseTime: averageResponseTime,
      errorRate,
      lastCheck: new Date().toISOString(),
      uptime: existing ? existing.uptime + (now - new Date(existing.lastCheck).getTime()) : 0
    };

    this.healthStatus.set(service, healthStatus);
  }

  private checkAlerts(service: string): void {
    const health = this.healthStatus.get(service);
    if (!health) return;

    const failures = this.consecutiveFailures.get(service) || 0;

    // Vérifier les conditions d'alerte
    if (health.errorRate > this.alertConfig.errorRateThreshold) {
      this.triggerAlert(`${service}: Taux d'erreur élevé (${health.errorRate.toFixed(1)}%)`);
    }

    if (health.responseTime > this.alertConfig.responseTimeThreshold) {
      this.triggerAlert(`${service}: Temps de réponse élevé (${health.responseTime.toFixed(0)}ms)`);
    }

    if (health.status === 'down') {
      this.triggerAlert(`${service}: Service indisponible`);
    }

    // Mettre à jour les échecs consécutifs
    if (!health.success) {
      this.consecutiveFailures.set(service, failures + 1);
      
      if (failures + 1 >= this.alertConfig.consecutiveFailuresThreshold) {
        this.triggerAlert(`${service}: ${failures + 1} échecs consécutifs`);
      }
    } else {
      this.consecutiveFailures.set(service, 0);
    }
  }

  private triggerAlert(message: string): void {
    console.warn(`🚨 API Alert: ${message}`);
    
    this.alertHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in alert handler:', error);
      }
    });
  }

  private startPeriodicHealthCheck(): void {
    setInterval(() => {
      // Vérifier la santé de tous les services
      for (const [service] of this.healthStatus) {
        this.checkAlerts(service);
      }
    }, 30 * 1000); // Toutes les 30 secondes
  }

  // Nettoyer les anciennes métriques
  cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.metrics = this.metrics.filter(
      m => new Date(m.timestamp).getTime() > oneHourAgo
    );
  }

  // Obtenir un rapport de performance
  getPerformanceReport(): {
    totalCalls: number;
    averageResponseTime: number;
    overallErrorRate: number;
    serviceBreakdown: Record<string, {
      calls: number;
      errorRate: number;
      avgResponseTime: number;
    }>;
  } {
    const totalCalls = this.metrics.length;
    const successfulCalls = this.metrics.filter(m => m.success).length;
    const overallErrorRate = totalCalls > 0 ? ((totalCalls - successfulCalls) / totalCalls) * 100 : 0;
    const averageResponseTime = totalCalls > 0 
      ? this.metrics.reduce((sum, m) => sum + m.duration, 0) / totalCalls 
      : 0;

    const serviceBreakdown: Record<string, { calls: number; errorRate: number; avgResponseTime: number }> = {};
    
    for (const [service] of this.healthStatus) {
      const metrics = this.getServiceMetrics(service);
      serviceBreakdown[service] = {
        calls: metrics.totalCalls,
        errorRate: metrics.errorRate,
        avgResponseTime: metrics.averageResponseTime
      };
    }

    return {
      totalCalls,
      averageResponseTime,
      overallErrorRate,
      serviceBreakdown
    };
  }
}

export default ApiMonitor; 