import { useState, useEffect, useMemo } from 'react';
import { OptionsActivity, FilterOptions } from '../types/options';
import { generateMockData } from '../data/mockData';

export function useOptionsData() {
  const [allActivities, setAllActivities] = useState<OptionsActivity[]>([]);
  const [dataSource, setDataSource] = useState<'mock' | 'realtime' | 'eod'>('mock');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
  const hasValidApiKey = polygonApiKey && polygonApiKey.length > 10 && polygonApiKey !== 'your_polygon_api_key_here';

  // Simple function to fetch real options data
  const fetchRealOptionsData = async () => {
    if (!hasValidApiKey) {
      console.log('No valid API key, using mock data');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Fetching real options data from Polygon...');
      
      // Get most active options for major symbols
      const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'SPY', 'QQQ'];
      const activities: OptionsActivity[] = [];

      for (const symbol of symbols) {
        try {
          // Get options contracts
          const contractsUrl = `https://api.polygon.io/v3/reference/options/contracts?underlying_ticker=${symbol}&limit=50&apikey=${polygonApiKey}`;
          console.log(`Fetching contracts for ${symbol}...`);
          
          const contractsResponse = await fetch(contractsUrl);
          if (!contractsResponse.ok) {
            console.error(`Failed to fetch contracts for ${symbol}: ${contractsResponse.status}`);
            continue;
          }

          const contractsData = await contractsResponse.json();
          const contracts = contractsData.results || [];
          console.log(`Found ${contracts.length} contracts for ${symbol}`);

          // Filter to active contracts (next 30 days)
          const today = new Date();
          const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          
          const activeContracts = contracts.filter((contract: any) => {
            const expDate = new Date(contract.expiration_date);
            return expDate > today && expDate <= thirtyDaysFromNow;
          }).slice(0, 10); // Limit to 10 most recent

          console.log(`Found ${activeContracts.length} active contracts for ${symbol}`);

          // Get snapshots for these contracts
          for (const contract of activeContracts) {
            try {
              const ticker = `O:${contract.underlying_ticker}${contract.expiration_date.replace(/-/g, '').substring(2)}${contract.contract_type.toUpperCase().charAt(0)}${(contract.strike_price * 1000).toString().padStart(8, '0')}`;
              
              const snapshotUrl = `https://api.polygon.io/v3/snapshot/options/${ticker}?apikey=${polygonApiKey}`;
              const snapshotResponse = await fetch(snapshotUrl);
              
              if (snapshotResponse.ok) {
                const snapshotData = await snapshotResponse.json();
                const result = snapshotData.results?.[0];
                
                if (result?.value?.day?.volume > 0) {
                  const volume = result.value.day.volume;
                  const lastPrice = result.value.last_trade?.price || result.value.day.close || 0;
                  const premium = volume * lastPrice * 100;
                  
                  // Create activity if it meets minimum thresholds
                  if (volume >= 10 && premium >= 500) {
                    const bid = result.value.last_quote?.bid || lastPrice - 0.05;
                    const ask = result.value.last_quote?.ask || lastPrice + 0.05;
                    
                    const activity: OptionsActivity = {
                      id: `${ticker}-${Date.now()}-${Math.random()}`,
                      symbol: contract.underlying_ticker,
                      strike: contract.strike_price,
                      expiration: contract.expiration_date,
                      type: contract.contract_type,
                      volume,
                      openInterest: result.value.open_interest || 1000,
                      lastPrice,
                      bid,
                      ask,
                      tradeLocation: this.getTradeLocation(lastPrice, bid, ask),
                      impliedVolatility: result.value.implied_volatility || 0.5,
                      delta: result.value.greeks?.delta || (contract.contract_type === 'call' ? 0.5 : -0.5),
                      gamma: result.value.greeks?.gamma || 0.05,
                      theta: result.value.greeks?.theta || -0.1,
                      vega: result.value.greeks?.vega || 0.2,
                      premium,
                      timestamp: new Date().toISOString(),
                      unusual: volume >= 100 || premium >= 10000,
                      blockTrade: volume >= 500 || premium >= 50000,
                      sentiment: contract.contract_type === 'call' ? 'bullish' : 'bearish',
                    };
                    
                    activities.push(activity);
                    console.log(`Added activity: ${symbol} ${contract.contract_type} ${contract.strike_price} - Volume: ${volume}, Premium: $${premium.toFixed(0)}`);
                  }
                }
              }
              
              // Delay between requests
              await new Promise(resolve => setTimeout(resolve, 100));
            } catch (contractError) {
              console.error(`Error processing contract for ${symbol}:`, contractError);
            }
          }
          
          // Delay between symbols
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (symbolError) {
          console.error(`Error processing symbol ${symbol}:`, symbolError);
        }
      }

      console.log(`Total activities found: ${activities.length}`);
      if (activities.length > 0) {
        setAllActivities(activities);
        setDataSource('realtime');
        setIsConnected(true);
      } else {
        console.log('No activities found, falling back to mock data');
        setAllActivities(generateMockData());
        setDataSource('mock');
      }

    } catch (error) {
      console.error('Error fetching real options data:', error);
      setError('Failed to fetch options data');
      setAllActivities(generateMockData());
      setDataSource('mock');
    } finally {
      setLoading(false);
    }
  };

  // Helper function for trade location
  const getTradeLocation = (lastPrice: number, bid: number, ask: number): 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask' => {
    const midpoint = (bid + ask) / 2;
    const bidThreshold = bid + (ask - bid) * 0.1;
    const askThreshold = ask - (ask - bid) * 0.1;
    
    if (lastPrice < bid) return 'below-bid';
    if (lastPrice <= bidThreshold) return 'at-bid';
    if (lastPrice >= askThreshold) return 'at-ask';
    if (lastPrice > ask) return 'above-ask';
    return 'midpoint';
  };

  // Fetch data on mount and every 30 seconds
  useEffect(() => {
    console.log('useOptionsData mounted, API key status:', {
      hasKey: !!polygonApiKey,
      keyLength: polygonApiKey?.length || 0,
      isValid: hasValidApiKey
    });

    if (hasValidApiKey) {
      console.log('Starting real data fetch...');
      fetchRealOptionsData();
      
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        console.log('Auto-refreshing options data...');
        fetchRealOptionsData();
      }, 30000);

      return () => clearInterval(interval);
    } else {
      console.log('Using mock data - no valid API key');
      setAllActivities(generateMockData());
      setDataSource('mock');
      
      // Update mock data every 5 seconds
      const interval = setInterval(() => {
        setAllActivities(generateMockData());
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [hasValidApiKey]);

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