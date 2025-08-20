import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  fmp: number | null; // First Meaningful Paint
}

interface UsePerformanceReturn {
  metrics: PerformanceMetrics;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getMetrics: () => PerformanceMetrics;
}

export function usePerformance(): UsePerformanceReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fmp: null
  });
  const [isMonitoring, setIsMonitoring] = useState(false);

  const updateMetric = useCallback((key: keyof PerformanceMetrics, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const startMonitoring = useCallback(() => {
    if (!('PerformanceObserver' in window) || isMonitoring) return;

    setIsMonitoring(true);

    // First Contentful Paint
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const fcp = entries[0];
          updateMetric('fcp', fcp.startTime);
          console.log('🎨 FCP:', fcp.startTime, 'ms');
        }
      }).observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('FCP monitoring failed:', error);
    }

    // Largest Contentful Paint
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const lcp = entries[entries.length - 1];
          updateMetric('lcp', lcp.startTime);
          console.log('📏 LCP:', lcp.startTime, 'ms');
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP monitoring failed:', error);
    }

    // First Input Delay
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const fid = entries[0];
          updateMetric('fid', fid.duration);
          console.log('⚡ FID:', fid.duration, 'ms');
        }
      }).observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID monitoring failed:', error);
    }

    // Cumulative Layout Shift
    try {
      new PerformanceObserver((entryList) => {
        let cls = 0;
        for (const entry of entryList.getEntries()) {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            cls += layoutShiftEntry.value;
          }
        }
        updateMetric('cls', cls);
        console.log('📐 CLS:', cls);
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS monitoring failed:', error);
    }

    // Time to First Byte
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        updateMetric('ttfb', ttfb);
        console.log('🌐 TTFB:', ttfb, 'ms');
      }
    } catch (error) {
      console.warn('TTFB monitoring failed:', error);
    }

    // First Meaningful Paint (approximation)
    try {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        if (entries.length > 0) {
          const fmp = entries[0];
          updateMetric('fmp', fmp.startTime);
          console.log('🎯 FMP:', fmp.startTime, 'ms');
        }
      }).observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('FMP monitoring failed:', error);
    }

  }, [isMonitoring, updateMetric]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const getMetrics = useCallback(() => {
    return metrics;
  }, [metrics]);

  // Démarrer automatiquement le monitoring au montage
  useEffect(() => {
    startMonitoring();

    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  // Log des métriques quand elles changent
  useEffect(() => {
    const hasAllMetrics = Object.values(metrics).every(metric => metric !== null);
    if (hasAllMetrics) {
      console.log('📊 Performance Metrics:', metrics);
      
      // Analyser la performance
      const performanceScore = analyzePerformance(metrics);
      console.log('🏆 Performance Score:', performanceScore);
    }
  }, [metrics]);

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getMetrics
  };
}

// Fonction d'analyse de performance
function analyzePerformance(metrics: PerformanceMetrics): string {
  let score = 0;
  let totalChecks = 0;

  // FCP < 1.8s = bon
  if (metrics.fcp !== null) {
    totalChecks++;
    if (metrics.fcp < 1800) score++;
  }

  // LCP < 2.5s = bon
  if (metrics.lcp !== null) {
    totalChecks++;
    if (metrics.lcp < 2500) score++;
  }

  // FID < 100ms = bon
  if (metrics.fid !== null) {
    totalChecks++;
    if (metrics.fid < 100) score++;
  }

  // CLS < 0.1 = bon
  if (metrics.cls !== null) {
    totalChecks++;
    if (metrics.cls < 0.1) score++;
  }

  // TTFB < 600ms = bon
  if (metrics.ttfb !== null) {
    totalChecks++;
    if (metrics.ttfb < 600) score++;
  }

  const percentage = (score / totalChecks) * 100;

  if (percentage >= 80) return 'Excellent';
  if (percentage >= 60) return 'Bon';
  if (percentage >= 40) return 'Moyen';
  return 'À améliorer';
} 