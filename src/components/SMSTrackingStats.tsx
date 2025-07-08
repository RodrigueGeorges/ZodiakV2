import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface TrackingStats {
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  open_rate: number;
  click_rate: number;
  recent_stats: Array<{
    date: string;
    sent: number;
    opened: number;
    clicked: number;
  }>;
}

export default function SMSTrackingStats() {
  const [stats, setStats] = useState<TrackingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrackingStats();
  }, []);

  const fetchTrackingStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Statistiques globales
      const { data: globalStats, error: globalError } = await supabase
        .from('sms_tracking')
        .select('*');

      if (globalError) throw globalError;

      const totalSent = globalStats?.length || 0;
      const totalOpened = globalStats?.filter(s => s.opened_at).length || 0;
      const totalClicked = globalStats?.filter(s => s.clicked_at).length || 0;

      // Statistiques des 7 derniers jours
      const sevenDaysAgo = subDays(new Date(), 7);
      const recentStats = [];

      for (let i = 0; i < 7; i++) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const dayStats = globalStats?.filter(s => 
          format(new Date(s.date), 'yyyy-MM-dd') === dateStr
        ) || [];

        recentStats.push({
          date: dateStr,
          sent: dayStats.length,
          opened: dayStats.filter(s => s.opened_at).length,
          clicked: dayStats.filter(s => s.clicked_at).length,
        });
      }

      setStats({
        total_sent: totalSent,
        total_opened: totalOpened,
        total_clicked: totalClicked,
        open_rate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0,
        click_rate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 100) : 0,
        recent_stats: recentStats.reverse(),
      });

    } catch (err) {
      console.error('Erreur lors du chargement des stats:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold mb-2">Erreur</p>
          <p>{error}</p>
          <button 
            onClick={fetchTrackingStats}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-6">
        📊 Statistiques SMS
      </h2>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total_sent}</div>
          <div className="text-sm opacity-90">SMS envoyés</div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total_opened}</div>
          <div className="text-sm opacity-90">Ouvertures ({stats.open_rate}%)</div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-4">
          <div className="text-2xl font-bold">{stats.total_clicked}</div>
          <div className="text-sm opacity-90">Clics ({stats.click_rate}%)</div>
        </div>
      </div>

      {/* Graphique des 7 derniers jours */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          📈 Activité des 7 derniers jours
        </h3>
        <div className="space-y-2">
          {stats.recent_stats.map((day, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium text-gray-600 w-20">
                  {format(new Date(day.date), 'EEE dd/MM', { locale: fr })}
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {day.sent} envoyés
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {day.opened} ouverts
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">
                      {day.clicked} clics
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {day.sent > 0 ? Math.round((day.opened / day.sent) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500">taux d'ouverture</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button 
          onClick={fetchTrackingStats}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>
    </div>
  );
} 