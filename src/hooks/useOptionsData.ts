import { useState, useEffect, useMemo } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { useEODData } from './useEODData';

export function useOptionsData() {
  const [filters, setFilters] = useState<FilterOptions>({
    minVolume: 3, // Reduced for more data
    minPremium: 25, // Reduced for more data
    maxDaysToExpiration: 90, // Increased for more data
    optionTypes: ['call', 'put'],
    sentiment: ['bullish', 'bearish', 'neutral'],
    tradeLocations: ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'],
    blockTradesOnly: false,
    minOpenInterest: 0,
    symbols: [],
    searchSymbol: '',
    showFavoritesOnly: false,
  });

  console.log('[useOptionsData] Using upgraded $300 Polygon API plan');

  // Use EOD data hook for real data
  const {
    activities: eodActivities,
    loading: eodLoading,
    error: eodError,
    fetchEODData
  } = useEODData({
    symbols: [],
    enabled: true // Always enabled with hardcoded key
  });

  // Determine data source and activities to use
  const { allActivities, dataSource, isConnected, loading, error } = useMemo(() => {
    console.log('[useOptionsData] Data source determination:', {
      hasValidKey: true,
      activitiesCount: eodActivities.length
    });

    // Always use EOD data with hardcoded key
    return {
      allActivities: eodActivities,
      dataSource: 'eod' as const,
      isConnected: true,
      loading: eodLoading,
      error: eodError
    };
  }, [eodActivities, eodLoading, eodError]);

  // Only trigger search when searchSymbol changes, not on mount
  useEffect(() => {
    if (filters.searchSymbol && fetchEODData) {
      console.log('[useOptionsData] Search symbol changed, fetching data for:', filters.searchSymbol);
      fetchEODData([filters.searchSymbol]);
    }
  }, [filters.searchSymbol]);

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
    refreshData: fetchEODData, // Expose refresh function
  };
}