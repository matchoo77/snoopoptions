import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCriteria } from '../types/snooptest';

export function useAlerts() {
  const [alerts, setAlerts] = useState<AlertCriteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
      } else {
        setAlerts(data || []);
      }
    } catch (err) {
      setError('Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (alertData: Omit<AlertCriteria, 'id' | 'userId' | 'createdAt'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_alerts')
        .insert({
          user_id: user.id,
          ticker: alertData.ticker,
          trade_locations: alertData.tradeLocations,
          min_win_rate: alertData.minWinRate,
          notification_type: alertData.notificationType,
          is_active: alertData.isActive,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Request notification permission if browser notifications
      if (alertData.notificationType === 'browser' && 'Notification' in window) {
        await Notification.requestPermission();
      }

      await fetchAlerts(); // Refresh alerts list
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
      throw err;
    }
  };

  const updateAlert = async (id: string, updates: Partial<AlertCriteria>) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .update(updates)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert');
      throw err;
    }
  };

  const deleteAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_alerts')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      await fetchAlerts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert');
      throw err;
    }
  };

  return {
    alerts,
    loading,
    error,
    createAlert,
    updateAlert,
    deleteAlert,
    refetch: fetchAlerts,
  };
}