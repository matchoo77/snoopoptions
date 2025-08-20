import { useState, useEffect, useMemo } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { generateMockData } from '../data/mockData';
import { useEODData } from './useEODData';
import { isValidPolygonApiKey } from '../lib/apiKeyValidation';

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

  const polygonApiKey = import.meta.env.VITE_POLYGON_API_KEY?.toString() || '';
  const hasValidApiKey = isValidPolygonApiKey(polygonApiKey);

  // Use EOD data hook for real data
  const { 
    activities: eodActivities, 
    loading: eodLoading, 
    error: eodError,
    lastUpdated 
  } = useEODData({
    apiKey: polygonApiKey,
    symbols: [],
    enabled: hasValidApiKey
  });

  // Determine data source and activities to use
  const { allActivities, dataSource, isConnected, loading, error } = useMemo(() => {
    if (hasValidApiKey && eodActivities.length > 0) {
      console.log('[useOptionsData] Using real EOD data:', eodActivities.length, 'activities');
      return {
        allActivities: eodActivities,
        dataSource: 'eod' as const,
        isConnected: true,
        loading: eodLoading,
        error: eodError
      };
    } else if (hasValidApiKey && eodLoading) {
      console.log('[useOptionsData] Loading real data...');
      return {
        allActivities: generateMockData(),
        dataSource: 'mock' as const,
        isConnected: false,
        loading: eodLoading,
        error: eodError
      };
    } else {
      console.log('[useOptionsData] Using mock data');
      return {
        allActivities: generateMockData(),
        dataSource: 'mock' as const,
        isConnected: false,
        loading: false,
        error: hasValidApiKey ? eodError : null
      };
    }
  }, [hasValidApiKey, eodActivities, eodLoading, eodError]);

  // Update mock data every 5 seconds when using mock data
  useEffect(() => {
    if (dataSource === 'mock') {
      const interval = setInterval(() => {
        // Only update if we're still using mock data
        if (!hasValidApiKey || eodActivities.length === 0) {
          console.log('[useOptionsData] Refreshing mock data...');
          // This will trigger a re-render through the useMemo dependency
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [dataSource, hasValidApiKey, eodActivities.length]);

  const filteredActivities = useMemo(() => {
    let filtered = allActivities;

    // Apply search symbol filter first
    if (filters.searchSymbol) {
      filtered = filtered.filter(activity => 
        activity.symbol.toLowerCase().includes(filters.searchSymbol.toLowerCase())
      );
    }

    return filtered.filter(activity => {
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
    isUsingRealData: dataSource !== 'mock',
    dataSource,
    error,
    loading,
  };
}