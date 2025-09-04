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
    const apiKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
    
    if (!enabled) {
      return;
    }

    if (!isValidApiKey(apiKey)) {
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

      let unusualActivities: OptionsActivity[] = [];

      // Get real-time data for current time
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      if (finalSymbols.length === 1) {
        // Single symbol request - get more data for this specific symbol
        const singleSymbolActivities = await marketService.getMostActiveOptions(finalSymbols[0], dateStr, 50);
        unusualActivities = singleSymbolActivities;
      } else {
        // Multi-symbol request - get broad market unusual activity
        unusualActivities = await marketService.getUnusualActivityMultiSymbol(finalSymbols, dateStr);
      }

      // Use raw activities as returned from the API
      const enhancedActivities = unusualActivities;
      
      // Add new data on top of existing data instead of replacing it
      setActivities(prevActivities => {
        // For single symbol search, replace data for that symbol
        if (finalSymbols.length === 1) {
          const searchSymbol = finalSymbols[0];
          const otherSymbolActivities = prevActivities.filter(a => a.symbol !== searchSymbol);
          return [...enhancedActivities, ...otherSymbolActivities]
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 200);
        }
        
        // For multi-symbol, add new activities on top (newest first)
        const existingIds = new Set(prevActivities.map(a => a.id));
        const newActivities = enhancedActivities.filter(a => !existingIds.has(a.id));
        
        const combined = [...newActivities, ...prevActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 200);
        
        return combined;
      });

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

  // Initial data fetch on mount - immediate
  useEffect(() => {
    if (enabled) {
      // Force an immediate fetch
      fetchRealTimeData();
    }
  }, [enabled]); // Keep dependency array simple

  // Manual refresh on symbols change
  useEffect(() => {
    if (enabled && symbols.length > 0) {
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
