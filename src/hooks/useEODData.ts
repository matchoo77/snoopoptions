import { useState, useEffect } from 'react';
import React from 'react';
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

  const eodService = React.useMemo(() => new PolygonEODService(apiKey), [apiKey]);

  const fetchEODData = async (targetSymbols?: string[]) => {
    console.log('[useEODData] === EOD FETCH START ===');
    console.log('[useEODData] API Key check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey?.length || 0,
      enabled,
      keyPreview: apiKey ? `${apiKey.substring(0, 8)}...` : 'none',
      keyValid: isValidPolygonApiKey(apiKey)
    });
    
    if (!isValidPolygonApiKey(apiKey)) {
      console.log('[useEODData] EOD fetch skipped - invalid API key');
      setError('Polygon API key is required');
      setLoading(false);
      return;
    }

    if (!enabled) {
      console.log('[useEODData] EOD fetch skipped - not enabled');
      setLoading(false);
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
      console.log('[useEODData] Calling getUnusualActivityMultiSymbol with symbols:', finalSymbols);
      
      // Calculate previous trading day
      const today = new Date();
      const prev = new Date(today);
      prev.setDate(today.getDate() - 1);
      if (today.getDay() === 1) prev.setDate(today.getDate() - 3); // Monday -> Friday  
      if (today.getDay() === 0) prev.setDate(today.getDate() - 2); // Sunday -> Friday
      const dateStr = prev.toISOString().split('T')[0];
      console.log('[useEODData] Using date for data fetch:', dateStr);
      
      // If searching for a specific symbol, replace existing data
      // If loading default symbols, merge with existing data
      let unusualActivities;
      if (targetSymbols && targetSymbols.length > 0) {
        // For single symbol search, use getMostActiveOptions for better results
        const singleSymbolActivities = await eodService.getMostActiveOptions(targetSymbols[0], dateStr, 20);
        unusualActivities = singleSymbolActivities.filter(activity => activity.volume > 0); // Show all activities with volume
      } else {
        // For initial load, just use a few symbols to avoid long delays
        const limitedSymbols = finalSymbols.slice(0, 1); // Back to 1 symbol to avoid rate limits
        unusualActivities = await eodService.getUnusualActivityMultiSymbol(limitedSymbols, dateStr);
      }
      
      if (targetSymbols && targetSymbols.length > 0) {
        // Replace data for this specific symbol
        const searchSymbol = targetSymbols[0];
        setActivities(prev => {
          const filtered = prev.filter(activity => activity.symbol !== searchSymbol);
          return [...unusualActivities, ...filtered].slice(0, 200);
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
        console.log('[useEODData] 3. API rate limiting');
        console.log('[useEODData] 4. Filters too restrictive');
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
    if (!apiKey || !enabled) return;

    try {
      setError(null);
      const today = new Date();
      const prev = new Date(today);
      prev.setDate(today.getDate() - 1);
      if (today.getDay() === 1) prev.setDate(today.getDate() - 3); // Monday -> Friday
      if (today.getDay() === 0) prev.setDate(today.getDate() - 2); // Sunday -> Friday
      const dateStr = prev.toISOString().split('T')[0];
      
      const symbolActivities = await eodService.getMostActiveOptions(symbol, dateStr, 20);
      
      // Update activities, replacing any existing data for this symbol
      setActivities(prev => {
        const filtered = prev.filter(activity => activity.symbol !== symbol);
        // Show all activities, not just unusual ones
        return [...symbolActivities, ...filtered].slice(0, 200);
      });
      
      console.log(`Fetched ${symbolActivities.length} activities for ${symbol}`);
    } catch (err) {
      console.error(`Error fetching data for ${symbol}:`, err);
      setError(`Failed to fetch data for ${symbol}`);
    }
  };

  // Auto-fetch data on mount and when symbols change (with debounce)
  useEffect(() => {
    const hardcodedKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
    console.log('useEODData - Mount effect triggered:', { 
      enabled, 
      hasApiKey: true,
      apiKeyLength: hardcodedKey.length,
      apiKeyValid: isValidPolygonApiKey(hardcodedKey)
    });
    
    if (enabled && isValidPolygonApiKey(hardcodedKey)) {
      console.log('Scheduling initial EOD data fetch with delay...');
      // Add a delay to prevent multiple components from hitting API simultaneously
      const timer = setTimeout(() => {
        fetchEODData();
      }, Math.random() * 2000 + 1000); // Random delay between 1-3 seconds
      
      return () => clearTimeout(timer);
    } else {
      console.log('EOD fetch skipped:', { enabled, hasApiKey: true, keyValid: isValidPolygonApiKey(hardcodedKey) });
    }
  }, [enabled]);

  // Refresh data every 10 minutes during market hours (increased interval)
  useEffect(() => {
    const hardcodedKey = 'K95sJvRRPEyVT_EMrTip0aAAlvrkHp8X';
    if (!enabled || !isValidPolygonApiKey(hardcodedKey)) return;

    const interval = setInterval(() => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Only refresh during market hours (9 AM - 4 PM ET, Monday-Friday) and less frequently
      if (day >= 1 && day <= 5 && hour >= 9 && hour <= 16) {
        console.log('Auto-refreshing EOD data during market hours...');
        fetchEODData();
      }
    }, 10 * 60 * 1000); // Increased to 10 minutes to reduce API calls

    return () => clearInterval(interval);
  }, [enabled]);

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