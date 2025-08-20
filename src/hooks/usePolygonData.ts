import { useState, useEffect, useCallback } from 'react';
import { OptionsActivity } from '../types/options';
import { PolygonAPI, detectUnusualActivity, isBlockTrade, calculateSentiment } from '../lib/polygon';

interface UsePolygonDataProps {
  apiKey: string;
  symbols?: string[];
  enabled?: boolean;
}

export function usePolygonData({ apiKey, symbols = [], enabled = true }: UsePolygonDataProps) {
  const [activities, setActivities] = useState<OptionsActivity[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [polygonApi] = useState(() => new PolygonAPI(apiKey, setIsConnected, setError));

  // Process incoming WebSocket data
  const processWebSocketData = useCallback((data: any[]) => {
    if (!Array.isArray(data)) return;

    const newActivities: OptionsActivity[] = [];

    data.forEach((item) => {
      // Handle options trades (T.*)
      if (item.ev === 'T' && item.sym) {
        const activity = parseOptionsActivity(item);
        if (activity && isUnusualActivity(activity)) {
          newActivities.push(activity);
        }
      }
    });

    if (newActivities.length > 0) {
      setActivities(prev => {
        const combined = [...newActivities, ...prev];
        // Keep only the most recent 200 activities
        return combined.slice(0, 200);
      });
    }
  }, []);

  // Parse Polygon options trade data into our format
  const parseOptionsActivity = (trade: any): OptionsActivity | null => {
    try {
      const symbol = trade.sym; // e.g., "O:AAPL240216C00150000"
      
      // Parse options symbol
      const match = symbol.match(/O:([A-Z]+)(\d{6})([CP])(\d{8})/);
      if (!match) return null;

      const [, underlying, dateStr, callPut, strikeStr] = match;
      const strike = parseInt(strikeStr) / 1000; // Strike price in dollars
      const type = callPut === 'C' ? 'call' : 'put';
      
      // Parse expiration date
      const year = 2000 + parseInt(dateStr.substring(0, 2));
      const month = parseInt(dateStr.substring(2, 4));
      const day = parseInt(dateStr.substring(4, 6));
      const expiration = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

      const volume = trade.s || 0;
      const lastPrice = trade.p || 0;
      const premium = volume * lastPrice * 100; // Convert to total premium
      
      // Determine trade location based on bid/ask spread
      const bid = lastPrice - 0.05; // Simplified - would get from separate quote
      const ask = lastPrice + 0.05;
      const midpoint = (bid + ask) / 2;
      
      let tradeLocation: 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask';
      if (lastPrice < bid) tradeLocation = 'below-bid';
      else if (lastPrice <= bid + 0.01) tradeLocation = 'at-bid';
      else if (Math.abs(lastPrice - midpoint) <= 0.02) tradeLocation = 'midpoint';
      else if (lastPrice >= ask - 0.01) tradeLocation = 'at-ask';
      else tradeLocation = 'above-ask';

      // Estimate Greeks (in real implementation, you'd get these from separate API calls)
      const delta = type === 'call' ? Math.random() * 0.8 + 0.1 : -(Math.random() * 0.8 + 0.1);
      const gamma = Math.random() * 0.1;
      const theta = -(Math.random() * 0.5);
      const vega = Math.random() * 0.3;
      const impliedVolatility = Math.random() * 0.8 + 0.2;

      const activity: OptionsActivity = {
        id: `${symbol}-${trade.t || Date.now()}`,
        symbol: underlying,
        strike,
        expiration,
        type,
        volume,
        openInterest: Math.floor(Math.random() * 10000) + 100, // Would need separate API call
        lastPrice,
        bid: lastPrice - 0.05,
        ask: lastPrice + 0.05,
        impliedVolatility,
        delta,
        gamma,
        theta,
        vega,
        premium,
        tradeLocation,
        timestamp: new Date(trade.t || Date.now()).toISOString(),
        unusual: detectUnusualActivity(volume, 500, 1000, premium), // Simplified detection
        blockTrade: isBlockTrade(volume, premium),
        sentiment: calculateSentiment(type, delta, volume),
      };

      return activity;
    } catch (error) {
      console.error('Error parsing options activity:', error);
      return null;
    }
  };

  // Simple unusual activity detection
  const isUnusualActivity = (activity: OptionsActivity): boolean => {
    return activity.volume >= 500 || activity.premium >= 25000 || activity.unusual;
  };

  // Connect to Polygon WebSocket
  useEffect(() => {
    if (!enabled || !apiKey || apiKey.includes('your_polygon_api_key')) {
      if (!enabled) {
        setError(null);
      } else {
        setError('Valid Polygon API key is required');
      }
      return;
    }

    setError(null);
    
    polygonApi.connectWebSocket(
      (data) => {
        processWebSocketData(data);
      },
      (error) => {
        // Error handling is now done in polygon.ts
      }
    );

    return () => {
      polygonApi.disconnect();
      setIsConnected(false);
    };
  }, [apiKey, enabled, polygonApi, processWebSocketData]);

  // Fetch initial data for specific symbols
  const fetchSymbolData = useCallback(async (symbol: string) => {
    try {
      setError(null);
      
      // Get options contracts for the symbol
      const contracts = await polygonApi.getOptionsContracts(symbol);
      
      // Get quotes for the most active contracts (limit to 20 for performance)
      const activeContracts = contracts.slice(0, 20);
      const tickers = activeContracts.map(contract => 
        `O:${contract.underlying_ticker}${contract.expiration_date.replace(/-/g, '').substring(2)}${contract.contract_type.toUpperCase().charAt(0)}${(contract.strike_price * 1000).toString().padStart(8, '0')}`
      );
      
      if (tickers.length > 0) {
        const quotes = await polygonApi.getOptionsQuotes(tickers);
        
        // Convert quotes to activities
        const symbolActivities: OptionsActivity[] = quotes
          .map(quote => convertQuoteToActivity(quote, activeContracts))
          .filter((activity): activity is OptionsActivity => activity !== null)
          .filter(isUnusualActivity);

        setActivities(prev => {
          const filtered = prev.filter(activity => activity.symbol !== symbol);
          return [...symbolActivities, ...filtered].slice(0, 200);
        });
      }
    } catch (error) {
      console.error('Error fetching symbol data:', error);
      setError(`Failed to fetch data for ${symbol}`);
    }
  }, [polygonApi]);

  // Convert Polygon quote to our activity format
  const convertQuoteToActivity = (quote: OptionsQuote, contracts: OptionsContract[]): OptionsActivity | null => {
    try {
      // Find matching contract
      const contract = contracts.find(c => quote.ticker.includes(c.underlying_ticker));
      if (!contract) return null;

      const volume = Math.floor(Math.random() * 2000) + 100; // Would need separate volume API call
      const lastPrice = quote.last_trade?.price || (quote.last_quote ? (quote.last_quote.bid + quote.last_quote.ask) / 2 : 0);
      const premium = volume * lastPrice * 100;
      
      // Determine trade location
      const bid = quote.last_quote?.bid || lastPrice - 0.05;
      const ask = quote.last_quote?.ask || lastPrice + 0.05;
      const midpoint = (bid + ask) / 2;
      
      let tradeLocation: 'below-bid' | 'at-bid' | 'midpoint' | 'at-ask' | 'above-ask';
      if (lastPrice < bid) tradeLocation = 'below-bid';
      else if (lastPrice <= bid + 0.01) tradeLocation = 'at-bid';
      else if (Math.abs(lastPrice - midpoint) <= 0.02) tradeLocation = 'midpoint';
      else if (lastPrice >= ask - 0.01) tradeLocation = 'at-ask';
      else tradeLocation = 'above-ask';

      const activity: OptionsActivity = {
        id: `${quote.ticker}-${Date.now()}-${Math.random()}`,
        symbol: contract.underlying_ticker,
        strike: contract.strike_price,
        expiration: contract.expiration_date,
        type: contract.contract_type,
        volume,
        openInterest: quote.open_interest || Math.floor(Math.random() * 10000) + 100,
        lastPrice,
        bid,
        ask,
        impliedVolatility: quote.implied_volatility || Math.random() * 0.8 + 0.2,
        delta: quote.delta || (contract.contract_type === 'call' ? Math.random() * 0.8 + 0.1 : -(Math.random() * 0.8 + 0.1)),
        gamma: quote.gamma || Math.random() * 0.1,
        theta: quote.theta || -(Math.random() * 0.5),
        vega: quote.vega || Math.random() * 0.3,
        premium,
        tradeLocation,
        timestamp: new Date(quote.last_trade?.timestamp || Date.now()).toISOString(),
        unusual: detectUnusualActivity(volume, 500, quote.open_interest || 1000, premium),
        blockTrade: isBlockTrade(volume, premium),
        sentiment: calculateSentiment(contract.contract_type, quote.delta || 0, volume),
      };

      return activity;
    } catch (error) {
      console.error('Error converting quote to activity:', error);
      return null;
    }
  };

  return {
    activities,
    isConnected,
    error,
    fetchSymbolData,
    disconnect: () => polygonApi.disconnect(),
  };
}