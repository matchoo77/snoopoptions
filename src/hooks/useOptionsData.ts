import { useState, useEffect, useMemo } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { usePolygonData } from './usePolygonData';
import { useEODData } from './useEODData';
import { generateMockData } from '../data/mockData';

export function useOptionsData() {
  const [allActivities, setAllActivities] = useState<OptionsActivity[]>([]);
  const [dataSource, setDataSource] = useState<'mock' | 'realtime' | 'eod'>('mock');
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

  // Get Polygon API key from environment
  const polygonApiKey = import.meta.env.VITE_POLYGON_API_KEY || '';
  
  // Use real-time Polygon WebSocket data
  const { 
    activities: polygonActivities, 
    isConnected, 
    error: polygonError,
    fetchSymbolData 
  } = usePolygonData({ 
    apiKey: polygonApiKey,
    symbols: filters.symbols 
  });

  // Use EOD data from Polygon
  const {
    activities: eodActivities,
    loading: eodLoading,
    error: eodError,
    fetchSymbolData: fetchEODSymbolData
  } = useEODData({ apiKey: polygonApiKey, symbols: filters.symbols });

  useEffect(() => {
    // Determine which data source to use
    if (polygonApiKey && polygonActivities.length > 0) {
      setDataSource('realtime');
      setAllActivities(polygonActivities);
    } else if (polygonApiKey && eodActivities.length > 0) {
      setDataSource('eod');
      setAllActivities(eodActivities);
    } else {
      // Fall back to mock data
      setDataSource('mock');
      setAllActivities(generateMockData());

      // Update mock data every 5 seconds
      const interval = setInterval(() => {
        setAllActivities(generateMockData());
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [polygonApiKey, polygonActivities, eodActivities]);

  // Fetch data for specific symbol when search changes
  useEffect(() => {
    if (dataSource === 'realtime' && filters.searchSymbol && fetchSymbolData) {
      fetchSymbolData(filters.searchSymbol);
    } else if (dataSource === 'eod' && filters.searchSymbol && fetchEODSymbolData) {
      fetchEODSymbolData(filters.searchSymbol);
    }
  }, [dataSource, filters.searchSymbol, fetchSymbolData, fetchEODSymbolData]);

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
    isConnected: dataSource === 'realtime' ? isConnected : true,
    isUsingRealData: dataSource !== 'mock',
    dataSource,
    error: polygonError || eodError,
    loading: eodLoading,
  };
}