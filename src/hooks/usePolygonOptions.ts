import { useState, useEffect, useCallback } from 'react';
import { OptionsActivity } from '../types/options';
import { polygonService } from '../services/PolygonService';

interface UsePolygonOptionsProps {
  symbols?: string[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function usePolygonOptions({ 
  symbols = ['SPY', 'QQQ', 'AAPL', 'TSLA', 'NVDA'], 
  autoRefresh = true, 
  refreshInterval = 30000 
}: UsePolygonOptionsProps = {}) {
  
  const [activities, setActivities] = useState<OptionsActivity[]>([]);
  const [topMovers, setTopMovers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchUnusualActivity = useCallback(async () => {
    console.log('[usePolygonOptions] Starting fetch for unusual activity...');
    setLoading(true);
    setError(null);

    try {
      const unusualActivities = await polygonService.getMultiSymbolUnusualActivity(symbols);
      
      console.log(`[usePolygonOptions] Fetched ${unusualActivities.length} unusual activities`);
      console.log(`[usePolygonOptions] Sample activity:`, unusualActivities[0] || 'No activities');
      setActivities(unusualActivities);
      setLastUpdate(new Date());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch unusual activity';
      console.error('[usePolygonOptions] Error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  const fetchTopMovers = useCallback(async () => {
    console.log('[usePolygonOptions] Fetching top movers...');
    
    try {
      const movers = await polygonService.getTopMovers();
      console.log(`[usePolygonOptions] Fetched ${movers.length} top movers`);
      setTopMovers(movers);
    } catch (err) {
      console.error('[usePolygonOptions] Error fetching top movers:', err);
    }
  }, []);

  const fetchSingleSymbol = useCallback(async (symbol: string) => {
    console.log(`[usePolygonOptions] Fetching data for single symbol: ${symbol}`);
    setLoading(true);
    
    try {
      const symbolActivities = await polygonService.getUnusualActivity(symbol);
      console.log(`[usePolygonOptions] Fetched ${symbolActivities.length} activities for ${symbol}`);
      
      // Replace activities for this symbol
      setActivities(prev => {
        const otherSymbols = prev.filter(activity => activity.symbol !== symbol);
        return [...symbolActivities, ...otherSymbols].slice(0, 100);
      });
      
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to fetch data for ${symbol}`;
      console.error(`[usePolygonOptions] Error for ${symbol}:`, errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    console.log('[usePolygonOptions] Manual refresh triggered');
    await Promise.all([
      fetchUnusualActivity(),
      fetchTopMovers()
    ]);
  }, [fetchUnusualActivity, fetchTopMovers]);

  // Initial fetch on mount
  useEffect(() => {
    console.log('[usePolygonOptions] Component mounted, starting initial fetch...');
    console.log('[usePolygonOptions] Current symbols:', symbols);
    console.log('[usePolygonOptions] PolygonService initialized');
    refreshAll();
  }, []); // Only run on mount

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;

    console.log(`[usePolygonOptions] Setting up auto-refresh every ${refreshInterval}ms`);
    const interval = setInterval(() => {
      console.log('[usePolygonOptions] Auto-refresh triggered');
      fetchUnusualActivity(); // Only refresh activities, not movers
    }, refreshInterval);

    return () => {
      console.log('[usePolygonOptions] Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, fetchUnusualActivity]);

  // Refetch when symbols change
  useEffect(() => {
    console.log('[usePolygonOptions] Symbols changed, refetching...', symbols);
    fetchUnusualActivity();
  }, [symbols, fetchUnusualActivity]);

  return {
    activities,
    topMovers,
    loading,
    error,
    lastUpdate,
    refreshAll,
    fetchSingleSymbol,
    fetchUnusualActivity,
    fetchTopMovers,
  };
}
