import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SweepMonitorStatus {
  isActive: boolean;
  lastCheck: string | null;
  sweepsFound: number;
  error: string | null;
}

export function useSweepMonitor() {
  const [status, setStatus] = useState<SweepMonitorStatus>({
    isActive: false,
    lastCheck: null,
    sweepsFound: 0,
    error: null,
  });

  const triggerSweepMonitor = async () => {
    try {
      console.log('🔍 Triggering sweep monitor...');
      
      const { data, error } = await supabase.functions.invoke('sweep-monitor', {
        method: 'GET',
      });

      if (error) {
        console.error('❌ Sweep monitor error:', error);
        setStatus(prev => ({
          ...prev,
          error: error.message,
          lastCheck: new Date().toISOString(),
        }));
        return;
      }

      console.log('✅ Sweep monitor completed:', data);
      setStatus({
        isActive: true,
        lastCheck: data.timestamp || new Date().toISOString(),
        sweepsFound: data.sweeps || 0,
        error: null,
      });

    } catch (error) {
      console.error('❌ Failed to trigger sweep monitor:', error);
      setStatus(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastCheck: new Date().toISOString(),
      }));
    }
  };

  // Automatically trigger sweep monitor every 5 minutes when user is authenticated
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const setupMonitoring = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('👤 User authenticated - starting sweep monitoring');
        
        // Initial trigger
        await triggerSweepMonitor();
        
        // Set up periodic monitoring every 5 minutes
        interval = setInterval(() => {
          triggerSweepMonitor();
        }, 5 * 60 * 1000); // 5 minutes
        
        setStatus(prev => ({ ...prev, isActive: true }));
      } else {
        console.log('❌ User not authenticated - sweep monitoring disabled');
        setStatus(prev => ({ ...prev, isActive: false }));
      }
    };

    setupMonitoring();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setupMonitoring();
      } else if (event === 'SIGNED_OUT') {
        if (interval) {
          clearInterval(interval);
          interval = null;
        }
        setStatus({
          isActive: false,
          lastCheck: null,
          sweepsFound: 0,
          error: null,
        });
      }
    });

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      subscription.unsubscribe();
    };
  }, []);

  return {
    status,
    triggerSweepMonitor,
  };
}
