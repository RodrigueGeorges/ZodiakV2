import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Database, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiHealthReport } from '../lib/api/init';
import { cn } from '../lib/utils';

interface ApiDashboardProps {
  className?: string;
}

export function ApiDashboard({ className }: ApiDashboardProps) {
  const [healthReport, setHealthReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const updateHealthReport = () => {
      try {
        const report = getApiHealthReport();
        setHealthReport(report);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Erreur lors de la récupération du rapport de santé:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Mise à jour initiale
    updateHealthReport();

    // Mise à jour toutes les 30 secondes
    const interval = setInterval(updateHealthReport, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500';
      case 'degraded':
        return 'text-yellow-500';
      case 'down':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className={cn('p-6 bg-gray-900/50 backdrop-blur-lg rounded-lg border border-white/10', className)}>
        <div className="flex items-center justify-center">
          <Activity className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-white">Chargement du dashboard API...</span>
        </div>
      </div>
    );
  }

  if (!healthReport) {
    return (
      <div className={cn('p-6 bg-gray-900/50 backdrop-blur-lg rounded-lg border border-white/10', className)}>
        <div className="text-center text-red-400">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Impossible de charger le rapport de santé des APIs</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Dashboard API
          </h2>
          <p className="text-gray-400 text-sm">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
        >
          Actualiser
        </button>
      </motion.div>

      {/* Statut de santé des services */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {healthReport.monitoring.health.map((service: any, index: number) => (
          <div
            key={service.service}
            className="p-4 bg-gray-900/50 backdrop-blur-lg rounded-lg border border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-white capitalize">{service.service}</h3>
              {getStatusIcon(service.status)}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Statut:</span>
                <span className={getStatusColor(service.status)}>
                  {service.status === 'healthy' ? 'Opérationnel' : 
                   service.status === 'degraded' ? 'Dégradé' : 'Indisponible'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Temps de réponse:</span>
                <span className="text-white">{service.responseTime.toFixed(0)}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Taux d'erreur:</span>
                <span className={service.errorRate > 10 ? 'text-red-400' : 'text-green-400'}>
                  {service.errorRate.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Métriques de performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Performance globale */}
        <div className="p-6 bg-gray-900/50 backdrop-blur-lg rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Performance Globale
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Total des appels:</span>
              <span className="text-white font-mono">{healthReport.monitoring.performance.totalCalls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Temps de réponse moyen:</span>
              <span className="text-white font-mono">{healthReport.monitoring.performance.averageResponseTime.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Taux d'erreur global:</span>
              <span className={healthReport.monitoring.performance.overallErrorRate > 5 ? 'text-red-400' : 'text-green-400'}>
                {healthReport.monitoring.performance.overallErrorRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Cache */}
        <div className="p-6 bg-gray-900/50 backdrop-blur-lg rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Cache
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">Entrées actives:</span>
              <span className="text-white font-mono">{healthReport.cache.size}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Entrées expirées:</span>
              <span className="text-yellow-400 font-mono">{healthReport.cache.expiredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Âge moyen:</span>
              <span className="text-white font-mono">{(healthReport.cache.averageAge / 1000 / 60).toFixed(1)}min</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Rate Limiting */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-6 bg-gray-900/50 backdrop-blur-lg rounded-lg border border-white/10"
      >
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Rate Limiting
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Object.entries(healthReport.rateLimiting).map(([service, stats]: [string, any]) => (
            <div key={service} className="text-center">
              <h4 className="font-medium text-white capitalize mb-2">{service}</h4>
              <div className="space-y-1 text-sm">
                <div className="text-gray-400">Requêtes: {stats.totalRequests}</div>
                <div className="text-gray-400">Bloquées: {stats.blockedRequests}</div>
                <div className="text-gray-400">Limites actives: {stats.activeLimits}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default ApiDashboard; 