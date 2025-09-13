import { useState, useEffect, useMemo, useRef } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { usePolygonOptions } from './usePolygonOptions';
import { useMarketStatus } from './useMarketStatus';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export function useOptionsData() {
  const marketStatus = useMarketStatus();

  const defaultFilters: FilterOptions = {
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
  };

  const { user } = useAuth();
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const loadedRemote = useRef(false);
  const saveTimeout = useRef<number | undefined>(undefined);

  // Load persisted filters (server or local)
  useEffect(() => {
    const load = async () => {
      try {
        if (user) {
          const { data, error } = await supabase
            .from('filter_preferences')
            .select('filters')
            .eq('user_id', user.id)
            .single();
          if (error && error.code !== 'PGRST116') { // not found code
            console.warn('[useOptionsData] load preferences error', error);
          }
          if (data?.filters) {
            setFilters({ ...defaultFilters, ...data.filters });
            console.log('[useOptionsData] Loaded server filter preferences');
          } else {
            // Initialize row
            await supabase.from('filter_preferences').upsert({ user_id: user.id, filters: defaultFilters });
            console.log('[useOptionsData] Created initial server filter preferences');
          }
          loadedRemote.current = true;
        } else {
          // Local storage fallback
          const raw = localStorage.getItem('options_filters_v1');
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              setFilters({ ...defaultFilters, ...parsed });
              console.log('[useOptionsData] Loaded local filter preferences');
            } catch { }
          }
          loadedRemote.current = true;
        }
      } catch (e) {
        console.warn('[useOptionsData] Failed to load persisted filters', e);
        loadedRemote.current = true;
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Persist filters (debounced)
  useEffect(() => {
    if (!loadedRemote.current) return; // don't save during initial load
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = window.setTimeout(async () => {
      try {
        if (user) {
          await supabase.from('filter_preferences').upsert({ user_id: user.id, filters });
        } else {
          localStorage.setItem('options_filters_v1', JSON.stringify(filters));
        }
      } catch (e) {
        console.warn('[useOptionsData] Failed to persist filters', e);
      }
    }, 600); // 600ms debounce
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [filters, user]);

  // Expose a reset method (optional)
  (window as any).__resetOptionFilters = () => setFilters(defaultFilters);

  // Use the new Polygon hook
  // Dynamic symbol universe: if user selected symbols filter >0 use those, else use a broad default list.
  // This removes the previous hard-coded 10 symbol cap.
  const DEFAULT_SYMBOL_UNIVERSE = useMemo(() => [
    // Index & ETFs
    'SPY', 'QQQ', 'IWM', 'DIA', 'ARKK',

    // Big Tech
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA',

    // Semiconductors
    'AMD', 'INTC', 'QCOM', 'AVGO', 'MU', 'SMCI',

    // Enterprise Software / Cloud
    'CRM', 'ORCL', 'ADBE', 'SNOW', 'PLTR', 'SHOP',

    // Consumer / Retail
    'COST', 'WMT', 'PEP', 'HD', 'LOW', 'TGT', 'DIS', 'ABNB', 'NKE', 'SBUX',

    // Finance / Banks / Fintech
    'JPM', 'BAC', 'GS', 'MS', 'C', 'PYPL', 'SQ', 'COIN', 'SOFI',

    // Autos / EVs
    'F', 'GM', 'NIO', 'RIVN', 'LCID', 'UBER', 'LYFT',

    // Energy
    'XOM', 'CVX',

    // Healthcare / Biotech
    'UNH', 'JNJ', 'MRNA', 'PFE',

    // Cybersecurity
    'PANW',

    // Streaming / Media
    'NFLX'
  ], []);

  const activeSymbols = filters.symbols.length > 0 ? filters.symbols : DEFAULT_SYMBOL_UNIVERSE;

  const {
    activities: polygonActivities,
    loading,
    error,
    lastUpdate,
    refreshAll,
    fetchSingleSymbol
  } = usePolygonOptions({
    symbols: activeSymbols,
    autoRefresh: true,
    refreshInterval: 50000 // ~50s stagger to reduce rate limiting
  });

  // Trigger single symbol search when searchSymbol changes
  useEffect(() => {
    if (filters.searchSymbol && filters.searchSymbol.length >= 2) {
      fetchSingleSymbol(filters.searchSymbol.toUpperCase());
    }
  }, [filters.searchSymbol, fetchSingleSymbol]);

  const filteredActivities = useMemo(() => {
    // Don't show any data when market is completely closed
    if (!marketStatus || marketStatus.currentPeriod === 'closed') {
      return [];
    }

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
  }, [polygonActivities, filters, marketStatus]);

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