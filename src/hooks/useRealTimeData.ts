import { useState, useEffect, useCallback, useMemo } from 'react';
import { OptionsActivity } from '../types/options';
import { MarketDataService } from '../lib/marketDataService';
import { isValidApiKey } from '../lib/apiKeyValidation';

interface UseRealTimeDataProps {
  symbols?: string[];
  enabled?: boolean;
}

export function useRealTimeData({ symbols = [], enabled = true }: UseRealTimeDataProps) {
  const [activities, setActivities] = useState<OptionsActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track fetch times only via logs now; removed unused state to avoid lint errors

  const marketService = useMemo(() => new MarketDataService(), []);

  const fetchRealTimeData = async (targetSymbols?: string[]) => {
    console.log('[useRealTimeData] === REAL-TIME FETCH START ===');
    console.log('[useRealTimeData] Current time:', new Date().toISOString());
    console.log('[useRealTimeData] User timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);
    const apiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
    
    if (!enabled) {
      console.log('[useRealTimeData] Real-time fetch skipped - not enabled');
      return;
    }

    if (!isValidApiKey(apiKey)) {
      console.log('[useRealTimeData] API key validation failed');
      setError('Market data API key is missing or invalid.');
      setActivities([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Always use default symbols if none provided to ensure we get data
      const finalSymbols = targetSymbols?.length ? targetSymbols : 
                          symbols.length > 0 ? symbols : 
                          ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'];
      
      console.log('[useRealTimeData] === STARTING REAL-TIME DATA FETCH ===');
      console.log('[useRealTimeData] Symbols to fetch:', finalSymbols);
      console.log('[useRealTimeData] API Key configured: Yes (premium plan)');

      let unusualActivities: OptionsActivity[] = [];

      // Generate real-time looking data for current time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      console.log('[useRealTimeData] Using current date for data fetch:', dateStr);

      if (finalSymbols.length === 1) {
        console.log('[useRealTimeData] Single symbol mode for:', finalSymbols[0]);
        // Single symbol request - get more data for this specific symbol
        const singleSymbolActivities = await marketService.getMostActiveOptions(finalSymbols[0], dateStr, 50);
        console.log('[useRealTimeData] Single symbol activities received:', singleSymbolActivities.length);
        unusualActivities = singleSymbolActivities;
      } else {
        console.log('[useRealTimeData] Multi-symbol mode for:', finalSymbols.length, 'symbols');
        // Multi-symbol request - get broad market unusual activity
        unusualActivities = await marketService.getUnusualActivityMultiSymbol(finalSymbols, dateStr);
        console.log('[useRealTimeData] Multi-symbol activities received:', unusualActivities.length);
      }

      console.log('[useRealTimeData] Raw activities before enhancement:', unusualActivities.length);

      // Use raw activities as returned from the API (no synthetic augmentation)
      const enhancedActivities = unusualActivities;
      console.log('[useRealTimeData] Activities received (raw):', enhancedActivities.length);
      
      // Add new data on top of existing data instead of replacing it
      setActivities(prevActivities => {
        // Remove duplicates by ID to avoid duplicate entries
        const existingIds = new Set(prevActivities.map(a => a.id));
        const newActivities = enhancedActivities.filter(a => !existingIds.has(a.id));
        
        // Combine new activities on top, keep only last 200 activities for performance
        const combined = [...newActivities, ...prevActivities].slice(0, 200);
        
        console.log('[useRealTimeData] Combined activities:', {
          new: newActivities.length,
          existing: prevActivities.length,
          total: combined.length
        });
        
        return combined;
      });
      
      console.log('[useRealTimeData] === REAL-TIME DATA FETCH COMPLETE ===');

      if (enhancedActivities.length === 0) {
        console.log('[useRealTimeData] No real activities found from Polygon API');
        console.log('[useRealTimeData] This could be due to:');
        console.log('[useRealTimeData] 1. API request failures');
        console.log('[useRealTimeData] 2. No trading volume on the date requested');
        console.log('[useRealTimeData] 3. Market closed or weekend');
        console.log('[useRealTimeData] 4. API rate limiting');
        console.log('[useRealTimeData] 5. Debugging - will show empty feed');
        
        // In dev mode, at least show when the fetch happened
        if (finalSymbols.includes('SPY')) {
          console.log('[useRealTimeData] Adding debug entry to show fetch is working...');
          setActivities([{
            id: `debug_${Date.now()}`,
            symbol: 'DEBUG',
            type: 'call' as const,
            strike: 500,
            expiration: '2025-12-31',
            lastPrice: 1.0,
            volume: 100,
            premium: 10000,
            openInterest: 1000,
            bid: 0.95,
            ask: 1.05,
            timestamp: new Date().toISOString(),
            sentiment: 'neutral' as const,
            tradeLocation: 'midpoint' as const,
            blockTrade: false,
            unusual: true,
            impliedVolatility: 0.3,
            delta: 0.5,
            gamma: 0.1,
            theta: -0.05,
            vega: 0.2,
          }]);
        }
      }

    } catch (err) {
      console.error('[useRealTimeData] Error fetching real-time data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch real-time data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleSymbol = useCallback(async (symbol: string) => {
    if (!symbol) return;
    
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const symbolActivities = await marketService.getMostActiveOptions(symbol, dateStr, 50);
      
      // Use raw activities as-is
      setActivities(prev => {
        const filtered = prev.filter(a => a.symbol !== symbol);
        return [...filtered, ...symbolActivities];
      });
    } catch (err) {
      console.error(`Error fetching real-time data for ${symbol}:`, err);
    }
  }, [marketService]);

  // Initial data fetch on mount
  useEffect(() => {
    console.log('useRealTimeData - Mount effect triggered:', {
      symbolsLength: symbols.length,
      enabled,
      hasApiKey: true
    });

    if (enabled) {
      console.log('Starting immediate real-time data fetch...');
      
      // Force an immediate fetch
      fetchRealTimeData();
    } else {
      console.log('Real-time fetch skipped:', { enabled });
    }
  }, [enabled]); // Keep dependency array simple

  // Separate effect to ensure data is fetched immediately after component mounts
  useEffect(() => {
    console.log('useRealTimeData - Force initial fetch on mount');
    if (enabled) {
      // Use setTimeout to ensure this runs after component is fully mounted
      setTimeout(() => {
        console.log('useRealTimeData - Executing delayed initial fetch');
        fetchRealTimeData();
      }, 1000); // Increased delay to 1 second
    }
  }, []); // Empty dependency array to run only once on mount

  // Manual refresh on symbols change
  useEffect(() => {
    if (enabled && symbols.length > 0) {
      console.log('useRealTimeData - Symbols changed, fetching for:', symbols);
      fetchRealTimeData();
    }
  }, [symbols, enabled]);

  return {
    activities,
    loading,
    error,
    fetchRealTimeData,
    fetchSingleSymbol,
    refresh: () => fetchRealTimeData(),
  };
}
