import { useState, useEffect } from 'react';
import { OptionsActivity } from '../types/options';
import { PolygonEODService } from '../lib/polygonEOD';

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
    if (!apiKey || !enabled) {
      console.log('EOD fetch skipped - no API key');
      return;
    }

    if (!enabled) {
      console.log('EOD fetch skipped - not enabled');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const symbolsToFetch = targetSymbols || symbols;
      const defaultSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ'];
      const finalSymbols = symbolsToFetch.length > 0 ? symbolsToFetch : defaultSymbols;

      console.log('=== STARTING EOD DATA FETCH ===');
      console.log('Symbols to fetch:', finalSymbols);
      console.log('API Key configured:', apiKey ? `Yes (${apiKey.substring(0, 8)}...)` : 'No');
      console.log('API Key length:', apiKey?.length || 0);

      // Get previous trading day data
      const unusualActivities = await eodService.getUnusualActivityMultiSymbol(finalSymbols);

      console.log('=== EOD DATA FETCH COMPLETE ===');
      console.log('Total unusual activities found:', unusualActivities.length);
      
      setActivities(unusualActivities);
      setLastUpdated(new Date().toISOString());
      
    } catch (err) {
      console.error('Error fetching EOD data:', err);
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
    console.log('useEODData - Effect triggered:', { enabled, apiKey: !!apiKey });
    if (enabled && apiKey) {
      console.log('Starting initial EOD data fetch...');
      fetchEODData();
    }
  }, [apiKey, enabled, fetchEODData]);

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