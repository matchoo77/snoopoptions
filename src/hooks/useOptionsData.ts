import { useState, useEffect, useMemo } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { useEODData } from './useEODData';
import { isValidPolygonApiKey } from '../lib/apiKeyValidation';
import { isSupabaseConfigured } from '../lib/supabase';

export function useOptionsData() {
  const [filters, setFilters] = useState<FilterOptions>({
    minVolume: 100,
    minPremium: 1000,
    maxDaysToExpiration: 60,
    optionTypes: ['call', 'put'],
    sentiment: ['bullish', 'bearish', 'neutral'],
    tradeLocations: ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'],
    blockTradesOnly: false,
    minOpenInterest: 0,
    symbols: [],
    searchSymbol: '',
    showFavoritesOnly: false,
  });

  const polygonApiKey = import.meta.env.VITE_POLYGON_API_KEY || '';
  
  console.log('[useOptionsData] API Key check:', {
    hasKey: !!polygonApiKey,
    keyLength: polygonApiKey.length,
    keyPreview: polygonApiKey ? `${polygonApiKey.substring(0, 8)}...${polygonApiKey.slice(-4)}` : 'none',
    keyValid: isValidPolygonApiKey(polygonApiKey)
  });

  // Use EOD data hook for real data
  const { 
    activities: eodActivities, 
    loading: eodLoading, 
    error: eodError,
    fetchEODData
  } = useEODData({
    apiKey: polygonApiKey,
    symbols: [],
  enabled: isValidPolygonApiKey(polygonApiKey) || isSupabaseConfigured()
  });

  // Determine data source and activities to use (no mock fallback)
  const { allActivities, dataSource, isConnected, loading, error } = useMemo(() => {
    const hasValidKey = isValidPolygonApiKey(polygonApiKey) || isSupabaseConfigured();
    
    console.log('[useOptionsData] Data source determination:', {
      hasValidKey,
      polygonValid: isValidPolygonApiKey(polygonApiKey),
      supabaseConfigured: isSupabaseConfigured(),
      activitiesCount: eodActivities.length
    });

    if (!hasValidKey) {
      console.warn('[useOptionsData] No valid API key. Returning empty dataset.');
      return {
        allActivities: [] as OptionsActivity[],
        dataSource: 'none' as const,
        isConnected: false,
        loading: false,
        error: 'Polygon API key is missing/invalid and Supabase is not configured.'
      };
    }

    // Valid key: always represent source as EOD (even if currently loading or empty)
    return {
      allActivities: eodActivities,
      dataSource: 'eod' as const,
      isConnected: true,
      loading: eodLoading,
      error: eodError
    };
  }, [polygonApiKey, eodActivities, eodLoading, eodError]);

  // Manual refresh function
  const refreshData = () => {
    if (isValidPolygonApiKey(polygonApiKey) && fetchEODData) {
      console.log('[useOptionsData] Manual refresh triggered');
      fetchEODData();
    }
  };

  useEffect(() => {
    console.log('[useOptionsData] Mount effect - triggering initial data fetch');
    refreshData();
  }, []);

  const filteredActivities = useMemo(() => {
    let filtered: OptionsActivity[] = allActivities;

    // Apply search symbol filter first
    if (filters.searchSymbol) {
      filtered = filtered.filter((activity: OptionsActivity) => 
        activity.symbol.toLowerCase().includes(filters.searchSymbol.toLowerCase())
      );
    }

    return filtered.filter((activity: OptionsActivity) => {
      // Volume filter
      if (activity.volume < filters.minVolume) return false;

      // Premium filter
      if (activity.premium < filters.minPremium) return false;

      // Option types filter
      if (!filters.optionTypes.includes(activity.type)) return false;

      // Sentiment filter
      if (!filters.sentiment.includes(activity.sentiment)) return false;

      // Trade location filter
      if (!filters.tradeLocations.includes(activity.tradeLocation)) return false;

      // Block trades only filter
      if (filters.blockTradesOnly && !activity.blockTrade) return false;

      // Open interest filter
      if (activity.openInterest < filters.minOpenInterest) return false;

      // Days to expiration filter
      const expDate = new Date(activity.expiration);
      const now = new Date();
      const daysToExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysToExpiration > filters.maxDaysToExpiration) return false;

      // Symbol filter (if any symbols are specified)
      if (filters.symbols.length > 0 && !filters.symbols.includes(activity.symbol)) return false;

      return true;
    });
  }, [allActivities, filters]);

  return {
    activities: filteredActivities,
    filters,
    setFilters,
    isConnected,
  isUsingRealData: dataSource === 'eod',
    dataSource,
    error,
    loading,
  };
}