import { useState, useEffect, useMemo } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { generateMockData } from '../data/mockData';

export function useOptionsData() {
  const [allActivities, setAllActivities] = useState<OptionsActivity[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    minVolume: 1000,
    minPremium: 10000,
    maxDaysToExpiration: 60,
    optionTypes: ['call', 'put'],
    sentiment: ['bullish', 'bearish', 'neutral'],
    blockTradesOnly: false,
    minOpenInterest: 0,
    symbols: [],
    searchSymbol: '',
    showFavoritesOnly: false,
  });

  useEffect(() => {
    // Initial data load
    setAllActivities(generateMockData());

    // Simulate real-time updates every 5 seconds
    const interval = setInterval(() => {
      setAllActivities(prev => {
        const newData = generateMockData();
        // Keep only the most recent 100 activities
        return newData.slice(0, 100);
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const filteredActivities = useMemo(() => {
    return allActivities.filter(activity => {
      // Volume filter
      if (activity.volume < filters.minVolume) return false;

      // Premium filter
      if (activity.premium < filters.minPremium) return false;

      // Option types filter
      if (!filters.optionTypes.includes(activity.type)) return false;

      // Sentiment filter
      if (!filters.sentiment.includes(activity.sentiment)) return false;

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
  };
}