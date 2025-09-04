import { useState, useEffect, useMemo } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { usePolygonOptions } from './usePolygonOptions';

export function useOptionsData() {
  const [filters, setFilters] = useState<FilterOptions>({
    minVolume: 1,
    minPremium: 1,
    maxDaysToExpiration: 365,
    optionTypes: ['call', 'put'],
    sentiment: ['bullish', 'bearish', 'neutral'],
    tradeLocations: ['below-bid', 'at-bid', 'midpoint', 'at-ask', 'above-ask'],
    blockTradesOnly: false,
    minOpenInterest: 0,
    symbols: [],
    searchSymbol: '',
    showFavoritesOnly: false,
  });

  // Use the new Polygon hook
  const {
    activities: polygonActivities,
    loading,
    error,
    lastUpdate,
    refreshAll,
    fetchSingleSymbol
  } = usePolygonOptions({
    symbols: ['SPY', 'QQQ', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'],
    autoRefresh: true,
  refreshInterval: 10000 // Update every 10 seconds per request
  });

  // Trigger single symbol search when searchSymbol changes
  useEffect(() => {
    if (filters.searchSymbol && filters.searchSymbol.length >= 2) {
      fetchSingleSymbol(filters.searchSymbol.toUpperCase());
    }
  }, [filters.searchSymbol, fetchSingleSymbol]);

  const filteredActivities = useMemo(() => {
    let filtered: OptionsActivity[] = polygonActivities;

    // Apply search symbol filter first
    if (filters.searchSymbol) {
      filtered = filtered.filter((activity: OptionsActivity) =>
        activity.symbol.toLowerCase().includes(filters.searchSymbol.toLowerCase())
      );
    }

    const finalFiltered = filtered.filter((activity: OptionsActivity) => {
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

    return finalFiltered;
  }, [polygonActivities, filters]);

  return {
    activities: filteredActivities,
    filters,
    setFilters,
    isConnected: true,
    isUsingRealData: true,
    dataSource: 'polygon' as const,
    error,
    loading,
    lastUpdate,
    refreshData: refreshAll,
  };
}