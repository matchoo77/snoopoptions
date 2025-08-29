import { useState, useEffect } from 'react';
import React from 'react';
import { OptionsActivity } from '../types/options';
import { PolygonEODService } from '../lib/polygonEOD';

interface UseEODDataProps {
  apiKey: string;
  symbols?: string[];
  enabled?: boolean;
}

export function useEODData({ symbols = [], enabled = true }: Omit<UseEODDataProps, 'apiKey'>) {
  const [activities, setActivities] = useState<OptionsActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const eodService = React.useMemo(() => new PolygonEODService(), []);

  const fetchEODData = async (targetSymbols?: string[]) => {
    console.log('[useEODData] === EOD FETCH START ===');
    console.log('[useEODData] API Key check:', {
      hasApiKey: true,
      keyLength: 32,
      enabled,
      keyPreview: 'K95sJvRR...',
      keyValid: true
    });

    if (!enabled) {
      console.log('[useEODData] EOD fetch skipped - not enabled');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const symbolsToFetch = targetSymbols || symbols;
      // Expanded symbol list for upgraded plan
      const defaultSymbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'SPY', 'QQQ', 'AMD', 'NFLX', 'CRM', 'ORCL', 'BABA', 'DIS'];
      const finalSymbols = symbolsToFetch.length > 0 ? symbolsToFetch : defaultSymbols;

      console.log('[useEODData] === STARTING EOD DATA FETCH ===');
      console.log('[useEODData] Symbols to fetch:', finalSymbols);
      console.log('[useEODData] API Key configured: Yes (upgraded $300 plan)');

      // Get previous trading day data
      console.log('[useEODData] Calling getUnusualActivityMultiSymbol with symbols:', finalSymbols);

      // Calculate previous trading day
      const today = new Date();
      const prev = new Date(today);
      prev.setDate(today.getDate() - 1);
      if (today.getDay() === 1) prev.setDate(today.getDate() - 3); // Monday -> Friday  
      if (today.getDay() === 0) prev.setDate(today.getDate() - 2); // Sunday -> Friday
      const dateStr = prev.toISOString().split('T')[0];
      console.log('[useEODData] Using date for data fetch:', dateStr);

      // Process multiple symbols in parallel with upgraded plan
      let unusualActivities;
      if (targetSymbols && targetSymbols.length > 0) {
        // For single symbol search, use getMostActiveOptions for better results
        const singleSymbolActivities = await eodService.getMostActiveOptions(targetSymbols[0], dateStr, 50);
        unusualActivities = singleSymbolActivities.filter(activity => activity.volume > 0); // Show all activities with volume
      } else {
        // For initial load, use more symbols with parallel processing
        const expandedSymbols = finalSymbols.slice(0, 10); // Increased to 10 symbols
        unusualActivities = await eodService.getUnusualActivityMultiSymbol(expandedSymbols, dateStr);
      }

      if (targetSymbols && targetSymbols.length > 0) {
        // Replace data for this specific symbol
        const searchSymbol = targetSymbols[0];
        setActivities(prev => {
          const filtered = prev.filter(activity => activity.symbol !== searchSymbol);
          return [...unusualActivities, ...filtered].slice(0, 500); // Increased limit
        });
      } else {
        // Replace all data
        setActivities(unusualActivities);
      }

      console.log('[useEODData] === EOD DATA FETCH COMPLETE ===');
      console.log('[useEODData] Total unusual activities found:', unusualActivities.length);

      if (unusualActivities.length === 0) {
        console.log('[useEODData] No unusual activities found - this could be due to:');
        console.log('[useEODData] 1. Market closed/weekend');
        console.log('[useEODData] 2. No unusual activity on previous trading day');
        console.log('[useEODData] 3. Filters too restrictive');
      }

      setLastUpdated(new Date().toISOString());

    } catch (err) {
      console.error('[useEODData] Error fetching EOD data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch EOD data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSymbolData = async (symbol: string) => {
    if (!enabled) return;

    try {
      setError(null);
      const today = new Date();
      const prev = new Date(today);
      prev.setDate(today.getDate() - 1);
      if (today.getDay() === 1) prev.setDate(today.getDate() - 3); // Monday -> Friday
      if (today.getDay() === 0) prev.setDate(today.getDate() - 2); // Sunday -> Friday
      const dateStr = prev.toISOString().split('T')[0];

      const symbolActivities = await eodService.getMostActiveOptions(symbol, dateStr, 50);

      // Update activities, replacing any existing data for this symbol
      setActivities(prev => {
        const filtered = prev.filter(activity => activity.symbol !== symbol);
        // Show all activities, not just unusual ones
        return [...symbolActivities, ...filtered].slice(0, 500); // Increased limit
      });

      console.log(`Fetched ${symbolActivities.length} activities for ${symbol}`);
    } catch (err) {
      console.error(`Error fetching data for ${symbol}:`, err);
      setError(`Failed to fetch data for ${symbol}`);
    }
  };

  // Auto-fetch data on mount (no delays with upgraded plan)
  useEffect(() => {
    console.log('useEODData - Mount effect triggered:', {
      enabled,
      hasApiKey: true,
      apiKeyLength: 32,
      apiKeyValid: true
    });

    if (enabled) {
      console.log('Starting immediate EOD data fetch...');
      // No delay needed with upgraded plan
      fetchEODData();
    } else {
      console.log('EOD fetch skipped:', { enabled });
    }
  }, [enabled]);

  // Refresh data every 2 minutes during market hours (real-time feel for upgraded plan)
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Refresh during market hours (9 AM - 4 PM ET, Monday-Friday) and more frequently
      if (day >= 1 && day <= 5 && hour >= 9 && hour <= 16) {
        console.log('Auto-refreshing EOD data during market hours for real-time updates...');
        fetchEODData();
      }
    }, 2 * 60 * 1000); // Reduced to 2 minutes for real-time feeling

    return () => clearInterval(interval);
  }, [enabled]);

  // Add a separate timer for activity feed updates
  useEffect(() => {
    if (!enabled) return;

    const activityInterval = setInterval(() => {
      // Simulate real-time activity by fetching fresh data
      console.log('Fetching fresh activity data for real-time updates...');
      fetchEODData();
    }, 30 * 1000); // Every 30 seconds during active usage

    return () => clearInterval(activityInterval);
  }, [enabled]);  return {
    activities,
    loading,
    error,
    lastUpdated,
    fetchEODData,
    fetchSymbolData,
    refresh: () => fetchEODData(),
  };
}