import { useState, useEffect, useMemo } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { useRealTimeData } from './useRealTimeData';

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

  console.log('[useOptionsData] Using premium market data plan');

  // Use real-time data hook for live data
  const {
    activities: realTimeActivities,
    loading: realTimeLoading,
    error: realTimeError,
    fetchRealTimeData
  } = useRealTimeData({
    symbols: [],
    enabled: true // Always enabled with configured key
  });

  // Determine data source and activities to use
  const { allActivities, dataSource, isConnected, loading, error } = useMemo(() => {
    console.log('[useOptionsData] Data source determination:', {
      hasValidKey: true,
      activitiesCount: realTimeActivities.length
    });

    // Always use real-time data with configured key
    return {
      allActivities: realTimeActivities,
      dataSource: 'realtime' as const,
      isConnected: true,
      loading: realTimeLoading,
      error: realTimeError
    };
  }, [realTimeActivities, realTimeLoading, realTimeError]);

  // Only trigger search when searchSymbol changes, not on mount
  useEffect(() => {
    if (filters.searchSymbol && fetchRealTimeData) {
      console.log('[useOptionsData] Search symbol changed, fetching data for:', filters.searchSymbol);
      fetchRealTimeData([filters.searchSymbol]);
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
    isUsingRealData: dataSource === 'realtime',
    dataSource,
    error,
    loading,
    refreshData: fetchRealTimeData, // Expose refresh function
  };
}