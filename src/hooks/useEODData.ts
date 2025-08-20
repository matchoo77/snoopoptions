import { useState, useEffect } from 'react';
import { OptionsActivity } from '../types/options';
import { PolygonEODService } from '../lib/polygonEOD';
import { isValidPolygonApiKey } from '../lib/apiKeyValidation';

interface UseEODDataProps {
  apiKey: string;
  symbols?: string[];
  enabled?: boolean;
}

export function useEODData({ apiKey, symbols = [], enabled = true }: UseEODDataProps) {
  const [activities, setActivities] = useState<OptionsActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const eodService = new PolygonEODService(apiKey);

  const fetchEODData = async (targetSymbols?: string[]) => {
    console.log('[useEODData] === EOD FETCH START ===');
    console.log('[useEODData] API Key check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      enabled,
      keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'none'
    });
    
    if (!isValidPolygonApiKey(apiKey)) {
      console.log('[useEODData] EOD fetch skipped - invalid API key');
      setError('Polygon API key is required');
      return;
    }

    if (!enabled) {
      console.log('[useEODData] EOD fetch skipped - not enabled');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const symbolsToFetch = targetSymbols || symbols;
      const defaultSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ'];
      const finalSymbols = symbolsToFetch.length > 0 ? symbolsToFetch : defaultSymbols;

      console.log('[useEODData] === STARTING EOD DATA FETCH ===');
      console.log('[useEODData] Symbols to fetch:', finalSymbols);
      console.log('[useEODData] API Key configured:', apiKey ? `Yes (${apiKey.substring(0, 8)}...)` : 'No');
      console.log('[useEODData] API Key length:', apiKey?.length || 0);

      // Get previous trading day data
      const unusualActivities = await eodService.getUnusualActivityMultiSymbol(finalSymbols);

      console.log('[useEODData] === EOD DATA FETCH COMPLETE ===');
      console.log('[useEODData] Total unusual activities found:', unusualActivities.length);
      
      if (unusualActivities.length === 0) {
        console.log('[useEODData] No unusual activities found - this could be due to:');
        console.log('[useEODData] 1. Market closed/weekend');
        console.log('[useEODData] 2. No unusual activity on previous trading day');
        console.log('[useEODData] 3. API rate limiting');
        console.log('[useEODData] 4. Filters too restrictive');
      }
      
      setActivities(unusualActivities);
      setLastUpdated(new Date().toISOString());
      
    } catch (err) {
      console.error('[useEODData] Error fetching EOD data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch EOD data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSymbolData = async (symbol: string) => {
    if (!apiKey || !enabled) return;

    try {
      setError(null);
      const symbolActivities = await eodService.getMostActiveOptions(symbol, undefined, 20);
      
      // Update activities, replacing any existing data for this symbol
      setActivities(prev => {
        const filtered = prev.filter(activity => activity.symbol !== symbol);
        const unusualSymbolActivities = symbolActivities.filter(activity => activity.unusual);
        return [...unusualSymbolActivities, ...filtered].slice(0, 200);
      });
      
      console.log(`Fetched ${symbolActivities.length} activities for ${symbol}`);
    } catch (err) {
      console.error(`Error fetching data for ${symbol}:`, err);
      setError(`Failed to fetch data for ${symbol}`);
    }
  };

  // Auto-fetch data on mount and when symbols change
  useEffect(() => {
    console.log('useEODData - Mount effect triggered:', { 
      enabled, 
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0 
    });
    
    if (enabled && apiKey) {
      console.log('Starting initial EOD data fetch...');
      fetchEODData();
    } else {
      console.log('EOD fetch skipped:', { enabled, hasApiKey: !!apiKey });
    }
  }, []);

  // Separate effect for when API key or enabled status changes
  useEffect(() => {
    console.log('useEODData - API key/enabled changed:', { 
      enabled, 
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0 
    });
    
    if (enabled && apiKey) {
      console.log('Fetching EOD data due to API key/enabled change...');
      fetchEODData();
    }
  }, [apiKey, enabled]);

  // Refresh data every 5 minutes during market hours
  useEffect(() => {
    if (!enabled || !apiKey) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Only refresh during market hours (9 AM - 4 PM ET, Monday-Friday)
      if (day >= 1 && day <= 5 && hour >= 9 && hour <= 16) {
        console.log('Auto-refreshing EOD data during market hours...');
        fetchEODData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [enabled, apiKey, fetchEODData]);

  return {
    activities,
    loading,
    error,
    lastUpdated,
    fetchEODData,
    fetchSymbolData,
    refresh: () => fetchEODData(),
  };
}